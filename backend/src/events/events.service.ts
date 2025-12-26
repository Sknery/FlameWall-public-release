import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../achievements/entities/achievement.entity';
import { AchievementProgress } from '../achievements/entities/achievement-progress.entity';
import { User } from '../users/entities/user.entity';
import { PendingCommand } from '../shop/entities/pending-command.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as _ from 'lodash';
import { Comment } from '../comments/entities/comment.entity';
import { ServerGroup } from 'src/achievements/entities/server-group.entity';


@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectRepository(Achievement)
        private achievementsRepository: Repository<Achievement>,
        @InjectRepository(AchievementProgress)
        private progressRepository: Repository<AchievementProgress>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(PendingCommand)
        private pendingCommandsRepository: Repository<PendingCommand>,
        private eventEmitter: EventEmitter2,
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(ServerGroup)
        private serverGroupsRepository: Repository<ServerGroup>,
    ) { }


    public async processEvent(eventType: string, userId: number, serverGroup: string, eventData: any = {}): Promise<void> {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            this.logger.warn(`[PROCESS_EVENT] User with ID ${userId} not found. Skipping event ${eventType}.`);
            return;
        }

        this.logger.log(`[PROCESS_EVENT] Received event '${eventType}' for User ID ${userId} from Server Group '${serverGroup}'.`);

        const relevantAchievements = await this.getRelevantAchievements(eventType.split(':')[0]);
        if (relevantAchievements.length === 0) {
            return;
        }

        this.logger.verbose(`Found ${relevantAchievements.length} relevant achievements for event type '${eventType}'.`);

        for (const achievement of relevantAchievements) {
            await this.updateProgressForAchievement(user, achievement, eventType, serverGroup, eventData);
        }

        if (serverGroup && serverGroup !== 'website') {
            await this.serverGroupsRepository.upsert({ name: serverGroup }, ['name']);
        }
    }


    public async triggerWebsiteEvent(subType: string, userId: number, eventData: any = {}): Promise<void> {
        const eventType = `WEBSITE_EVENT:${subType}`;
        await this.processEvent(eventType, userId, 'website', eventData);
    }


    private getRelevantAchievements(baseTrigger: string) {
        return this.achievementsRepository
            .createQueryBuilder("achievement")
            .where("achievement.is_enabled = :isEnabled", { isEnabled: true })
            .andWhere(`achievement.conditions -> 'conditions' @> '[{"trigger": "${baseTrigger}"}]'`)
            .getMany();
    }


    private async updateProgressForAchievement(user: User, achievement: Achievement, eventType: string, serverGroup: string, eventData: any) {
        let progress = await this.progressRepository.findOne({
            where: { user_id: user.id, achievement_id: achievement.id }
        });

        if (progress?.is_completed) return;

        if (!progress) {
            progress = this.progressRepository.create({
                user_id: user.id,
                achievement_id: achievement.id,
                progress_data: {}
            });
        }

        let progressChanged = false;
        const conditions = achievement.conditions?.conditions || [];

        for (const condition of conditions) {
            if (condition.server_groups && Array.isArray(condition.server_groups) && condition.server_groups.length > 0) {
                if (!condition.server_groups.includes(serverGroup)) {
                    continue;
                }
            }

            if (condition.trigger === eventType.split(':')[0] && condition.target === eventType) {
                const allChecksPassed = this.validateChecks(condition.checks || [], eventData);

                if (allChecksPassed) {
                    const conditionKey = `condition_${condition.index}`;
                    const value = typeof eventData.value === 'number' ? eventData.value : 1;

                    if (condition.tracking === 'state') {
                        progress.progress_data[conditionKey] = value;
                    } else {
                        progress.progress_data[conditionKey] = (progress.progress_data[conditionKey] || 0) + value;
                    }
                    progressChanged = true;
                }
            }
        }

        if (progressChanged) {
            const savedProgress = await this.progressRepository.save(progress);
            await this.checkAndCompleteAchievement(user, achievement, savedProgress);
        }
    }


    private validateChecks(checks: any[], eventData: any): boolean {
        for (const check of checks) {
            const fullPath = `${check.source}.${check.property}`;
            const actualValue = _.get(eventData.snapshot, fullPath);

            if (actualValue === undefined) {
                this.logger.warn(`[Check-Validate] Property at path "${fullPath}" not found in eventData.snapshot`);
                return false;
            }

            let checkPassed = false;
            const requiredValue = check.value;

            switch (check.operator) {
                case '==':
                    checkPassed = String(actualValue) == String(requiredValue);
                    break;
                case '>=':
                    checkPassed = Number(actualValue) >= Number(requiredValue);
                    break;
                case '<=':
                    checkPassed = Number(actualValue) <= Number(requiredValue);
                    break;
                case 'contains':
                    checkPassed = Array.isArray(actualValue) && actualValue.map(String).includes(String(requiredValue));
                    break;
                default:
                    checkPassed = false;
            }

            this.logger.debug(`[Check-Validate] Path: "${fullPath}", Game Value: "${actualValue}" (${typeof actualValue}), Operator: "${check.operator}", Required: "${requiredValue}" (${typeof requiredValue}). Result: ${checkPassed ? '✅' : '❌'}`);

            if (!checkPassed) {
                return false;
            }
        }
        return true;
    }


    private async checkAndCompleteAchievement(user: User, achievement: Achievement, progress: AchievementProgress) {
        const logic = achievement.conditions?.logic || 'AND';
        const conditions = achievement.conditions?.conditions || [];

        if (conditions.length === 0) return;

        let allConditionsMet = logic === 'AND';

        for (const condition of conditions) {
            const conditionKey = `condition_${condition.index}`;
            const currentProgress = progress.progress_data[conditionKey] || 0;
            const requiredCount = condition.count;

            const isConditionMet = currentProgress >= requiredCount;

            if (logic === 'AND') {
                if (!isConditionMet) {
                    allConditionsMet = false;
                    break;
                }
            } else {
                if (isConditionMet) {
                    allConditionsMet = true;
                    break;
                }
            }
        }

        if (allConditionsMet && !progress.is_completed) {
            progress.is_completed = true;
            progress.completed_at = new Date();
            await this.progressRepository.save(progress);

            this.logger.log(`ACHIEVEMENT COMPLETED: User ${user.username} (ID: ${user.id}) has completed "${achievement.name}"!`);

            // Award coins if specified
            if (achievement.reward_coins && achievement.reward_coins > 0) {
                await this.usersRepository.increment({ id: user.id }, 'balance', achievement.reward_coins);
                this.logger.log(`COINS AWARDED: User ${user.username} (ID: ${user.id}) received ${achievement.reward_coins} coins for completing "${achievement.name}"!`);
            }

            // Execute reward command if specified
            if (achievement.reward_command && user.minecraft_username) {
                const command = achievement.reward_command.replace('{username}', user.minecraft_username);
                const newCommand = this.pendingCommandsRepository.create({ command });
                await this.pendingCommandsRepository.save(newCommand);
                this.eventEmitter.emit('command.queued');
            }
        }
    }


    @OnEvent('comment.created', { async: true })
    async handleCommentCreated(payload: { authorId: number }) {
        this.logger.log(`[Event Caught] Caught 'comment.created' for author ID: ${payload.authorId}`);
        try {
            const totalComments = await this.commentsRepository.count({
                where: { authorId: payload.authorId },
            });
            await this.triggerWebsiteEvent('COMMENT_CREATED', payload.authorId, { value: totalComments });
        } catch (error) {
            this.logger.error('Failed to process comment.created event', error.stack);
        }
    }
}
