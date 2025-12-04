export interface GameConfig {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    route: string;
    lobbyRoute: string;
    gameRoute: (roomId: string) => string;
    description: string;
    color: string;
}

export const GAMES: Record<string, GameConfig> = {
    davinci: {
        id: 'davinci',
        title: 'Davinci Code',
        subtitle: '숫자 추리 심리전의 정수',
        icon: '🧩',
        route: '/davinci-home',
        lobbyRoute: '/davinci-home',
        gameRoute: (roomId) => `/room/${roomId}/play`,
        description: '상대방의 코드를 추리하는\n고도의 심리 전략 게임',
        color: 'davinci'
    },
    omok: {
        id: 'omok',
        title: 'Omok',
        subtitle: '오목판 위의 치열한 두뇌 싸움',
        icon: '⚫⚪',
        route: '/omok-home',
        lobbyRoute: '/omok-home',
        gameRoute: (roomId) => `/room/${roomId}/omok`,
        description: '오목판 위의 치열한 두뇌 싸움\n5목을 완성하세요',
        color: 'omok'
    },
    indian_poker: {
        id: 'indian_poker',
        title: 'Indian Poker',
        subtitle: '1vs1 심리 베팅 게임',
        icon: '👳🃏',
        route: '/indian-poker-home',
        lobbyRoute: '/indian-poker-home',
        gameRoute: (roomId) => `/room/${roomId}/indian_poker`,
        description: '내 카드는 모르고\n상대 카드만 보인다!\n고도의 심리전',
        color: 'indian_poker'
    }
};

export const GAME_LIST = Object.values(GAMES);

export function getGameConfig(gameType: string): GameConfig {
    return GAMES[gameType]! || GAMES['davinci'];
}
