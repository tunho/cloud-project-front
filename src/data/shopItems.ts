export interface ShopItem {
    id: string;
    name: string;
    price: number;
    type: 'title' | 'icon' | 'theme';
    value: string; // emoji for icon, color for theme, text for title
    description: string;
}

export const shopItems: ShopItem[] = [
    // Titles
    {
        id: 'title_vip',
        name: 'VIP 칭호',
        price: 500000,
        type: 'title',
        value: '👑 VIP',
        description: '최고급 VIP 전용 칭호'
    },
    {
        id: 'title_diamond',
        name: '다이아몬드 칭호',
        price: 300000,
        type: 'title',
        value: '💎 다이아',
        description: '빛나는 다이아몬드 칭호'
    },
    {
        id: 'title_legend',
        name: '전설 칭호',
        price: 200000,
        type: 'title',
        value: '🔥 전설',
        description: '전설적인 플레이어의 증표'
    },

    // Icons
    {
        id: 'icon_lion',
        name: '사자 아이콘',
        price: 50000,
        type: 'icon',
        value: '🦁',
        description: '용맹한 사자'
    },
    {
        id: 'icon_dragon',
        name: '드래곤 아이콘',
        price: 50000,
        type: 'icon',
        value: '🐉',
        description: '신비로운 드래곤'
    },
    {
        id: 'icon_mask',
        name: '가면 아이콘',
        price: 50000,
        type: 'icon',
        value: '🎭',
        description: '미스터리한 가면'
    },
    {
        id: 'icon_alien',
        name: '외계인 아이콘',
        price: 50000,
        type: 'icon',
        value: '👾',
        description: '귀여운 외계인'
    },
    {
        id: 'icon_star',
        name: '별 아이콘',
        price: 50000,
        type: 'icon',
        value: '🌟',
        description: '빛나는 별'
    },

    // Themes
    {
        id: 'theme_gold',
        name: '골드 테마',
        price: 100000,
        type: 'theme',
        value: 'linear-gradient(135deg, #ffd700, #ffed4e)',
        description: '황금빛 프로필 테마'
    },
    {
        id: 'theme_red',
        name: '레드 테마',
        price: 100000,
        type: 'theme',
        value: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
        description: '정열적인 빨강 테마'
    },
    {
        id: 'theme_green',
        name: '그린 테마',
        price: 100000,
        type: 'theme',
        value: 'linear-gradient(135deg, #4ade80, #22c55e)',
        description: '신선한 초록 테마'
    }
];
