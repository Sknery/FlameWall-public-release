import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';


@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}


  create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepository.create(createTagDto);
    return this.tagsRepository.save(tag);
  }


  findAll(): Promise<Tag[]> {
    return this.tagsRepository.find({ order: { name: 'ASC' } });
  }


  findByIds(ids: number[]): Promise<Tag[]> {
    return this.tagsRepository.findBy({ id: In(ids) });
  }


  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagsRepository.preload({ id, ...updateTagDto });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return this.tagsRepository.save(tag);
  }


  async remove(id: number): Promise<void> {
    const result = await this.tagsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }
}

