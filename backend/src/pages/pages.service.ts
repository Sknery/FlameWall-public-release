
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomPage } from './entities/page.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { User } from 'src/users/entities/user.entity';
import { PageCategory } from './entities/page-category.entity';
import { UpdatePageCategoryDto } from './dto/update-page-category.dto';
import { CreatePageCategoryDto } from './dto/create-page-category.dto';

const initialPages = [
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `
            <p><strong>Last Updated:</strong> July 2, 2025</p>
            <p>Welcome to FlameWall! This Terms of Service ("Agreement") governs your use of the FlameWall website, services, and game integrations (the "Service"). By registering for or using our Service, you agree that you have read, understood, and agree to be bound by this Agreement.</p>

            <h4>1. Your Account</h4>
            <p>You are solely responsible for maintaining the security of your account and password. You agree not to share your login credentials with any third party. You must notify the administration immediately of any unauthorized use of your account.</p>

            <h4>2. Code of Conduct & Prohibited Content</h4>
            <p>You agree not to use the Service to post, store, or transmit content that:</p>
            <ul>
                <li>Is illegal, harmful, threatening, abusive, discriminatory, or incites hatred.</li>
                <li>Infringes on intellectual property rights (copyrights, trademarks).</li>
                <li>Contains pornographic material or graphic violence.</li>
                <li>Constitutes unauthorized advertising, spam, or fraudulent schemes.</li>
                <li>Discloses the private information of others without their consent.</li>
                <li>Contains malicious code (viruses, trojans).</li>
            </ul>
            <p>Impersonating another person or a member of the administration is strictly forbidden.</p>

            <h4>3. User-Generated Content</h4>
            <p>You retain the rights to the content (posts, comments, messages) you create. However, by publishing it on our Service, you grant us a non-exclusive, royalty-free, worldwide license to use, distribute, display, and reproduce this content in connection with the operation of the Service.</p>

            <h4>4. Moderation & Termination</h4>
            <ul>
                <li>We do not perform pre-moderation and do not review private messages on our own initiative.</li>
                <li>While a full reporting system is under development, you can report any violations or inappropriate content by sending a detailed email to <b>sknery.official@gmail.com</b>. Upon receiving a report, an authorized administrator has the right to review the reported content to make a decision.</li>
                <ListItem>
                    While a full reporting system is under development, you can report any violations or inappropriate content by sending a detailed email to <b>sknery.official@gmail.com</b>. Upon receiving a report, an authorized administrator has the right to review the reported content to make a decision.
                </ListItem>
                <li>We may use automated systems to detect content that potentially violates these Rules.</li>
                <li>For gross or systematic violations of the rules, your account may be temporarily or permanently suspended (banned).</li>
            </ul>

            <h4>5. Minecraft Integration</h4>
            <p>By linking your Minecraft game account to the Service, you consent to the synchronization of your in-game username, online status, and friends list to enable the features of the Service.</p>

            <h4>6. Disclaimer of Warranties</h4>
            <p>The Service is provided "as is." We make no warranties that it will operate uninterrupted or error-free.</p>

            <h4>7. Changes to Terms</h4>
            <p>We may revise this Agreement from time to time. The most current version will always be available on this page. By continuing to use the Service after changes become effective, you agree to be bound by the revised Agreement.</p>
        `
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `
            <p><strong>Last Updated:</strong> July 2, 2025</p>
            <p>This Privacy Policy explains what information we collect and why, how we use it, and how you can manage your information.</p>

            <h4>1. Information We Collect</h4>
            <h5>Information You Provide:</h5>
            <ul>
                <li><b>On Registration:</b> Your username, email address, and a hashed password.</li>
                <li><b>In Your Profile:</b> A description, URLs for your avatar and banner, and a unique <code>slug</code> for your profile.</li>
                <li><b>Generated Content:</b> Posts, comments, and private messages.</li>
            </ul>
            <h5>Information Collected Automatically:</h5>
            <ul>
                <li><b>Usage Data:</b> IP address, browser type, and login information.</li>
                <li><b>Minecraft Data:</b> When you link your account, we store your Minecraft UUID and username.</li>
            </ul>

            <h4>2. How We Use Your Information</h4>
            <ul>
                <li>To provide and maintain the operation of the Service.</li>
                <li>To authenticate you and ensure the security of your account.</li>
                <li>To communicate with you regarding important matters related to your account.</li>
                <li>To moderate content and enforce our rules.</li>
                <li>To provide integrated features, such as the chat between the website and the game.</li>
            </ul>

            <h4>3. How We Share Your Information</h4>
            <p>We do <b>not sell or transfer</b> your personal information to third parties, except in the following cases:</p>
            <ul>
                <li>With your explicit consent.</li>
                <li>In response to a lawful request from law enforcement authorities.</li>
                <li>To protect our rights, property, or safety, or the rights, property, or safety of our users or the public.</li>
            </ul>
            <p>Your username, rank, online status, and public content (posts, comments) are visible to other users of the Service. Your private messages are visible only to you and your conversation partner.</p>

            <h4>4. Data Security</h4>
            <p>We take reasonable measures to protect your information. Passwords are stored in a hashed format using <code>bcrypt</code>. Access to data is restricted and carried out over secure protocols.</p>

            <h4>5. Data Retention</h4>
            <p>We store your information as long as you have an account on our Service. You can delete your account in your profile settings. Upon deletion, your personal data will be deleted or anonymized in accordance with technical capabilities.</p>

            <h4>6. Contact Us</h4>
            <p>If you have any questions about this Policy, please contact us at: <b>sknery.official@gmail.com</b>.</p>
        `
  }
];

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);
  private domPurify;

  constructor(
    @InjectRepository(CustomPage)
    private pagesRepository: Repository<CustomPage>,

    @InjectRepository(PageCategory)
    private categoriesRepository: Repository<PageCategory>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

  ) {
    const window = new JSDOM('').window;
    this.domPurify = DOMPurify(window);
  }

  async onModuleInit() {
    this.seedInitialPages();
  }

  private async seedInitialPages() {
    this.logger.log('Checking for initial service pages...');
    try {
      const author = await this.usersRepository.findOneBy({ id: 1 });
      if (!author) {
        this.logger.warn('Cannot seed pages, user with ID 1 (Owner) not found. Pages will need to be created manually.');
        return;
      }

      for (const pageData of initialPages) {
        const existingPage = await this.pagesRepository.findOneBy({ slug: pageData.slug });
        if (!existingPage) {
          const newPage = this.pagesRepository.create({
            ...pageData,
            author_id: author.id,
            is_published: true,          });
          await this.pagesRepository.save(newPage);
          this.logger.log(`Successfully seeded page: ${pageData.title}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed initial pages', error);
    }
  }

  async create(createPageDto: CreatePageDto, authorId: number): Promise<CustomPage> {
    const { title, content, category_id } = createPageDto;    this.logger.log(`[CREATE] 📄 User ID: ${authorId} is creating a new page titled: "${title}"`);

    const sanitizedContent = this.domPurify.sanitize(content);
    const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const newPage = this.pagesRepository.create({
      title,
      slug,
      content: sanitizedContent,
      author_id: authorId,
      is_published: false,
      category_id: category_id,    });
    return this.pagesRepository.save(newPage);
  }

  findAllForAdmin(): Promise<CustomPage[]> {
    this.logger.verbose('[GET-ALL-ADMIN] 🔎 Fetching all custom pages for admin panel.');
    return this.pagesRepository.find({ order: { updated_at: 'DESC' } });
  }

  async findOneForAdmin(id: number): Promise<CustomPage> {
    this.logger.verbose(`[GET-ONE-ADMIN] 🔎 Fetching page ID: ${id} for admin panel.`);
    const page = await this.pagesRepository.findOneBy({ id });
    if (!page) throw new NotFoundException(`Page with ID ${id} not found.`);
    return page;
  }

  async update(id: number, updatePageDto: UpdatePageDto): Promise<CustomPage> {
    this.logger.log(`[UPDATE] 📝 Updating page ID: ${id}`);
    const page = await this.findOneForAdmin(id);

    if (updatePageDto.hasOwnProperty('category_id') && !updatePageDto.category_id) {
      updatePageDto.category_id = null;
    }

    if (updatePageDto.content) {
      updatePageDto.content = this.domPurify.sanitize(updatePageDto.content);
    }

    Object.assign(page, updatePageDto);
    return this.pagesRepository.save(page);
  }

  async remove(id: number): Promise<void> {
    this.logger.warn(`[DELETE] 🗑️ Deleting page ID: ${id}`);
    const result = await this.pagesRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Page with ID ${id} not found.`);
  }

  async findOnePublic(slug: string): Promise<CustomPage> {
    this.logger.verbose(`[GET-PUBLIC] 🔎 Public request for page with slug: ${slug}`);
    const page = await this.pagesRepository.findOne({ where: { slug, is_published: true } });
    if (!page) throw new NotFoundException('This page does not exist or is not published.');
    return page;
  }

  createCategory(dto: CreatePageCategoryDto): Promise<PageCategory> {
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  findAllCategories(): Promise<PageCategory[]> {
    return this.categoriesRepository.find({ order: { display_order: 'ASC', name: 'ASC' } });
  }

  async updateCategory(id: number, dto: UpdatePageCategoryDto): Promise<PageCategory> {
    const category = await this.categoriesRepository.preload({ id, ...dto });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async findSidebarCategories() {
    const categories = await this.categoriesRepository.find({
      relations: ['pages'],
      where: { pages: { is_published: true } },
      order: { display_order: 'ASC', name: 'ASC' }
    });

    return categories
      .filter(category => category.pages.length > 0)      .map(category => ({
        name: category.name,
        subItems: category.pages
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(page => ({
            name: page.title,
            path: `/p/${page.slug}`
          }))
      }));
  }
}