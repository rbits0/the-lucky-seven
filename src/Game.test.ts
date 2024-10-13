import { GameState, NUM_ROWS, NUM_COLUMNS, Phase, WinState, createGame, gameReducer, GameActionType } from "./Game";
import { CardType, EnemyCard } from "./CardData";

let gameState = mockGameState();


function mockGameState(): GameState {
  return {
    board: [...Array(NUM_ROWS)].map(() => [...Array(NUM_COLUMNS)].map(() => Array(2).fill(null))),
    deck: [],
    phase: Phase.GAME_START,
    selected: null,
    winState: WinState.NONE,
    canFlip: false,
    history: [],
  }
}


function mockEnemy(): EnemyCard {
    return {
        id: 'enemy0',
        name: 'Infantry',
        type: CardType.ENEMY,
        strength: 1,
        position: 1,
        hitsDown: true,
        canOverlap: false,
        discardAfterRound: false,
        health: 1
    };
}


function mockDeck(): EnemyCard[] {
    let deck: EnemyCard[] = [];
    for (let i = 0; i < 8; i++) {
        let enemy = mockEnemy();
        enemy.id = `enemy${i}`;
        deck.push(enemy);
    };
    
    return deck;
}


describe('game initialisation', () => {
    beforeEach(() => {
        gameState = createGame();
    });


    test('board starts with 7 cards', () => {
        let numPlayers = 0;
        for (const row of gameState.board) {
            numPlayers += row.filter(cards => cards[0] !== null).length;
        }
        
        expect(numPlayers).toBe(7);
    });


    test('deck starts with 28 cards', () => {
        expect(gameState.deck.length).toBe(28);
    });
});


describe('scenarios', () => {
    beforeEach(() => {
        gameState = mockGameState();
    });
    
    
    test('game start next phase', () => {
        gameReducer(gameState, { type: GameActionType.NEXT_PHASE });
        
        expect(gameState.phase).toBe(Phase.ENCOUNTER);
    });
    

    test('encounter deals top 4 enemies', () => {
        const deck = mockDeck();
        gameState.deck = [...deck];
        gameReducer(gameState, { type: GameActionType.NEXT_PHASE });
        
        for (const [i, row] of gameState.board.entries()) {
            expect(row.find(value => value[0] != null)![0]).toBe(deck[deck.length - 1 - i]);
        }
    });
    

    test('encounter places enemies according to position', () => {
        const deck = mockDeck()
        deck[7].position = 1;
        deck[6].position = 2;
        deck[5].position = 4;
        deck[4].position = 6;
        gameState.deck = deck;
        gameReducer(gameState, { type: GameActionType.NEXT_PHASE });
        
        for (const row of gameState.board) {
            const card = row.find(value => value[0] != null)![0] as EnemyCard;
            expect(card!.index![1]).toStrictEqual(card.position);
        }
    });
});