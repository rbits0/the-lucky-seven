import { Phase } from "./Contexts";
import { AthleteCard, CardData, CardType, EnemyCard, GenericCard, PlayerCard } from "./CardData";
import Card from "./Card";
import { transpileModule } from "typescript";

export const NUM_ROWS = 4
export const NUM_COLUMNS = 7
export const NUM_UNDOS = 3;

type Board = (CardData | null)[][][];


export interface GameState {
  board: Board,
  deck: EnemyCard[],
  phase: Phase,
  selected: string | null,
  winState: WinState,
  canFlip: boolean,
  history: GameState[] | null,
}

export enum WinState {
  NONE,
  LAST_TURN,
  WIN,
  LOSS,
}

export enum GameActionType {
  RESET,
  UNDO,
  NEXT_PHASE,
  FLIP_SELECTED,
  MOVE,
  ATTACK,
}

export interface GameAction {
  type: GameActionType
}

export interface MoveAction extends GameAction {
  type: GameActionType.MOVE,
  from: [number, number],
  to: [number, number],
}

export interface AttackAction extends GameAction {
  type: GameActionType.ATTACK,
  enemy: EnemyCard,
}



export function gameReducer(state: GameState, action: GameAction): GameState {
  const newState = {...state};

  switch (action.type) {
    case GameActionType.RESET:
      return createGame();
    case GameActionType.UNDO:
      if (state.history === null) {
        throw new TypeError("Tried to undo, but history is null");
      }

      return undo(state.history);
    case GameActionType.NEXT_PHASE:
      nextPhase(newState);
      break;
    case GameActionType.FLIP_SELECTED:
      flipSelected(newState);
      break;
    case GameActionType.MOVE:
      // TODO:
      const moveAction = action as MoveAction;
      doMoveAction(newState, moveAction.from, moveAction.to);
      break;
    case GameActionType.ATTACK:
      const attackAction = action as AttackAction;
      doAttackAction(newState, attackAction.enemy);
      break;
  }
  
  newState.canFlip = canFlip(state);
  
  return newState;
}



export function createGame(): GameState {
  const [initialBoard, initialDeck] = createRandomBoard();

  return {
    board: initialBoard,
    deck: initialDeck,
    phase: Phase.GAME_START,
    selected: null,
    winState: WinState.NONE,
    canFlip: false,
    history: [],
  }
}


function createRandomBoard(): [Board, EnemyCard[]] {
  const cards = require("./cards.json");
  // Create 3D array with null for board
  const board: Board = [...Array(NUM_ROWS)].map(() => [...Array(NUM_COLUMNS)].map(() => Array(2).fill(null)));
  
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


function addStateToHistory(state: GameState) {
  const newHistory = state.history ? [...state.history] : [];
  if (newHistory.length >= NUM_UNDOS) {
    newHistory.shift();
  }

  const newState: GameState = {
    ...state,
    history: null,
  };

  newHistory.push(newState);
  state.history = newHistory;
}

// Pure function
function undo(history: GameState[]): GameState {
  if (history.length === 0) {
    throw new Error("Tried to undo with empty history");
  }

  let newState = history.at(-1)!;
  newState.history = [...history];
  newState.history.pop();
  
  // Reset deck enemy health and index
  newState.deck = newState.deck.map((card) => ({
    ...card,
    health: card.strength,
    index: undefined,
  }))
  
  return newState;
}


function nextPhase(state: GameState) {
  addStateToHistory(state);

  switch (state.phase) {
    case Phase.ENCOUNTER:
      maneuverPhase(state);
      state.phase = Phase.MANEUVER;
      break;
    case Phase.MANEUVER:
      attackPhase(state);
      state.phase = Phase.ATTACK;
      break;
    case Phase.ATTACK:
      counterAttackPhase(state);
      state.phase = Phase.COUNTER_ATTACK;
      break;
    case Phase.COUNTER_ATTACK:
      encounterPhase(state);
      state.phase = Phase.ENCOUNTER;
      break;
    case Phase.GAME_START:
    default:
      encounterPhase(state);
      state.phase = Phase.ENCOUNTER;
      break;
  }
  

  // Unselect card
  state.selected = null;
}

  
function encounterPhase(state: GameState) {
  if (state.deck.length < NUM_ROWS) {
    if (state.winState === WinState.LAST_TURN) {
      // Check if win or loss
      const isWin = !state.board.flat(2).some(card => card?.type === CardType.ENEMY);
      if (isWin) {
        state.winState = WinState.WIN;
      } else {
        state.winState = WinState.LOSS;
        console.log("|  ||\n\n|| |_");
      }
    } else {
      state.winState = WinState.LAST_TURN;
    }
    
    return;
  }

  const newDeck = [...state.deck];
  const newBoard = state.board.map(row => [...row]);
  dealEnemies(newDeck, newBoard)


  updateJokerAdjacentHealth(newBoard);


  // Save new deck and board
  state.board = newBoard;
  state.deck = newDeck;
}


function maneuverPhase(state: GameState) {
  const newBoard = [...state.board];
  handleMortars(newBoard);
  state.board = newBoard;
}


function attackPhase(state: GameState) {
  const newBoard = removeFlares(state.board);
  unrotateCards(newBoard);
  state.board = newBoard;
}


function counterAttackPhase(state: GameState) {
  const newBoard = [...state.board];

  unrotateCards(newBoard);
  counterAttack(newBoard);
  removeTanks(newBoard);
  
  state.board = newBoard;
}


function dealEnemies(deck: EnemyCard[], board: Board) {
  for (let row = 0; row < NUM_ROWS; row++) {
    // Deal top card
    const card = deck.pop()!;


    // Work out position of card
    let position = card.position;
    
    // If it can't overlap, need to find position where it doesn't overlap
    // If it can't find a free space, it won't change position
    if (position >= 0 && !card.canOverlap && board[row][position][0]) {
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
          if (!board[row][attemptPosition][0]) {
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
          if (!board[row][attemptPosition][0]) {
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
    if (position >= 0) {
      if (card.canOverlap && board[row][position][0]) {
        // Put card on top instead of replacing
        placeCard(board, card, [row, position], 1);
      } else {
        placeCard(board, card, [row, position], 0);
      }
    }
  }
}


function handleMortars(board: Board) {
  // For all mortars
  for (const cards of board.flat().filter(
    cards => cards[0]?.name === "Mortar" || cards[1]?.name === "Mortar"
  )) {
      const mortarIndex = cards[0]!.index!;
      
      // Flip and rotate card under mortar
      if (board[mortarIndex[0]][mortarIndex[1]][0]?.type === CardType.PLAYER) {
        const card = placeCard(
          board,
          board[mortarIndex[0]][mortarIndex[1]][0]!,
          mortarIndex,
          0
        ) as PlayerCard;

        card.down = true;
        card.rotated = true;
      }
      
      // Flip all adjacent cards
      const indexes: [number, number][] = [
        [mortarIndex[0] + 1, mortarIndex[1]],
        [mortarIndex[0] - 1, mortarIndex[1]],
        [mortarIndex[0], mortarIndex[1] + 1],
        [mortarIndex[0], mortarIndex[1] - 1],
      ];
      for (const index of indexes) {
        // Check index is in bounds
        if (index[0] < 0 || index[1] < 1 || index[0] >= board.length || index[1] >= board[0].length) {
          continue;
        }
        
        const card = board[index[0]][index[1]][0]
        if (card?.type === CardType.PLAYER) {
          // Flip card
          const newCard = placeCard(board, card, index, 0) as PlayerCard;
          newCard.down = true;
        }
        
      }
      
      // Remove mortar
      if (cards[1]?.name === "Mortar") {
        cards[1] = null;
      } else {
        cards[0] = null;
      }
    }
  
  // Update joker and pacifist adjacent since they might be down
  updateJokerAdjacentHealth(board);
  updateHammerAnvilStrength(board);
}


function unrotateCards(board: Board) {
  for (const [rowIndex, row] of board.entries()) {
    for (const [columnIndex, cards] of row.entries()) {
      if (cards[0]?.type !== CardType.PLAYER) {
        return;
      }
      
      const newCard = placeCard(
        board, cards[0], [rowIndex, columnIndex], 0
      ) as PlayerCard;

      newCard.rotated = false;

      if (newCard.name === "The Athlete") {
        (newCard as AthleteCard).halfRotated = false;
      }
    }
  }
}


// Pure function
function removeFlares(board: Board): Board {
  return board.map(row => row.map(cards => cards.map(
    card => card?.name === "Flare" ? null : card
  )));
}


function counterAttack(board: Board) {
  for (const enemy of board.flat().filter(cards => cards[0]?.type === CardType.ENEMY)) {
    let toRemove: PlayerCard[] = [];

    if (enemy[0]!.name === "Infantry") {
      toRemove = toRemove.concat(findAdjacentPlayers(enemy[0]!.index!, board, false));
    } else if (enemy[0]!.name === "Machine Gun") {
      toRemove = toRemove.concat(findAdjacentPlayers(enemy[0]!.index!, board, true));
    } else if (enemy[0]!.name === "Tank") {
      // Find all player cards in that row
      toRemove = toRemove.concat(
        board[enemy[0]!.index![0]]
          .filter(cards => 
            (cards[0]?.type === CardType.PLAYER) && 
            (!(cards[0]! as PlayerCard).down)
          ).map(cards => cards[0]! as PlayerCard)
      );
    }
    
    for (const player of toRemove) {
      // Remove player
      board[player.index![0]][player.index![1]][0] = null;
    }
  }
  
  resetEnemyHealth(board);
  updateHammerAnvilStrength(board);
}


function removeTanks(board: Board) {
  for (let row = 0; row < board.length; row++) {
    placeCard(board, null, [row, 0], 0);
  }
}


function flipSelected(state: GameState) {
  if (!state.canFlip) {
    return;
  }

  addStateToHistory(state);

  const newBoard = [...state.board];

  // Find selected card
  const selectedCard = newBoard.flat().find((card) => card[0]?.id === state.selected)![0] as PlayerCard;
  const newCard = placeCard(newBoard, selectedCard, selectedCard.index!, 0);

  newCard.down = !selectedCard.down;
  newCard.rotated = true;

  // If joker, update enemy health
  if (selectedCard.name === "The Joker") {
    updateJokerAdjacentHealth(newBoard);
  }
  
  // If pacifist, update hammer/anvil strength
  if (selectedCard.name === "The Pacifist") {
    updateHammerAnvilStrength(newBoard);
  }
  
  // Deselect card
  state.selected = null;

  state.board = newBoard
}


function doMoveAction(state: GameState, from: [number, number], to: [number, number]) {
  if (canMove(state.board, from, to)) {
    addStateToHistory(state);
  
    const newBoard = [...state.board];
    const shouldUnselect = moveCard(newBoard, from, to, state.selected);
    if (shouldUnselect) {
      state.selected = null;
    }
    state.board = newBoard;
  }
}

function canMove(board: Board, from: [number, number], to: [number, number]): boolean {
  // Check if destIndex == sourceIndex
  if (to[0] === from[0] && to[1] === from[1]) {
    // Dragging back to the same spot means cancel the drag
    return false;
  }
  
  // Check that destIndex is in bounds
  if (to[1] < 1) {
    return false;
  }
  
  // Check if card is adjacent or diagonally adjacent
  const adjacent = [
    [from[0] - 1, from[1] - 1],
    [from[0] - 1, from[1]],
    [from[0] - 1, from[1] + 1],
    [from[0], from[1] - 1],
    [from[0], from[1] + 1],
    [from[0] + 1, from[1] - 1],
    [from[0] + 1, from[1]],
    [from[0] + 1, from[1] + 1],
  ];
  if (adjacent.filter((source) => source[0] === to[0] && source[1] === to[1]).length === 0) {
    return false;
  }

  // Check that both cards are up (except for the mouse) and not rotated
  const cards = [
    board[from[0]][from[1]][0],
    board[to[0]][to[1]][0],
  ]
  for (const card of cards) {
    if (
      card?.type === CardType.PLAYER && (
        (
          (card as PlayerCard).down &&
          card.name !== "The Mouse"
        ) || (card as PlayerCard).rotated
      )
    ) {
      return false;
    }
  }
  
  // If diagonally adjacent, check that movement is not blocked by diagonal enemies
  // TODO: Replace with findAdjacent
  let blocked = [[-1, -1], [-1, 1], [1, -1], [1, 1]].filter((value) => {
    if (to[0] === from[0] + value[0] && to[1] === from[1] + value[1]) {
      const card0 = board[from[0]][from[1] + value[1]];
      const card1 = board[from[0] + value[0]][from[1]];

      if (!card0 || !card1) {
        // Not blocked
        return false;
      }

      if (
        (card0[0]?.type === CardType.ENEMY || card0[1]?.type === CardType.ENEMY) &&
        (card1[0]?.type === CardType.ENEMY || card1[1]?.type === CardType.ENEMY)
      ) {
        // Blocked
        return true;
      }
    }

    // Not blocked
    return false;
  }).length > 0;

  if (blocked) {
    return false;
  }

  
  // Check if card to swap with is an enemy
  if (board[to[0]][to[1]][0]?.type === CardType.ENEMY) {
    return false;
  }
  
  // Check if card to swap with has card stacked on top
  if (board[to[0]][to[1]][1]) {
    return false;
  }
  
  // ALL CHECKS PASSED
  return true;
}
  

// Returns true if should unselect card
function moveCard(
  board: Board,
  from: [number, number],
  to: [number, number],
  selected: string | null,
) {
  // If one of the cards is the joker (up), reset enemy strength
  for (const index of [from, to]) {
    if (board[index[0]][index[1]][0]?.name === "The Joker" && !(board[index[0]][index[1]][0]! as PlayerCard).down) {
      const adjacentEnemies = findAdjacentEnemies(index, board);
      for (const enemy of adjacentEnemies) {
        enemy.health = enemy.strength;
      }
    }
  }
  
  // Swap cards
  const card1 = board[from[0]][from[1]][0];
  const card2 = board[to[0]][to[1]][0];
  const newCard1 = placeCard(board, card1, to, 0);
  const newCard2 = placeCard(board, card2, from, 0);

  // Rotate cards
  rotatePlayer(newCard1);
  rotatePlayer(newCard2);
  
  updateHammerAnvilStrength(board);

  let shouldUnselect = false;

  for (const card of [newCard1, newCard2]) {
    // If one of the cards is the joker (up), reduce enemy strength
    if (card?.name === "The Joker" && !(card as PlayerCard).down) {
      const adjacentEnemies = findAdjacentEnemies(card.index!, board);        
      for (const enemy of adjacentEnemies) {
        const newEnemy = placeCard(board, enemy, enemy.index!, 0)
        newEnemy.health = newEnemy.strength - 1;
      }
    }
    
    
    // If one of the cards was selected but is now down, should unselect
    if (card && card.id === selected && (card as PlayerCard).down) {
      shouldUnselect = true;
    }
  }
  
  return shouldUnselect
}


function doAttackAction(state: GameState, enemy: EnemyCard) {
  const selectedCard = state.board.flatMap(row => row.find(
    cards => cards[0]?.id === state.selected
  )).find(
    x => x !== null && x !== undefined
  ) as PlayerCard | undefined;

  if (!selectedCard) {
    return;
  }
  
  if (!canAttack(selectedCard, enemy.index!)) {
    return;
  }

  addStateToHistory(state);

  attack(state, selectedCard, enemy);
}


function canAttack(selectedCard: PlayerCard, enemyIndex: [number, number]): boolean {
  // TODO: Check that selected card is up

  // Check that selected is adjacent
  // TODO: Use hasAdjacent. Need to add diagonal version
  let adjacentIndexes = [
    [enemyIndex![0] - 1, enemyIndex![1]],
    [enemyIndex![0], enemyIndex![1] - 1],
    [enemyIndex![0], enemyIndex![1] + 1],
    [enemyIndex![0] + 1, enemyIndex![1]],
  ];
  
  // Special case for the natural, can attack diagonally
  if (selectedCard.name === "The Natural") {
    adjacentIndexes = adjacentIndexes.concat([
      [enemyIndex![0] - 1, enemyIndex![1] - 1],
      [enemyIndex![0] - 1, enemyIndex![1] + 1],
      [enemyIndex![0] + 1, enemyIndex![1] - 1],
      [enemyIndex![0] + 1, enemyIndex![1] + 1],
    ]);
  }

  return (adjacentIndexes.find(
    index => index[0] === selectedCard.index![0] && index[1] === selectedCard.index![1]
  ) !== null);
}


function attack(state: GameState, selectedCard: PlayerCard, enemy: EnemyCard) {
  const newBoard = [...state.board];

  const damage = selectedCard.effectiveStrength;
  
  const newEnemy = placeCard(newBoard, enemy, enemy.index!, 0);
  newEnemy.health -= damage;

  if (newEnemy.health <= 0) {
    // Remove enemy
    const index = newEnemy.index!;
    placeCard(newBoard, null, index, 0);
  }
  
  // Rotate selected card
  const newSelected = placeCard(state.board, selectedCard, selectedCard.index!, 0);
  newSelected.rotated = true;
  
  state.selected = null;
  state.board = newBoard
}


function canFlip(state: GameState): boolean {
  if (state.phase !== Phase.MANEUVER) {
    return false;
  }


  // Find selected card
  const selectedCard = state.board.flat().find(
    (card) => card[0]?.id === state.selected
  );
  
  if (selectedCard === undefined) {
    return false;
  }

  const selectedPlayerCard = selectedCard[0] as PlayerCard;

  // Card can't flip if it is rotated
  // Includes athlete's half-rotation
  // Mouse is an exception, it can flip *DOWN* when rotated
  if ((selectedPlayerCard.rotated || (
      selectedPlayerCard.name === "The Athlete" &&
      (selectedPlayerCard as AthleteCard).halfRotated
    )) && !(
      // If card is mouse and up, it can flip
      selectedPlayerCard.name === "The Mouse" &&
      !selectedPlayerCard.down
    )
  ) {
    return false;
  }
  
  // Leader can always flip
  if (selectedPlayerCard.name === "The Leader") {
    return true;
  } else if (selectedPlayerCard.down) {
    // Check if adjacent up card exists
    
    return hasAdjacent(selectedPlayerCard.index!, state.board, (card) => (
      (card !== null) &&
      (card.type === CardType.PLAYER) && 
      (!(card as PlayerCard).down)
    ));
  } else {
    return false;
  }
}


function rotatePlayer(card: CardData | null) {
  if (!card || card.type !== CardType.PLAYER) {
    return;
  }

  card = card as PlayerCard;

  if (card.name === "The Athlete") {
    // Special case for athlete
    if (!(card as AthleteCard).halfRotated) {
      (card as AthleteCard).halfRotated = true;
      return;
    } else {
      card.rotated = true;
      return;
    }
  } else {
    card.rotated = true;
    return;
  }
}



  

// Is pacifist adjacent AND UP
function isPacifistAdjacent(index: [number, number], board: Board): boolean {
  return hasAdjacent(index, board, card => card?.name === "The Pacifist" && !(card! as PlayerCard).down);
}


export function updateHammerAnvilStrength(board: Board) {
  // Check if pacifist adjacent to any hammer/anvil
  for (const row of board) {
    // For all hammer/anvils
    for (const cards of row.filter(
        cards => cards[0]?.name === "The Hammer" ||
        cards[0]?.name === "The Anvil"
    )) {
      const newCard = placeCard(
        board, cards[0]!, cards[0]!.index!, 0
      ) as PlayerCard;

      if (isPacifistAdjacent(cards[0]!.index!, board)) {
        // Increase strength
        newCard.effectiveStrength = newCard.strength + 1;
      } else {
        // Reset strength
        newCard.effectiveStrength = newCard.strength;
      }
    }
  }
}


function updateJokerAdjacentHealth(board: Board) {
  // Update strengths of enemies adjacent to joker (up)
  const joker = board.flat().find(cards => cards[0]?.name === "The Joker");
  if (!joker) {
    return;
  }
  
  const isDown = (joker[0]! as PlayerCard).down;

  const adjacentEnemies = findAdjacentEnemies(joker[0]!.index!, board);
  

  for (const enemy of adjacentEnemies) {
    // Check if on top or bottom
    const onTop = board[enemy.index![0]][enemy.index![1]][0]!.type == CardType.PLAYER;

    const newCard = placeCard(board, enemy, enemy.index!, onTop ? 1 : 0);

    if (isDown) {
      newCard.health = newCard.strength;
    } else {
      newCard.health = newCard.strength - 1;
    }
  }
}


function resetEnemyHealth(board: Board) {
  for (const [enemy] of board.flat().filter(cards => cards[0]?.type === CardType.ENEMY)) {
    const newCard = placeCard(board, enemy!, enemy!.index!, 0) as EnemyCard;
    newCard.health = newCard.strength;
  }
  
  updateJokerAdjacentHealth(board);
}


function findAdjacent(
  index: [number, number],
  board: Board,
  predicate: (card: CardData | null) => boolean
): CardData[] {
  const adjacent = [
    [index[0] - 1, index[1]],
    [index[0], index[1] - 1],
    [index[0], index[1] + 1],
    [index[0] + 1, index[1]],
  // No out of bounds indexes
  ].filter(adjIndex => adjIndex[0] >= 0 && adjIndex[1] >= 1 && adjIndex[0] < board.length && adjIndex[1] < board[0].length);
  
  const adjacentCards = adjacent
    .map(adjIndex => board[adjIndex[0]][adjIndex[1]][0])
    .filter(predicate)
    .map(card => card!);
  
  return adjacentCards;
}


function findAdjacentEnemies(index: [number, number], board: Board): EnemyCard[] {
  return findAdjacent(index, board, card => card?.type === CardType.ENEMY) as EnemyCard[];
}


function findAdjacentPlayers(index: [number, number], board: Board, up?: boolean): PlayerCard[] {
  if (up === undefined) {
    up = false;
  }

  return findAdjacent(
    index,
    board,
    card => card?.type === CardType.PLAYER && (!up || !(card! as PlayerCard).down)
  ).map(card => card as PlayerCard);
}


// Creates copy of card with updated index and places it on board
// Returns updated card
function placeCard<T extends CardData | null>(board: Board, card: T, index: [number, number], stackIndex: number): T {
  const newCard = (card ? {
    ...card,
    index: index,
  } : null) as T;
  
  const newCards = [...board[index[0]][index[1]]]
  newCards[stackIndex] = newCard;

  board[index[0]][index[1]] = newCards;
  
  return newCard;
}


// Taken from https://stackoverflow.com/a/12646864
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i --) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}


function hasAdjacent(
  index: [number, number],
  board: Board,
  predicate: (card: CardData | null) => boolean
): boolean {

  const adjacent = [
    [index[0] - 1, index[1]],
    [index[0], index[1] - 1],
    [index[0], index[1] + 1],
    [index[0] + 1, index[1]],
  // No out of bounds indexes
  ].filter(adjIndex => adjIndex[0] >= 0 && adjIndex[1] >= 1 && adjIndex[0] < board.length && adjIndex[1] < board[0].length);
  
  const cardIsAdjacent = adjacent
    .map(adjIndex => board[adjIndex[0]][adjIndex[1]][0])
    .find(predicate) !== undefined;
  
  return cardIsAdjacent;
}
// TODO: Remove
const isAdjacent = hasAdjacent;
const is_Adjacent = hasAdjacent;

