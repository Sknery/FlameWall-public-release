import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager, In, Not, IsNull, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { Rank } from '../ranks/entities/rank.entity';
import { Friendship } from '../friendships/entities/friendship.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Vote } from '../votes/entities/vote.entity';
import { Clan } from '../clans/entities/clan.entity';
import { ClanMember } from '../clans/entities/clan-member.entity';
import { ClanRole } from '../clans/entities/clan-role.entity';
import { Tag } from '../tags/entities/tag.entity';


import { SystemRanks } from '../ranks/ranks.service';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { ClansService } from '../clans/clans.service';
import { ClanJoinType } from '../clans/entities/clan.entity';

const USERS_TO_CREATE = 200;
const CLANS_TO_CREATE = 20;
const MAX_MEMBERS_PER_CLAN = 15;
const MAX_COMMENT_DEPTH = 2;
const NICKNAME_ADJECTIVES = [
    "Shadow", "Crimson", "Swift", "Iron", "Silent", "Night", "Blaze", "Frost", "Void", "Rogue", "Dire", "Grim", "Venom", "Wraith", "Storm", "Steel", "Dread", "Ghost", "Lone", "War"
];
const NICKNAME_NOUNS = [
    "Striker", "Blade", "Hunter", "Reaper", "Mage", "Guard", "Wolf", "Dragon", "Specter", "Fury", "Heart", "Fang", "Claw", "Rider", "Soul", "Bane", "Walker", "Storm", "Shade", "Thorn"
];
const DESCRIPTIONS = [
    "Just a player exploring the world.", "Building something epic! Don't disturb.", "Master of PvP, looking for a challenge.",
    "Redstone engineer and proud of it.", "Here for the community and good times.", "Trying to collect all the achievements.",
    "On a quest to build the greatest castle.", "Looking for a clan to join."
];
const POST_TITLES = [
    "My Latest Mega-Build Project!", "Found a crazy cave system, check this out!", "Looking for Teammates for a Big Project",
    "What's your favorite block palette?", "Rate my new base design!", "The coolest enchantment combo I've found",
    "Some tips for surviving the first night", "My epic battle with the Ender Dragon"
];
const POST_CONTENT_IDEAS = [
    "Spent the last week building this fortress. It has fully automated farms and a secret treasure room. What do you guys think?",
    "Was just exploring and stumbled upon this massive ravine connected to three dungeons. Seed and coordinates inside!",
    "I'm planning to build a massive city and I need some skilled builders and redstone experts. If you're interested, let me know!",
    "I'm trying to find a good color scheme for my new tower. I'm thinking deepslate and warped wood, but I'm open to suggestions.",
    "Just finished the exterior of my new survival base. Let me know what you think of the architecture! Any feedback is welcome.",
    "I got a sword with Sharpness V, Looting III, and Mending. It's an absolute beast for mob farming.",
    "For new players: always build a simple shelter before the sun goes down. A simple dirt hut is better than nothing!",
    "The fight was intense! I almost got knocked into the void twice, but finally managed to land the final blow. So satisfying!"
];

@Injectable()
export class SeederService {
    private readonly log = new Logger(SeederService.name);
    private faker: any;

    constructor(
        private readonly dataSource: DataSource,
        private readonly clansService: ClansService,
    ) { }

    private async initializeFaker() {
        if (!this.faker) {
            const { faker } = await import('@faker-js/faker');
            this.faker = faker;
        }
    }

    async seed() {
        await this.initializeFaker();

        await this.dataSource.transaction(async (manager) => {
            this.log.log('🚀 Starting database seeding process...');

            await this.cleanDatabase(manager);

            const users = await this.seedUsers(manager);
            if (users.length === 0) {
                this.log.warn('User creation failed. Aborting further seeding.');
                return;
            }

            await this.seedFriendships(manager, users);

            await this.seedClans(manager, users);

            const posts = await this.seedPosts(manager, users);

            if (posts.length > 0) {
                await this.seedCommentsAndVotes(manager, posts, users);
            }

            this.log.log('✅ Database seeding completed successfully!');
        }).catch(err => {
            this.log.error('❌ An error occurred during seeding. Rolling back transaction.');
            console.error('Error during seeding process:', err);
            throw err;
        });
    }

    private async cleanDatabase(manager: EntityManager) {
        this.log.log('🧹 Cleaning up previously seeded fake data...');
        const fakeUsers = await manager.find(User, { where: { email: Like('%@fake-email.com') } });

        if (fakeUsers.length > 0) {
            const fakeUserIds = fakeUsers.map(u => u.id);
            this.log.log(`...found ${fakeUsers.length} fake users. Deleting all related data...`);

            this.log.log(`...... deleting votes...`);
            await manager.delete(Vote, { voter: { id: In(fakeUserIds) } });

            this.log.log(`...... deleting comments...`);
            await manager.delete(Comment, { authorId: In(fakeUserIds) });

            this.log.log(`...... deleting posts...`);
            await manager.delete(Post, { author_id: In(fakeUserIds) });

            this.log.log(`...... deleting friendships...`);
            await manager.query('DELETE FROM friendships WHERE requester_id = ANY($1) OR receiver_id = ANY($1)', [fakeUserIds]);

            this.log.log(`...... deleting clans owned by fake users...`);
            const clansToDelete = await manager.find(Clan, { where: { owner_id: In(fakeUserIds) } });
            if (clansToDelete.length > 0) {
                this.log.log(`......... found ${clansToDelete.length} clans to delete.`);
                await manager.remove(clansToDelete);
            }

            this.log.log('...deleting all fake user accounts...');
            await manager.delete(User, { id: In(fakeUserIds) });

            this.log.log('...finished cleaning.');
        } else {
            this.log.log('...no fake users found to delete.');
        }
    }


    private generateNickname(): string {
        const adj = this.faker.helpers.arrayElement(NICKNAME_ADJECTIVES);
        const noun = this.faker.helpers.arrayElement(NICKNAME_NOUNS);
        const num = this.faker.number.int({ min: 1, max: 99 });
        return `${adj}${noun}_${num}`.substring(0, 16);
    }

    private async seedUsers(manager: EntityManager): Promise<User[]> {
        this.log.log(`🌱 Creating ${USERS_TO_CREATE} new users one by one...`);
        const ranks = await manager.findBy(Rank, { id: Not(In(Object.values(SystemRanks).map(r => r.id))) });
        const defaultRank = await manager.findOneBy(Rank, { id: SystemRanks.DEFAULT.id });
        if (!defaultRank) throw new InternalServerErrorException('Default rank not found.');

        const allTags = await manager.find(Tag);
        this.log.log(`...found ${allTags.length} tags to assign to users.`);

        const createdUsers: User[] = [];
        for (let i = 0; i < USERS_TO_CREATE; i++) {
            const baseUsername = this.generateNickname();
            const username = `${baseUsername}${i}`;
            const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

            this.log.log(`...... Creating user #${i + 1}: ${username}`);

            const joinDate = this.faker.date.past({ years: 1 });

            const newUser = manager.create(User, {
                username,
                email: `${cleanUsername.toLowerCase()}@fake-email.com`,
                password_hash: await bcrypt.hash('password123', 10),
                description: this.faker.helpers.arrayElement(DESCRIPTIONS),
                pfp_url: `https://robohash.org/${username}.png?set=set4`,
                banner_url: this.faker.image.urlPicsumPhotos({ width: 1200, height: 300 }),
                reputation_count: this.faker.number.int({ min: 0, max: 500 }),
                rank: ranks.length > 0 ? this.faker.helpers.arrayElement(ranks) : defaultRank,
                minecraft_uuid: this.faker.string.uuid(),
                minecraft_username: cleanUsername.substring(0, 16),
                first_login: joinDate,
                email_verified_at: new Date(),
            });

            if (allTags.length > 0) {
                const tagsToAssign = this.faker.helpers.shuffle(allTags).slice(0, this.faker.number.int({ min: 1, max: 3 }));
                newUser.tags = tagsToAssign;
                this.log.log(`......... assigning ${tagsToAssign.length} tags: [${tagsToAssign.map(t => t.name).join(', ')}]`);
            }

            const savedUser = await manager.save(newUser);
            createdUsers.push(savedUser);
        }

        this.log.log(`...created ${createdUsers.length} new users.`);
        return createdUsers;
    }

    private async seedFriendships(manager: EntityManager, users: User[]) {
        this.log.log('🤝 Creating friendships...');
        const friendshipPairs = new Set<string>();

        for (const user of users) {
            const friendsCount = this.faker.number.int({ min: 5, max: Math.min(20, users.length - 1) });
            this.log.log(`...... Generating ${friendsCount} friendships for user ${user.username}`);
            const potentialFriends = users.filter(u => u.id !== user.id);

            for (let i = 0; i < friendsCount; i++) {
                const friend = this.faker.helpers.arrayElement(potentialFriends);
                const pairKey = [user.id, friend.id].sort((a, b) => a - b).join('-');
                if (friendshipPairs.has(pairKey)) continue;

                const friendship = manager.create(Friendship, {
                    requester_id: user.id,
                    receiver_id: friend.id,
                    status: this.faker.helpers.arrayElement([FriendStatuses.ACCEPTED, FriendStatuses.PENDING]),
                });
                await manager.save(friendship);
                friendshipPairs.add(pairKey);
            }
        }
        this.log.log(`...created ${friendshipPairs.size} friendship entries.`);
    }

    private async seedClans(manager: EntityManager, allUsers: User[]) {
        this.log.log(`🛡️ Creating up to ${CLANS_TO_CREATE} new clans...`);

        const clanlessUsers = await manager.createQueryBuilder(User, "user")
            .leftJoin("user.clanMembership", "clanMembership")
            .where("clanMembership.id IS NULL")
            .andWhere("user.email LIKE '%@fake-email.com'")
            .getMany();

        const potentialLeaders = this.faker.helpers.shuffle(clanlessUsers);
        const leaders = potentialLeaders.slice(0, Math.min(CLANS_TO_CREATE, potentialLeaders.length));

        for (const leader of leaders) {
            if (!leader.minecraft_uuid) {
                this.log.error(`...Leader ${leader.username} is missing minecraft_uuid. Skipping clan creation.`);
                continue;
            }

            const clanName = this.faker.company.name().substring(0, 20);
            const clanTag = clanName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) + leader.id;

            this.log.log(`...... creating clan "${clanName}" with leader ${leader.username}`);

            const newClan = await manager.save(manager.create(Clan, {
                name: clanName, tag: clanTag,
                description: this.faker.company.catchPhrase(),
                join_type: this.faker.helpers.arrayElement([ClanJoinType.OPEN, ClanJoinType.APPLICATION, ClanJoinType.CLOSED]),
                owner_id: leader.id,
                card_icon_url: `https://robohash.org/${clanTag}.png?set=set2`,
                card_image_url: this.faker.image.urlPicsumPhotos({ width: 800, height: 320 }),
            }));

            const leaderRole = await manager.save(manager.create(ClanRole, {
                clan_id: newClan.id, name: 'Leader', color: '#FFD700', power_level: 1000,
                permissions: { clanPermissions: { canEditDetails: true, canEditAppearance: true, canEditRoles: true, canEditApplicationForm: true, canAcceptMembers: true, canInviteMembers: true, canUseClanTags: true, canAccessAdminChat: true }, memberPermissions: { maxKickPower: 999, maxMutePower: 999, maxPromotePower: 999, maxDemotePower: 999, maxWarnPower: 999 } },
                is_system_role: true,
            }));

            await manager.save(manager.create(ClanRole, {
                clan_id: newClan.id, name: 'Member', color: '#AAAAAA', power_level: 10,
                permissions: { clanPermissions: { canEditDetails: false, canEditAppearance: false, canEditRoles: false, canEditApplicationForm: false, canAcceptMembers: false, canInviteMembers: false, canUseClanTags: false, canAccessAdminChat: false }, memberPermissions: { maxKickPower: 0, maxMutePower: 0, maxPromotePower: 0, maxDemotePower: 0, maxWarnPower: 0 } },
                is_system_role: true,
            }));

            await manager.save(manager.create(ClanMember, {
                clan_id: newClan.id, user_id: leader.id, role_id: leaderRole.id,
            }));
        }

        this.log.log(`...created ${leaders.length} clans.`);

        const allClans = await manager.find(Clan);
        if (allClans.length === 0) return;

        this.log.log('...distributing remaining users into clans...');
        const openClans = allClans.filter(c => c.join_type === ClanJoinType.OPEN);

        if (openClans.length > 0) {
            const usersToJoin = allUsers.filter(u => !leaders.some(l => l.id === u.id));
            for (const user of usersToJoin) {
                const isAlreadyMember = await manager.findOneBy(ClanMember, { user_id: user.id });
                if (isAlreadyMember) continue;

                const clanToJoin = this.faker.helpers.arrayElement(openClans);
                const memberCount = await manager.count(ClanMember, { where: { clan_id: clanToJoin.id } });

                if (memberCount < MAX_MEMBERS_PER_CLAN) {
                    try {
                        const memberRole = await manager.findOneBy(ClanRole, { clan_id: clanToJoin.id, name: 'Member' });
                        if (memberRole) {
                            this.log.log(`...... adding ${user.username} to clan ${clanToJoin.name}`);
                            const newMember = manager.create(ClanMember, { clan_id: clanToJoin.id, user_id: user.id, role_id: memberRole.id });
                            await manager.save(newMember);
                        }
                    } catch (e) { }
                }
            }
        } else {
            this.log.log('...... no open clans found to distribute users into. Skipping.');
        }

        this.log.log('...finished distributing users.');
    }

    private async seedPosts(manager: EntityManager, users: User[]): Promise<Post[]> {
        this.log.log('📝 Creating posts...');
        const allPosts: Post[] = [];
        for (const user of users) {
            const postCount = this.faker.number.int({ min: 2, max: 8 });
            this.log.log(`...... Preparing ${postCount} posts for user ${user.username}`);
            for (let i = 0; i < postCount; i++) {
                let content = `<p>${this.faker.helpers.arrayElement(POST_CONTENT_IDEAS)}</p>`;
                if (this.faker.datatype.boolean(0.5)) {
                    const imageUrl = this.faker.image.urlPicsumPhotos({ width: 640, height: 480 });
                    content += `<p><img src="${imageUrl}" alt="Post image"></p>`;
                }

                const postDate = this.faker.date.between({ from: user.first_login, to: new Date() });

                const post = manager.create(Post, {
                    author_id: user.id,
                    title: this.faker.helpers.arrayElement(POST_TITLES),
                    content: content,
                    created_at: postDate,
                });
                const savedPost = await manager.save(post);
                allPosts.push(savedPost);
            }
        }
        this.log.log(`...created ${allPosts.length} new posts.`);
        return allPosts;
    }

    private async seedReplies(manager: EntityManager, parentComments: Comment[], allUsers: User[], currentDepth: number, maxDepth: number): Promise<number> {
        if (currentDepth >= maxDepth) return 0;

        let repliesCreatedCount = 0;
        const nextLevelComments: Comment[] = [];

        for (const parent of parentComments) {
            if (this.faker.datatype.boolean(0.7 / (currentDepth + 1))) {
                const replyCount = this.faker.number.int({ min: 1, max: 2 });
                for (let i = 0; i < replyCount; i++) {
                    const commenter = this.faker.helpers.arrayElement(allUsers.filter(u => u.id !== parent.authorId));
                    if (!commenter) continue;

                    const reply = manager.create(Comment, {
                        authorId: commenter.id,
                        postId: parent.postId,
                        content: this.faker.lorem.sentence(),
                        parent: parent,
                    });
                    const savedReply = await manager.save(reply);
                    nextLevelComments.push(savedReply);
                    repliesCreatedCount++;
                }
            }
        }

        if (nextLevelComments.length > 0) {
            repliesCreatedCount += await this.seedReplies(manager, nextLevelComments, allUsers, currentDepth + 1, maxDepth);
        }

        return repliesCreatedCount;
    }

    private async seedCommentsAndVotes(manager: EntityManager, posts: Post[], users: User[]) {
        this.log.log('💬 Creating comments and votes for each post...');
        let totalComments = 0;
        let totalVotes = 0;

        for (const post of posts) {
            if (!post.author_id) continue;

            this.log.log(`...... Processing post ID ${post.id} ("${post.title}")...`);

            const commentCount = this.faker.number.int({ min: 2, max: 10 });
            let topLevelComments: Comment[] = [];
            for (let i = 0; i < commentCount; i++) {
                const commenter = this.faker.helpers.arrayElement(users.filter(u => u.id !== post.author_id));
                const comment = manager.create(Comment, { authorId: commenter.id, postId: post.id, content: this.faker.lorem.sentence() });
                const savedComment = await manager.save(comment);
                topLevelComments.push(savedComment);
                totalComments++;
            }

            const repliesCount = await this.seedReplies(manager, topLevelComments, users, 0, MAX_COMMENT_DEPTH);
            totalComments += repliesCount;

            const allEntitiesForPost = [post, ...await manager.find(Comment, { where: { postId: post.id } })];
            for (const entity of allEntitiesForPost) {
                const authorId = entity instanceof Post ? entity.author_id : entity.authorId;
                if (!authorId) continue;

                const voters = this.getUniqueVoters(users, authorId);
                for (const voter of voters) {
                    const vote = manager.create(Vote, {
                        voter: voter,
                        post: entity instanceof Post ? entity : undefined,
                        comment: entity instanceof Comment ? entity : undefined,
                        value: this.faker.helpers.arrayElement([1, 1, 1, -1]),
                    });
                    await manager.save(vote);
                    totalVotes++;
                }
            }
            this.log.log(`......... added ${commentCount + repliesCount} comments and some votes.`);
        }

        this.log.log(`...created a total of ${totalComments} comments.`);
        this.log.log(`...created a total of ${totalVotes} votes.`);
        await this.updateReputations(manager);
    }

    private getUniqueVoters(users: User[], authorId: number): User[] {
        const potentialVoters = users.filter(u => u.id !== authorId);
        const shuffled = this.faker.helpers.shuffle(potentialVoters);
        const voteCount = this.faker.number.int({ min: 0, max: Math.min(10, shuffled.length) });
        return shuffled.slice(0, voteCount);
    }

    private async updateReputations(manager: EntityManager) {
        this.log.log('💯 Updating user reputations...');
        const results = await manager.createQueryBuilder(Vote, "vote")
            .select("COALESCE(post.author_id, comment.author_id)", "authorId")
            .addSelect("SUM(vote.value)", "reputation")
            .leftJoin("vote.post", "post")
            .leftJoin("vote.comment", "comment")
            .where("post.author_id IS NOT NULL OR comment.author_id IS NOT NULL")
            .groupBy("COALESCE(post.author_id, comment.author_id)")
            .getRawMany();

        for (const { authorId, reputation } of results) {
            if (authorId) {
                await manager.update(User, { id: authorId }, { reputation_count: reputation });
            }
        }
        this.log.log(`...updated reputations for ${results.length} users.`);
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}