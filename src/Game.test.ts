import { GameState, NUM_ROWS, NUM_COLUMNS, Phase, WinState, createGame } from "./Game";
import { CardType } from "./CardData";

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


describe('game initialisation', () => {
    beforeEach(() => {
        gameState = createGame();
    });


    test('game starts with 7 cards', () => {
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