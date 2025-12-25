import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementGroup } from './entities/achievement-group.entity';
import { CreateAchievementGroupDto } from './dto/create-achievement-group.dto';
import { UpdateAchievementGroupDto } from './dto/update-achievement-group.dto';
import { ServerGroup } from './entities/server-group.entity';


@Injectable()
export class AchievementGroupsService {
  constructor(
    @InjectRepository(AchievementGroup)
    private groupsRepository: Repository<AchievementGroup>,
    @InjectRepository(ServerGroup)
    private serverGroupsRepository: Repository<ServerGroup>,
  ) { }


  findAll(): Promise<AchievementGroup[]> {
    return this.groupsRepository.find({ order: { display_order: 'ASC', name: 'ASC' } });
  }


  async findOne(id: number): Promise<AchievementGroup> {
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Achievement group with ID ${id} not found`);
    }
    return group;
  }


  create(dto: CreateAchievementGroupDto): Promise<AchievementGroup> {
    const group = this.groupsRepository.create(dto);
    return this.groupsRepository.save(group);
  }


  async update(id: number, dto: UpdateAchievementGroupDto): Promise<AchievementGroup> {
    const group = await this.groupsRepository.preload({ id, ...dto });
    if (!group) {
      throw new NotFoundException(`Achievement group with ID ${id} not found`);
    }
    return this.groupsRepository.save(group);
  }


  async remove(id: number): Promise<void> {
    const result = await this.groupsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Achievement group with ID ${id} not found`);
    }
  }


  findAllServerGroups(): Promise<ServerGroup[]> {
    return this.serverGroupsRepository.find({ order: { name: 'ASC' } });
  }
}
