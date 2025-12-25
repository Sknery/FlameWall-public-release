import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BanReason } from './entities/ban-reason.entity';
import { CreateBanReasonDto } from './dto/create-ban-reason.dto';


@Injectable()
export class BanReasonsService {
  constructor(
    @InjectRepository(BanReason)
    private reasonsRepository: Repository<BanReason>,
  ) {}


  create(dto: CreateBanReasonDto): Promise<BanReason> {
    const reason = this.reasonsRepository.create(dto);
    return this.reasonsRepository.save(reason);
  }


  findAll(): Promise<BanReason[]> {
    return this.reasonsRepository.find({ order: { created_at: 'ASC' } });
  }


  async remove(id: number): Promise<void> {
    const result = await this.reasonsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ban reason with ID ${id} not found`);
    }
  }
}
