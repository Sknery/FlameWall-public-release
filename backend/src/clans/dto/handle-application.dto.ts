import { IsIn } from 'class-validator';
import { ApplicationStatus } from '../entities/clan-application.entity';


export class HandleApplicationDto {

  @IsIn([ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED])
  status: ApplicationStatus;
}
