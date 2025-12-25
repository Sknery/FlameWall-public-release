import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { ACHIEVEMENTS_CONFIG } from './achievements.config';
import * as fs from 'fs/promises';
import { join } from 'path';
import { RegisterTargetsDto } from './dto/register-targets.dto';
import { ChatGateway } from 'src/chat/chat.gateway';


@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);
  private dynamicTargets: Record<string, Record<string, string[]>> = {};
  private readonly dynamicTargetsPath = join(__dirname, '..', 'dynamic-targets.json');

  constructor(
    @InjectRepository(Achievement)
    private achievementsRepository: Repository<Achievement>,
    @InjectRepository(AchievementProgress)
    private progressRepository: Repository<AchievementProgress>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.loadDynamicTargetsFromFile();
  }


  public requestSyncFromPlugin(): void {
    this.logger.log('Sending "requestTargets" event to game plugins via WebSocket.');
    this.chatGateway.server.to('minecraft-plugins').emit('requestTargets');
  }


  async registerDynamicTargets(dto: RegisterTargetsDto): Promise<void> {
    const { pluginName, targets } = dto;
    this.logger.log(`Registering targets from plugin: ${pluginName}. Received categories: [${Object.keys(targets).join(', ')}]`);
    const existingTargets = this.dynamicTargets[pluginName] || {};
    this.dynamicTargets[pluginName] = { ...existingTargets, ...targets };
    await this.saveDynamicTargetsToFile();
  }


  private async saveDynamicTargetsToFile() {
    try {
      await fs.writeFile(this.dynamicTargetsPath, JSON.stringify(this.dynamicTargets, null, 2));
    } catch (error) {
      this.logger.error('Failed to save dynamic targets to file', error);
    }
  }


  private async loadDynamicTargetsFromFile() {
    try {
      const data = await fs.readFile(this.dynamicTargetsPath, 'utf-8');
      this.dynamicTargets = JSON.parse(data);
      this.logger.log('Successfully loaded dynamic targets from file.');
    } catch (error) {
      this.logger.warn('Dynamic targets file not found or corrupted. Starting with an empty set.');
      this.dynamicTargets = {};
    }
  }


  create(createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    if (!createAchievementDto.group_id) {
      createAchievementDto.group_id = null;
    }
    if (createAchievementDto.conditions) {
      createAchievementDto.conditions = this.processConditions(createAchievementDto.conditions);
    }
    const achievement = this.achievementsRepository.create(createAchievementDto);
    return this.achievementsRepository.save(achievement);
  }


  async findAll(): Promise<any[]> {
    const achievements = await this.achievementsRepository.find({
      relations: ['group'],
      order: { group: { display_order: 'ASC' }, name: 'ASC' }
    });

    return achievements.map(ach => {
      const safeAchievement = {
        ...ach,
        conditions: typeof ach.conditions === 'string'
          ? JSON.parse(ach.conditions)
          : ach.conditions,
        group: ach.group
          ? { id: ach.group.id, name: ach.group.name }
          : null,
      };
      delete (safeAchievement as any).progress_entries;
      return safeAchievement;
    });
  }


  async findOne(id: number): Promise<Achievement> {
    const achievement = await this.achievementsRepository.findOne({ where: { id }, relations: ['group'] });
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
    return achievement;
  }


  getAchievementConfigData() {
    const baseConfig = JSON.parse(JSON.stringify(ACHIEVEMENTS_CONFIG));
    const newTargets = {};

    const websiteEventMapping = {
      'WEBSITE_EVENT:POST_CREATED': baseConfig.targets.POST_CREATED,
      'WEBSITE_EVENT:COMMENT_CREATED': baseConfig.targets.COMMENT_CREATED,
      'WEBSITE_EVENT:FRIEND_ADDED': baseConfig.targets.FRIEND_ADDED,
      'WEBSITE_EVENT:REPUTATION_CHANGED': baseConfig.targets.REPUTATION_CHANGED
    };
    Object.assign(newTargets, websiteEventMapping);

    for (const pluginName in this.dynamicTargets) {
      try {
        const pluginTargets = this.dynamicTargets[pluginName];
        if (typeof pluginTargets !== 'object' || pluginTargets === null) continue;

        for (const groupName in pluginTargets) {
          const items = pluginTargets[groupName];
          if (!Array.isArray(items)) continue;

          for (const item of items) {
            if (typeof item !== 'string') continue;
            const parts = item.split(':');
            if (parts.length < 3) continue;
            const action = (parts[1] || '').toUpperCase();
            let eventSubtype = '';
            let specificTarget = '';

            if (action === 'KILL') {
              eventSubtype = 'PLAYER_KILL_ENTITY';
              specificTarget = item;
            } else if (action === 'BREAK') {
              eventSubtype = 'BLOCK_BREAK';
              specificTarget = item;
            } else if (action === 'ITEM') {
              eventSubtype = 'ITEM_TARGET';
              specificTarget = item;
            } else if (action === 'ACTION') {
              eventSubtype = (parts[2] || '').toUpperCase();
            }

            if (eventSubtype) {
              const eventFullType = `GAME_EVENT:${eventSubtype}`;
              if (!newTargets[eventFullType]) newTargets[eventFullType] = {};
              if (!newTargets[eventFullType][groupName]) newTargets[eventFullType][groupName] = [];
              if (specificTarget) newTargets[eventFullType][groupName].push(specificTarget);
            }
          }
        }
      } catch (e) {
        this.logger.error(`Failed to process dynamic targets for plugin: ${pluginName}`, e.stack);
      }
    }

    if (newTargets['GAME_EVENT:ITEM_TARGET']) {
      const itemTargets = newTargets['GAME_EVENT:ITEM_TARGET'];
      const itemActions = ['PLAYER_ITEM_BREAK', 'ITEM_CRAFT', 'ITEM_CONSUME', 'PLAYER_ENCHANT_ITEM'];
      for (const action of itemActions) {
        const key = `GAME_EVENT:${action}`;
        newTargets[key] = { ...(newTargets[key] || {}), ...itemTargets };
      }
      delete newTargets['GAME_EVENT:ITEM_TARGET'];
    }

    return { ...baseConfig, targets: newTargets };
  }


  async update(id: number, updateAchievementDto: UpdateAchievementDto): Promise<Achievement> {
    if (updateAchievementDto.hasOwnProperty('group_id') && !updateAchievementDto.group_id) {
      updateAchievementDto.group_id = null;
    }
    if (updateAchievementDto.conditions) {
      updateAchievementDto.conditions = this.processConditions(updateAchievementDto.conditions);
    }
    const achievement = await this.achievementsRepository.preload({ id: id, ...updateAchievementDto });
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
    return this.achievementsRepository.save(achievement);
  }


  private processConditions(conditions: any): any {
    if (conditions && Array.isArray(conditions.conditions)) {
      conditions.conditions.forEach(cond => {
        if (cond.specific_target) {
          cond.target = `${cond.target}:${cond.specific_target}`;
          delete cond.specific_target;
        }
      });
    }
    return conditions;
  }


  async remove(id: number): Promise<void> {
    const result = await this.achievementsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
  }


  async findAllForUser(userId: number): Promise<{ grouped: any[], single: any[] }> {
    const allAchievements = await this.achievementsRepository.find({
      where: { is_enabled: true },
      relations: ['group'],
      order: { name: 'ASC' },
    });

    const userProgress = await this.progressRepository.find({ where: { user_id: userId } });
    const progressMap = new Map(userProgress.map(p => [p.achievement_id, p]));
    const groupedResult = new Map<number, { groupInfo: any, achievements: any[] }>();
    const singleResult: any[] = [];

    for (const achievement of allAchievements) {
      let progress = progressMap.get(achievement.id);
      if (!progress) {
        progress = this.progressRepository.create({
          user_id: userId,
          achievement_id: achievement.id,
          is_completed: false,
          progress_data: {}
        });
      }
      const achievementWithProgress = { ...achievement, progress };

      if (achievement.group) {
        if (!groupedResult.has(achievement.group.id)) {
          groupedResult.set(achievement.group.id, {
            groupInfo: achievement.group,
            achievements: [],
          });
        }
        groupedResult.get(achievement.group.id)!.achievements.push(achievementWithProgress);
      } else {
        singleResult.push(achievementWithProgress);
      }
    }
    return {
      grouped: Array.from(groupedResult.values()),
      single: singleResult,
    };
  }


  public async findPeriodicChecks(): Promise<Achievement[]> {
    this.logger.log('[API-REQ] A plugin is fetching periodic check configurations.');
    return this.achievementsRepository
      .createQueryBuilder("achievement")
      .where("achievement.is_enabled = :isEnabled", { isEnabled: true })
      .andWhere(`"achievement"."conditions"::text LIKE :trigger`, {
        trigger: '%"trigger":"PERIODIC_CHECK"%'
      })
      .getMany();
  }
}
