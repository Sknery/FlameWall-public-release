import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { User } from '../users/entities/user.entity';
import { UpdateNewsDto } from './dto/update-news.dto';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private domPurify;

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
      const window = new JSDOM('').window;
      this.domPurify = DOMPurify(window);
  }

  async create(createNewsDto: CreateNewsDto, authorId: number): Promise<News> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) {
      this.logger.error(`[CREATE-FAIL] ❌ Author with ID ${authorId} not found. Cannot create news.`);
      throw new ForbiddenException('Authenticated user not found.');
    }

    const sanitizedDesc = this.domPurify.sanitize(createNewsDto.desc);

    const newsItem = this.newsRepository.create({
      ...createNewsDto,
      desc: sanitizedDesc,      author: author,
    });
    const savedNews = await this.newsRepository.save(newsItem);
    this.logger.log(`[CREATE-SUCCESS] ✅ User ID: ${authorId} created News ID: ${savedNews.id} titled: "${savedNews.name}"`);
    return savedNews;
  }

  async findAll(): Promise<News[]> {
    return this.newsRepository.find({
       relations: ['author'],
      order: {
        created_at: 'DESC',
      }
    });
  }

  async findOne(id: number): Promise<News> {
    const newsItem = await this.newsRepository.findOne({
      where: { id },
      relations: ['author']
    });
    if (!newsItem) {
      this.logger.warn(`[GET-ONE-FAIL] ⚠️ News item with ID ${id} not found.`);
      throw new NotFoundException(`News item with ID ${id} not found`);
    }
    return newsItem;
  }

  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<News> {
    const newsItem = await this.findOne(id);

    if (updateNewsDto.desc) {
        updateNewsDto.desc = this.domPurify.sanitize(updateNewsDto.desc);
    }

    Object.assign(newsItem, updateNewsDto);

    const updatedNews = await this.newsRepository.save(newsItem);
    this.logger.log(`[UPDATE-SUCCESS] ✅ News article ID: ${id} was successfully updated.`);
    return updatedNews;
  }

  async remove(id: number): Promise<void> {
    const newsItem = await this.findOne(id);
    await this.newsRepository.remove(newsItem);
    this.logger.warn(`[DELETE-SUCCESS] 🗑️ News article ID: ${id} was successfully deleted.`);
  }
}