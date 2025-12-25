import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { EventsService } from './events.service';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { IsString, IsNotEmpty, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class EventDto {
  @IsString()
  eventType: string;
}


class EventBatchDto {
  @IsString()
  playerUuid: string;

  @IsString()
  server_group: string;

  @IsObject()
  snapshot: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events: EventDto[];
}


@ApiTags('Internal')
@Controller('internal')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService, private readonly usersService: UsersService) { }


  @Post('event-ingest')
  @UseGuards(PluginApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Endpoint for receiving game events from the proxy.' })
  @ApiHeader({ name: 'x-api-key', required: true })
  async handleGameEvent(@Body() eventDto: any) {
    const responseMessage = { message: 'Event accepted for processing.' };
    this.processGameEventInBackground(eventDto);
    return responseMessage;
  }


  private async processGameEventInBackground(batchDto: any): Promise<void> {
    const { playerUuid, snapshot, events, server_group } = batchDto;

    if (!playerUuid || !snapshot || !events || !Array.isArray(events) || !server_group) {
      this.logger.warn(`Received incomplete game event batch: ${JSON.stringify(batchDto)}`);
      return;
    }

    const user = await this.usersService.findUserByMinecraftUuid(playerUuid);
    if (!user) {
      this.logger.warn(`User with UUID ${playerUuid} not found. Skipping batch.`);
      return;
    }

    for (const event of events) {
      if (!event.eventType) continue;
      try {
        await this.eventsService.processEvent(
          event.eventType,
          user.id,
          server_group,
          { snapshot }
        );
      } catch (e) {
        this.logger.error(`Failed to process sub-event: ${JSON.stringify(event)}`, e.stack);
      }
    }
  }


  @Post('rank-sync')
  @UseGuards(PluginApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Endpoint for receiving rank updates from a game server.' })
  @ApiHeader({ name: 'x-api-key', required: true })
  async syncRank(@Body() rankSyncDto: { minecraftUuid: string; newRankSystemName: string }) {
    this.logger.log(`[RANK-SYNC-HTTP] 🔄 Received rank update for UUID ${rankSyncDto.minecraftUuid} to rank "${rankSyncDto.newRankSystemName}"`);
    await this.usersService.updateRankFromGameEvent(rankSyncDto.minecraftUuid, rankSyncDto.newRankSystemName);
    return { message: 'Rank sync accepted.' };
  }
}
