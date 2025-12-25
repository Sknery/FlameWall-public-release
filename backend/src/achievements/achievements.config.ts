
export type AchievementTrigger =
    | 'PLAYER_KILL_ENTITY'
    | 'BLOCK_BREAK'
    | 'BLOCK_PLACE'
    | 'ITEM_CRAFT'
    | 'ITEM_CONSUME'
    | 'PLAYER_ENCHANT_ITEM'
    | 'PLAYER_TRAVEL_DISTANCE'
    | 'CUSTOM_API_TRIGGER'
    | 'REPUTATION_CHANGED'
    | 'POST_CREATED'
    | 'COMMENT_CREATED'
    | 'FRIEND_ADDED'
    | 'PERIODIC_CHECK'
    | 'PAPI_STAT_CHECK'
    | 'WEBSITE_EVENT'
    | 'GAME_EVENT';


export interface AchievementConfig {
    version: string;
    triggers: AchievementTrigger[];
    targets: Partial<Record<AchievementTrigger, Record<string, string[]>>>;
    serverGroups: string[];
}


export const ACHIEVEMENTS_CONFIG: AchievementConfig = {
    version: '2.0.0-core',


    triggers: [
        'REPUTATION_CHANGED',
        'POST_CREATED',
        'COMMENT_CREATED',
        'FRIEND_ADDED',
        'CUSTOM_API_TRIGGER'
    ],


    targets: {
        CUSTOM_API_TRIGGER: {},
        REPUTATION_CHANGED: {},
        POST_CREATED: {},
        COMMENT_CREATED: {},
        FRIEND_ADDED: {},
    },


    serverGroups: [

    ]
};
