

import { Entity, PrimaryColumn } from 'typeorm';


@Entity('server_groups')
export class ServerGroup {

  @PrimaryColumn({ type: 'varchar', length: 100 })
  name: string;
}