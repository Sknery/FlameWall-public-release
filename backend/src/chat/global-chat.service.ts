import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalMessage } from './entities/global-message.entity';
import { User } from '../users/entities/user.entity';


@Injectable()
export class GlobalChatService {
  constructor(
    @InjectRepository(GlobalMessage)
    private globalMessagesRepository: Repository<GlobalMessage>,
  ) {}


  async getHistory(): Promise<GlobalMessage[]> {
    return this.globalMessagesRepository.find({
      relations: ['author', 'author.rank', 'parent', 'parent.author', 'parent.author.rank'],
      order: { created_at: 'DESC' },
      take: 50,
    });
  }


  async createMessage(author: User, content: string, parentId?: number): Promise<GlobalMessage> {
    const message = this.globalMessagesRepository.create({
      author,
      content,
      parent_id: parentId,
    });
    const savedMessage = await this.globalMessagesRepository.save(message);


    return this.globalMessagesRepository.findOneOrFail({
        where: { id: savedMessage.id },
        relations: ['author', 'author.rank', 'parent', 'parent.author', 'parent.author.rank'],
    });
  }
}
