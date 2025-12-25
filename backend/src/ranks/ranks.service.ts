

import { Injectable, OnModuleInit, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Rank } from './entities/rank.entity';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { User } from '../users/entities/user.entity';

export const SystemRanks = {
  OWNER: { id: 1, name: 'Owner', system_name: 'owner', power_level: 999, display_color: '#AA0000', is_removable: false },
  ADMIN: { id: 2, name: 'Admin', system_name: 'admin', power_level: 900, display_color: '#FF5555', is_removable: false },
  MODERATOR: { id: 3, name: 'Moderator', system_name: 'moderator', power_level: 800, display_color: '#5555FF', is_removable: false },
  DEFAULT: { id: 4, name: 'Default', system_name: 'default', power_level: 1, display_color: '#AAAAAA', is_removable: false },
};

@Injectable()
export class RanksService implements OnModuleInit {
  private readonly logger = new Logger(RanksService.name);

  constructor(
    @InjectRepository(Rank)
    private ranksRepository: Repository<Rank>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {

    if (process.env.NODE_ENV === 'test') return;

    if (process.env.NODE_ENV === 'migration') {
      this.logger.log('Migration mode detected. Skipping initial rank seeding.');
      return;
    }

    this.logger.log(`[SEED] 🌱 Checking for initial system ranks on module initialization...`);
    await this.seedInitialRanks();
  }

  private async seedInitialRanks() {
    for (const rankDetails of Object.values(SystemRanks)) {
      const rankExists = await this.ranksRepository.findOneBy({ id: rankDetails.id });
      if (!rankExists) {
        this.logger.log(`[SEED] 🌱 System rank "${rankDetails.name}" not found. Seeding now...`);
        const newRank = this.ranksRepository.create(rankDetails);
        await this.ranksRepository.save(newRank);
      } else {
        this.logger.verbose(`[SEED] 🌱 System rank "${rankDetails.name}" already exists. Skipping.`);
      }
    }
  }

  async create(createRankDto: CreateRankDto): Promise<Rank> {
    const existingRank = await this.ranksRepository.findOne({
      where: [{ name: createRankDto.name }, { power_level: createRankDto.power_level }, { system_name: createRankDto.system_name }]
    });
    if (existingRank) {
      this.logger.warn(`[CREATE-FAIL] ⚠️ Conflict: Rank with this name, system_name, or power level already exists. Input: ${JSON.stringify(createRankDto)}`);
      throw new ConflictException('Rank with this name, system_name, or power level already exists.');
    }

    const rank = this.ranksRepository.create(createRankDto);
    const savedRank = await this.ranksRepository.save(rank);
    this.logger.log(`[CREATE-SUCCESS] ✅ Successfully created rank "${savedRank.name}" with ID: ${savedRank.id}`);
    return savedRank;
  }

  findAll(): Promise<Rank[]> {
    return this.ranksRepository.find({ order: { power_level: 'DESC' } });
  }

  async findOne(id: number): Promise<Rank> {
    const rank = await this.ranksRepository.findOneBy({ id });
    if (!rank) {
      this.logger.warn(`[GET-ONE-FAIL] ⚠️ Rank with ID ${id} not found.`);
      throw new NotFoundException(`Rank with ID ${id} not found.`);
    }
    return rank;
  }

  async update(id: number, updateRankDto: UpdateRankDto): Promise<Rank> {
    const rank = await this.findOne(id);
    if (!rank.is_removable) {
      if (updateRankDto.power_level) {
        this.logger.warn(`[UPDATE-DENIED] 🚫 Attempt to change power_level of a non-removable system rank (ID: ${id}) was prevented.`);
      }
      delete updateRankDto.power_level;
    }

    Object.assign(rank, updateRankDto);
    const updatedRank = await this.ranksRepository.save(rank);
    this.logger.log(`[UPDATE-SUCCESS] ✅ Rank ID: ${id} ("${updatedRank.name}") was successfully updated.`);
    return updatedRank;
  }

  async remove(id: number, migrationRankId?: number): Promise<void> {
    this.logger.log(`[DELETE-TX-START] 🗑️ Starting transaction to delete Rank ID: ${id}.`);
    return this.dataSource.transaction(async (manager) => {
      const rankToRemove = await manager.findOneBy(Rank, { id });

      if (!rankToRemove) {
        throw new NotFoundException(`Rank with ID ${id} not found.`);
      }
      if (!rankToRemove.is_removable) {
        this.logger.error(`[DELETE-FAIL] 🚫 Attempt to delete a non-removable system rank (ID: ${id}).`);
        throw new ConflictException('Cannot delete a system rank.');
      }

      const usersWithRank = await manager.find(User, { where: { rank_id: id } });

      if (usersWithRank.length > 0) {
        if (!migrationRankId) {
          this.logger.warn(`[DELETE-CONFLICT] ⚠️ Rank ID ${id} is assigned to ${usersWithRank.length} user(s). Migration rank ID is required.`);
          throw new ConflictException(`Rank is currently assigned to ${usersWithRank.length} user(s). Please provide a migration rank.`);
        }
        if (migrationRankId === id) {
          this.logger.error(`[DELETE-FAIL] ❌ Cannot migrate users to the same rank that is being deleted (ID: ${id}).`);
          throw new ConflictException('Cannot migrate users to the same rank that is being deleted.');
        }
        const migrationRank = await manager.findOneBy(Rank, { id: migrationRankId });
        if (!migrationRank) {
          this.logger.error(`[DELETE-FAIL] ❌ Migration target rank with ID ${migrationRankId} not found.`);
          throw new NotFoundException(`Migration rank with ID ${migrationRankId} not found.`);
        }

        const userIdsToUpdate = usersWithRank.map(user => user.id);
        this.logger.log(`[DELETE-MIGRATE] ➡️ Migrating ${userIdsToUpdate.length} user(s) to Rank ID: ${migrationRankId} ("${migrationRank.name}")...`);
        await manager.update(User, userIdsToUpdate, { rank_id: migrationRankId });
      } else {
        this.logger.log(`[DELETE] ➡️ No users assigned to Rank ID ${id}. Proceeding with simple deletion.`);
      }

      await manager.remove(Rank, rankToRemove);
      this.logger.warn(`[DELETE-SUCCESS] ✅ Successfully deleted Rank ID: ${id} ("${rankToRemove.name}") and migrated users (if any).`);
    });
  }

  async findDefaultRank(): Promise<Rank> {
    const rank = await this.ranksRepository.findOneBy({ id: SystemRanks.DEFAULT.id });
    if (!rank) throw new InternalServerErrorException('Default rank not found in database.');
    return rank;
  }

  async findRankBySystemName(systemName: string): Promise<Rank | null> {
    this.logger.verbose(`[DB-QUERY] 💾 Finding rank by system_name: ${systemName}`);
    return this.ranksRepository.findOne({ where: { system_name: ILike(systemName) } });
  }

  async findOwnerRank(): Promise<Rank> {
    const rank = await this.ranksRepository.findOneBy({ id: SystemRanks.OWNER.id });
    if (!rank) throw new InternalServerErrorException('Owner rank not found in database.');
    return rank;
  }
}