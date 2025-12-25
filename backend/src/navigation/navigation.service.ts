
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PageCategory } from '../pages/entities/page-category.entity';
import { CustomPage } from 'src/pages/entities/page.entity';

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(PageCategory)
    private categoriesRepository: Repository<PageCategory>,
    @InjectRepository(CustomPage)
    private pagesRepository: Repository<CustomPage>,
  ) { }

  async getSidebarStructure() {
    const staticItems = [
      { name: 'Home', icon: 'Home', path: '/' },
      { name: 'News', icon: 'Newspaper', path: '/news' },
      {
        name: 'Community', icon: 'Users', subItems: [
          { name: 'Posts', icon: 'MessageSquare', path: '/posts' },
          { name: 'Players', icon: 'Users', path: '/players' },
          { name: 'Clans', icon: 'Shield', path: '/clans' },
        ],
      },
      {
        name: 'Store', icon: 'Store', path: '/shop', isExternalShop: true
      },
      {
        name: 'My Profile', icon: 'User', authRequired: true, subItems: [
          { name: 'My Clan', icon: 'Shield', path: '#' },
          { name: 'Feed', icon: 'Rss', path: '/feed' },
          { name: 'Profile', icon: 'User', path: '/profile/me' },
          { name: 'Messages', icon: 'MessageSquare', path: '/messages' },
          { name: 'Friends', icon: 'HeartHandshake', path: '/friends' },
          { name: 'Achievements', icon: 'Award', path: '/achievements' },
          { name: 'Settings', icon: 'Settings', path: '/profile/settings' },
        ]
      },
      {
        name: 'Admin Panel', icon: 'Shield', adminRequired: true, subItems: [
          { name: 'User Dashboard', icon: 'Users', path: '/admin/users' },
          { name: 'Posts Dashboard', icon: 'Newspaper', path: '/admin/posts' },
          { name: 'Shop Analytics', icon: 'LineChart', path: '/admin/shop-dashboard' },
          { name: 'Manage Items', icon: 'Store', path: '/admin/shop' },
          { name: 'Ranks', icon: 'Crown', path: '/admin/ranks' },
          { name: 'Pages', icon: 'BookUser', path: '/admin/pages' },
          { name: 'Categories', icon: 'Library', path: '/admin/pages/categories' },
          { name: 'Achievements', icon: 'Award', path: '/admin/achievements' },
          { name: 'Ban Reasons', icon: 'Gavel', path: '/admin/ban-reasons' },
          { name: 'Site Settings', icon: 'Palette', path: '/admin/site-settings' },
        ]
      },
      { name: 'Support', icon: 'LifeBuoy', path: '/support' }
    ];

    const dynamicCategories = await this.categoriesRepository.find({
      relations: ['pages'],
      where: { pages: { is_published: true } },
      order: { display_order: 'ASC', name: 'ASC' }
    });

    const uncategorizedPages = await this.pagesRepository.find({
      where: { is_published: true, category_id: IsNull() },
      order: { title: 'ASC' }
    });

    const uncategorizedItems = uncategorizedPages.map(page => ({
      name: page.title, icon: 'BookUser', path: `/p/${page.slug}`
    }));

    const dynamicItems = dynamicCategories
      .filter(category => category.pages.length > 0)
      .map(category => ({
        name: category.name, icon: 'Library',
        subItems: category.pages
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(page => ({
            name: page.title, icon: 'ChevronRight', path: `/p/${page.slug}`
          }))
      }));

    const finalStructure = [
      ...staticItems.slice(0, 2),
      ...uncategorizedItems,
      staticItems[2],
      staticItems[3],
      ...dynamicItems,
      staticItems[4],
      staticItems[5],
      staticItems[6],
    ];

    return finalStructure;
  }
}

