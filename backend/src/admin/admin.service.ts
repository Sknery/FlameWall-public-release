import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { subDays } from 'date-fns';
import { Post } from 'src/posts/entities/post.entity';
import { Purchase } from 'src/purchases/entities/purchase.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Post)
        private postsRepository: Repository<Post>,
        @InjectRepository(Purchase)
        private purchasesRepository: Repository<Purchase>,
    ) {}

    async getUserStats() {
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const sevenDaysAgo = subDays(new Date(), 7);

        const dailyUsers = await this.usersRepository.query(`
            SELECT to_char(first_login, 'YYYY-MM-DD') as date, COUNT(*)::int as count
            FROM users
            WHERE first_login > NOW() - INTERVAL '365 days'
            GROUP BY date
            ORDER BY date ASC
        `);

        const hourlyUsers = await this.usersRepository.query(`
             SELECT to_char(first_login, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
             FROM users
             WHERE first_login > NOW() - INTERVAL '24 hours'
             GROUP BY date
             ORDER BY date ASC
        `);

        const [
            totalUsers,
            newToday,
            newThisWeek,
            onlineNow,
            latestUsers
        ] = await Promise.all([
            this.usersRepository.count(),
            this.usersRepository.count({ where: { first_login: MoreThan(twentyFourHoursAgo) } }),
            this.usersRepository.count({ where: { first_login: MoreThan(sevenDaysAgo) } }),
            this.usersRepository.count({ where: { is_minecraft_online: true } }),
            this.usersRepository.find({
                order: { first_login: 'DESC' },
                take: 50,                relations: ['rank'],
            }),
        ]);

        return {
            totalUsers,
            newToday,
            newThisWeek,
            onlineNow,
            latestUsers,
            chartData: { daily: dailyUsers, hourly: hourlyUsers }
        };
    }

    async getPostStats() {
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const sevenDaysAgo = subDays(new Date(), 7);

        const dailyStats = await this.postsRepository.query(`
            SELECT to_char(created_at, 'YYYY-MM-DD') as date, COUNT(*)::int as count
            FROM posts
            WHERE created_at > NOW() - INTERVAL '365 days'
            GROUP BY date
            ORDER BY date ASC
        `);

        const hourlyStats = await this.postsRepository.query(`
             SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
             FROM posts
             WHERE created_at > NOW() - INTERVAL '24 hours'
             GROUP BY date
             ORDER BY date ASC
        `);

        const [
            totalPosts,
            newToday,
            newThisWeek,
            latestPosts
        ] = await Promise.all([
            this.postsRepository.count(),
            this.postsRepository.count({ where: { created_at: MoreThan(twentyFourHoursAgo) } }),
            this.postsRepository.count({ where: { created_at: MoreThan(sevenDaysAgo) } }),
            this.postsRepository.find({
                order: { created_at: 'DESC' },
                take: 20,
                relations: ['author', 'author.rank'],
            })
        ]);

        return {
            totalPosts,
            newToday,
            newThisWeek,
            latestPosts,
            chartData: { daily: dailyStats, hourly: hourlyStats }
        };
    }

    async getShopStats() {
        const generalStats = await this.purchasesRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.purchase_price)', 'totalRevenue')
            .addSelect('COUNT(purchase.purchase_id)', 'totalSales')
            .addSelect('COUNT(DISTINCT purchase.user_id)', 'uniqueCustomers')
            .getRawOne();

        const salesByCategory = await this.purchasesRepository
            .createQueryBuilder('purchase')
            .leftJoin('purchase.item', 'item')
            .select('item.category', 'name')
            .addSelect('COUNT(purchase.purchase_id)', 'sales')
            .groupBy('item.category')
            .orderBy('"sales"', 'DESC')
            .getRawMany();

        const topSellingItems = await this.purchasesRepository
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.item', 'item')
            .select('item.name', 'name')
            .addSelect('item.item_id', 'itemId')
            .addSelect('COUNT(purchase.purchase_id)', 'salesCount')
            .groupBy('item.item_id')
            .orderBy('"salesCount"', 'DESC')
            .limit(5)
            .getRawMany();

        const recentPurchases = await this.purchasesRepository.find({
            relations: ['user', 'item'],
            order: { purchased_at: 'DESC' },
            take: 5
        });

        return {
            totalRevenue: parseInt(generalStats.totalRevenue, 10) || 0,
            totalSales: parseInt(generalStats.totalSales, 10) || 0,
            uniqueCustomers: parseInt(generalStats.uniqueCustomers, 10) || 0,
            salesByCategory: salesByCategory.map(c => ({...c, sales: parseInt(c.sales, 10)})),
            topSellingItems: topSellingItems.map(i => ({...i, salesCount: parseInt(i.salesCount, 10)})),
            recentPurchases,
        };
    }

    async getUserDetails(userId: number) {
        const user = await this.usersRepository.createQueryBuilder('user')
            .where('user.id = :userId', { userId })
            .addSelect(['user.email', 'user.last_login'])
            .leftJoinAndSelect('user.rank', 'rank')
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found.`);
        }

        delete (user as any).password_hash;
        return user;
    }
}