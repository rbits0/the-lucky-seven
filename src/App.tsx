import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import './App.css';
import Grid, { findAdjacentEnemies, findAdjacentPlayers, updateHammerAnvilStrength } from './Grid';
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { Contexts, Phase, SharedContexts } from "./Contexts";
import { Active } from "@dnd-kit/core";


export const NUM_ROWS = 4
export const NUM_COLUMNS = 7
const NUM_UNDOS = 3;
const BUTTON_STYLE = "mt-4 h-min p-2 rounded-md bg-gray-400 hover:bg-gray-500 active:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-700";


export interface GameState {
  phase: Phase,
  board: (CardData | null)[][][],
  deck: EnemyCard[],
  winState: WinState,
}

enum WinState {
  NONE,
  LAST_TURN,
  WIN,
  LOSS,
}



function App() {
  const [initialBoard, initialDeck] = createRandomBoard();
  const [board, setBoard] = useState(initialBoard);
  const [deck, setDeck] = useState(initialDeck);
  const [phase, setPhase] = useState(Phase.GAME_START);
  const [selected, setSelected] = useState<string | null>(null);
  const [winState, setWinState] = useState(WinState.NONE);
  let history: MutableRefObject<GameState[]> = useRef([]);
  
  const sharedContexts: Contexts = {
    phase,
    selected,
    setSelected,
    addStateToHistory,
  }
  

  function resetGame() {
    const [initialBoard, initialDeck] = createRandomBoard();
    setBoard(initialBoard);
    setDeck(initialDeck);
    setPhase(Phase.GAME_START);
    setSelected(null);
    setWinState(WinState.NONE);
    history.current = [];
  }
  

  function addStateToHistory() {
    if (history.current.length >= NUM_UNDOS) {
      history.current.shift();
    }

    const state: GameState = {
      phase: phase,
      board: structuredClone(board),
      deck: [...deck],
      winState: winState,
    };

    history.current.push(state);
  }
  

  function undo() {
    if (history.current.length === 0) {
      return;
    }

    let state = history.current.pop()!;
    
    setSelected(null);
    setPhase(state.phase);
    setBoard(state.board);
    setWinState(state.winState);

    // Reset deck enemy health and index
    for (const card of state.deck) {
      card.health = card.strength;
      card.index = undefined;
    }
    
    setDeck(state.deck);
  }


  function nextPhase() {
    addStateToHistory();

    switch (phase) {
      case Phase.GAME_START:
        dealEnemies();
        setPhase(Phase.ENCOUNTER);
        break;
      case Phase.ENCOUNTER:
        handleMortars();
        setPhase(Phase.MANEUVER);
        break;
      case Phase.MANEUVER:
        unrotateCards();
        removeFlares();
        setPhase(Phase.ATTACK);
        break;
      case Phase.ATTACK:
        unrotateCards();

        counterAttack();
        removeTanks();
        setPhase(Phase.COUNTER_ATTACK);
        break;
      case Phase.COUNTER_ATTACK:
        dealEnemies();
        setPhase(Phase.ENCOUNTER);
        break;
      default:
        dealEnemies();
        setPhase(Phase.ENCOUNTER);
        break;
    }
    

    // Unselect card
    setSelected(null);
  }

  
  function dealEnemies() {
    if (deck.length < NUM_ROWS) {
      if (winState === WinState.LAST_TURN) {
        // Check if win or loss
        const isWin = !board.flat(2).some(card => card?.type === CardType.ENEMY);
        if (isWin) {
          setWinState(WinState.WIN);
        } else {
          setWinState(WinState.LOSS);
          console.log("|  ||\n\n|| |_");
        }
      } else {
        setWinState(WinState.LAST_TURN);
      }
      
      return;
    }

    const newDeck = [...deck];
    const newBoard = board.map(row => [...row]);

    for (let row = 0; row < NUM_ROWS; row++) {
      // Deal top card
      const card = newDeck.pop()!;


      // Work out position of card
      let position = card.position;
      
      // If it can't overlap, need to find position where it doesn't overlap
      // If it can't find a free space, it won't change position
      if (position >= 0 && !card.canOverlap && newBoard[row][position][0]) {
        // Determine whether to prioritise left or right
        const prioritisedDirection = position > (NUM_COLUMNS - 1) / 2 ? -1 : 1;
        
        let index = 1;
        let prioritisedExhausted = false;
        let unprioritisedExhausted = false;

        while (!(prioritisedExhausted && unprioritisedExhausted)) {
          // Try prioritised direction first
          let attemptPosition = position + index * prioritisedDirection;
          if (attemptPosition < 1 || attemptPosition >= NUM_COLUMNS) {
            prioritisedExhausted = true;
          } else {
            if (!newBoard[row][attemptPosition][0]) {
              // Success
              position = attemptPosition;
              break;
            }
          }
          
          // Try other direction
          attemptPosition = position + index * (prioritisedDirection * -1);
          if (attemptPosition < 1 || attemptPosition >= NUM_COLUMNS) {
            unprioritisedExhausted = true;
          } else {
            if (!newBoard[row][attemptPosition][0]) {
              // Success
              position = attemptPosition;
              break;
            }
          }
          
          // Increment index
          index += 1;
        }
      }


      // Place card
      card.index = [row, position];
      if (position >= 0) {
        if (card.canOverlap && newBoard[row][position][0]) {
          // Put card on top instead of replacing
          newBoard[row][position][1] = card;
        } else {
          newBoard[row][position][0] = card;
        }
      }
    }
    

    updateJokerAdjacentHealth(newBoard);


    // Save new deck and board
    setBoard(newBoard);
    setDeck(newDeck);
  }
  

  function handleMortars() {
    const newBoard = [...board];
    
    // For all mortars
    newBoard.flat()
      .filter(cards => cards[0]?.name === "Mortar" || cards[1]?.name === "Mortar")
      .forEach(cards => {
        const mortarIndex = cards[0]!.index!;
        
        // Flip and rotate card under mortar
        if (newBoard[mortarIndex[0]][mortarIndex[1]][0]?.type === CardType.PLAYER) {
          const card = newBoard[mortarIndex[0]][mortarIndex[1]][0] as PlayerCard;
          card.down = true;
          card.rotated = true;
        }
        
        // Flip all adjacent cards
        const indexes = [
          [mortarIndex[0] + 1, mortarIndex[1]],
          [mortarIndex[0] - 1, mortarIndex[1]],
          [mortarIndex[0], mortarIndex[1] + 1],
          [mortarIndex[0], mortarIndex[1] - 1],
        ];
        for (const index of indexes) {
          // Check index is in bounds
          if (index[0] < 0 || index[1] < 1 || index[0] >= newBoard.length || index[1] >= newBoard[0].length) {
            continue;
          }
          
          if (newBoard[index[0]][index[1]][0]?.type === CardType.PLAYER) {
            (newBoard[index[0]][index[1]][0] as PlayerCard).down = true;
          }
          
        }
        
        // Remove mortar
        if (cards[1]?.name === "Mortar") {
          cards[1] = null;
        } else {
          cards[0] = null;
        }
      });
    
    // Update joker and pacifist adjacent since they might be down
    updateJokerAdjacentHealth(newBoard);
    updateHammerAnvilStrength(newBoard);
    
    setBoard(newBoard);
  }
  

  function unrotateCards() {
    const newBoard = [...board];

    for (const row of newBoard) {
      for (const cards of row) {
        if (cards[0]?.type !== CardType.PLAYER) {
          continue;
        }
        
        (cards[0] as PlayerCard).rotated = false;

        if (cards[0].name === "The Athlete") {
          (cards[0] as AthleteCard).halfRotated = false;
        }
      }
    }

    setBoard(newBoard);
  }
  

  function removeFlares() {
    const newBoard = board.map(row => row.map(cards => cards.map(
      card => card?.name === "Flare" ? null : card
    )));
    
    setBoard(newBoard);
  }


  function flipSelected() {
    const newBoard = [...board];

    // Find selected card
    for (const row of newBoard) {
      const selectedCard = row.find((card) => card[0]?.id === selected);

      if (selectedCard) {
        const selectedPlayerCard = selectedCard[0] as PlayerCard;

        // Card can't flip if it is rotated
        // Includes athlete's half-rotation
        if (
          selectedPlayerCard.rotated || (
            selectedPlayerCard.name === "The Athlete" &&
            (selectedPlayerCard as AthleteCard).halfRotated
          )
        ) {
          return;
        }

        if (selectedPlayerCard.down) {
          // Flip up
          // Check if adjacent up card exists
          const index = selectedPlayerCard.index!;
          const adjacent = [
            [index[0] - 1, index[1]],
            [index[0], index[1] - 1],
            [index[0] + 1, index[1]],
            [index[0], index[1] + 1],
          ]
          
          const canFlip = adjacent.some((adjacentIndex) => {
            // Check index is in bounds
            if (adjacentIndex[0] < 0 || adjacentIndex[1] < 1 || adjacentIndex[0] >= newBoard.length || adjacentIndex[1] >= newBoard[0].length) {
              return false;
            }

            const adjacentCard = board[adjacentIndex[0]][adjacentIndex[1]][0];
            if (adjacentCard && adjacentCard.type === CardType.PLAYER && !(adjacentCard as PlayerCard).down) {
              return true;
            } else {
              return false;
            }
          });

          if (canFlip) {
            addStateToHistory();
            
            selectedPlayerCard.down = false;
            selectedPlayerCard.rotated = true;
          }
        } else {
          addStateToHistory();

          // Flip down
          selectedPlayerCard.down = true;
          selectedPlayerCard.rotated = true;
        }
        
        
        // If joker, update enemy health
        if (selectedPlayerCard.name === "The Joker") {
          updateJokerAdjacentHealth(newBoard);
        }
        
        // If pacifist, update hammer/anvil strength
        if (selectedPlayerCard.name === "The Pacifist") {
          updateHammerAnvilStrength(newBoard);
        }
      }
    }
    

    setBoard(newBoard);
  }
  

  function counterAttack() {
    const newBoard = [...board];

    for (const enemy of board.flat().filter(cards => cards[0]?.type === CardType.ENEMY)) {
      let toRemove: PlayerCard[] = [];

      if (enemy[0]!.name === "Infantry") {
        toRemove = toRemove.concat(findAdjacentPlayers(enemy[0]!.index!, newBoard, false));
      } else if (enemy[0]!.name === "Machine Gun") {
        toRemove = toRemove.concat(findAdjacentPlayers(enemy[0]!.index!, newBoard, true));
      } else if (enemy[0]!.name === "Tank") {
        // Find all player cards in that row
        toRemove = toRemove.concat(
          newBoard[enemy[0]!.index![0]]
            .filter(cards => cards[0]?.type === CardType.PLAYER && !(cards[0]! as PlayerCard).down)
            .map(cards => cards[0]! as PlayerCard)
        );
      }
      
      for (const player of toRemove) {
        // Remove player
        newBoard[player.index![0]][player.index![1]][0] = null;
      }
    }
    
    resetEnemyHealth(newBoard);
    updateHammerAnvilStrength(newBoard);
    
    setBoard(newBoard);
  }
  

  function removeTanks() {
    const newBoard = [...board];
    for (const row of newBoard) {
      row[0][0] = null;
    }
    setBoard(newBoard);
  }

  
  return (
    <SharedContexts.Provider value={sharedContexts}>
      
      {winState === WinState.WIN ? 
        <div className="fixed z-20 w-full h-full">
          <div className="fixed bg-gray-900 w-full h-full opacity-50"></div>
          <div className="fixed-center rounded-2xl z-10 bg-green-700 opacity-100 p-5">
            <h1 className="text-slate-200 font-bold text-6xl text-center">YOU WIN</h1>
            <div className="flex">
              <button
                onClick={resetGame}
                className={`${BUTTON_STYLE} text-xl ml-auto`}
              >
                New Game
              </button>
              <button
                onClick={() => {
                  setWinState(WinState.LAST_TURN);
                  setPhase(Phase.COUNTER_ATTACK);
                }}
                className={`${BUTTON_STYLE} text-xl ml-5 mr-auto`}
              >
                View Board
              </button>
            </div>
          </div>
        </div>
      : null}
      
      {winState === WinState.LOSS ?
        <div className="fixed z-20 w-full h-full">
          <div className="fixed bg-gray-900 w-full h-full opacity-50"></div>
          <div className="fixed-center rounded-2xl z-10 bg-red-700 opacity-100 p-5">
            <h1 className="text-slate-200 font-bold text-6xl text-center">YOU LOSE</h1>
            <div className="flex">
              <button
                onClick={resetGame}
                className={`${BUTTON_STYLE} text-xl ml-auto`}
              >
                New Game
              </button>
              <button
                onClick={() => {
                  setWinState(WinState.LAST_TURN);
                  setPhase(Phase.COUNTER_ATTACK);
                }}
                className={`${BUTTON_STYLE} text-xl ml-5 mr-auto`}
              >
                View Board
              </button>
            </div>
          </div>
        </div>
      : null}

      <div className="flex items-start flex-wrap">
        <Grid board={board} setBoard={setBoard}/>

        <div className="flex flex-col m-auto p-4 text-xl">
          <p>Phase: {phase}</p>

          <button
            onClick={flipSelected}
            className={BUTTON_STYLE}
          >
            Flip Selected
          </button>

          <button
            onClick={nextPhase}
            className={BUTTON_STYLE}
          >
            Next Phase
          </button>
          
          <button
            onClick={undo}
            className={BUTTON_STYLE}
            disabled={history.current.length === 0}
          >
            Undo
          </button>

        </div>
      </div>

    </SharedContexts.Provider>
  );
}


function createRandomBoard(): [(CardData | null)[][][], EnemyCard[]] {
    const cards = require("./cards.json");
    // Create 3D array with null for board
    const board: (CardData | null)[][][] = [...Array(NUM_ROWS)].map(() => [...Array(NUM_COLUMNS)].map(() => Array(2).fill(null)));
    
    // Shuffle row and column numbers
    let row_numbers: number[][] = shuffleArray(cards.rows);
    let column_numbers: number[][] = shuffleArray(cards.columns);
    // let row_numbers: number[][] = cards.rows;
    // let column_numbers: number[][] = cards.columns;
    

    // Shuffle player cards
    let players = shuffleArray(
      (cards.players as any[]).map((card, i) => (
        {...card, id: card.name, type: CardType.PLAYER, down: false, rotated: false, effectiveStrength: card.strength}
      ))
    ) as PlayerCard[];
    // let players = (cards.players as any[]).map(card => (
    //   {...card, id: card.name, type: CardType.Player, down: false}
    // ))as PlayerCard[];
    
    // Place player cards
    players.forEach((player, i) => {
      // Find row and column
      const rowIndex = row_numbers.findIndex(value => value.includes(i + 1));
      const columnIndex = column_numbers.findIndex(value => value.includes(i + 1)) + 1;
      
      // Update index
      player.index = [rowIndex, columnIndex];

      // Place card
      board[rowIndex][columnIndex][0] = player;
    });
    

    // Remove last player card
    const rowIndex = row_numbers.findIndex(value => value.includes(players.length));
    const columnIndex = column_numbers.findIndex(value => value.includes(players.length)) + 1;
    board[rowIndex][columnIndex][0] = null;
    
    // Down adjacent players
    const adjacent = [[rowIndex - 1, columnIndex], [rowIndex + 1, columnIndex], [rowIndex, columnIndex - 1], [rowIndex, columnIndex + 1]];
    for (const index of adjacent) {
      // Check that index is in bounds
      if (index[0] < 0 || index[0] >= NUM_ROWS || index[1] < 0 || index[1] >= NUM_COLUMNS) {
        continue;
      }
      
      if (board[index[0]][index[1]][0]) {
        (board[index[0]][index[1]][0] as PlayerCard).down = true;
      }
    }


    updateHammerAnvilStrength(board);
    

    // Parse enemy cards
    let enemies: EnemyCard[] = [];
    for (const [i, enemy] of cards.enemies.entries()) {
      for (const [j, position] of enemy.positions.entries()) {
        const newEnemy = { ...enemy, position: position, id: `enemy${i}:${j}`, type: CardType.ENEMY, health: enemy.strength};
        delete newEnemy.positions;
        enemies.push(newEnemy);
      }
    }
    
    // Shuffle enemy cards
    shuffleArray(enemies);

    
    return [board, enemies];
}


// Taken from https://stackoverflow.com/a/12646864
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i --) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}


function updateJokerAdjacentHealth(board: (CardData | null)[][][]) {
  // Update strengths of enemies adjacent to joker (up)
  const joker = board.flat().find(cards => cards[0]?.name === "The Joker");
  if (!joker) {
    return;
  }
  
  const isDown = (joker[0]! as PlayerCard).down;

  const adjacentEnemies = findAdjacentEnemies(joker[0]!.index!, board);
  
  if (!isDown) {
    // If up
    for (const enemy of adjacentEnemies) {
      enemy.health = enemy.strength - 1;
    }
  } else {
    // If down
    for (const enemy of adjacentEnemies) {
      enemy.health = enemy.strength;
    }
  }
}


function resetEnemyHealth(board: (CardData | null)[][][]) {
  for (const enemy of board.flat().filter(cards => cards[0]?.type === CardType.ENEMY)) {
    (enemy[0]! as EnemyCard).health = enemy[0]!.strength;
  }
  
  updateJokerAdjacentHealth(board);
}


function phaseToString(phase: Phase): string {
  switch (phase) {
    case Phase.GAME_START:
      return "Game Start";
    case Phase.ENCOUNTER:
      return "Encounter";
    case Phase.MANEUVER:
      return "Maneuver";
    case Phase.ATTACK:
      return "Attack";
    case Phase.COUNTER_ATTACK:
      return "Counter-Attack"
  }
}


export default App;
