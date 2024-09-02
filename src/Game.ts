import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";

export const NUM_ROWS = 4
export const NUM_COLUMNS = 7
export const NUM_UNDOS = 3;

type Board = (CardData | null)[][][];
type ReadonlyBoard = ReadonlyArray<ReadonlyArray<
  (Readonly<CardData> | null)[]
>>;


export interface GameState {
  board: Board,
  deck: EnemyCard[],
  phase: Phase,
  selected: string | null,
  winState: WinState,
  canFlip: boolean,
  history: Readonly<GameState>[] | null,
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
  SELECT,
}

export enum Phase {
  GAME_START,
  ENCOUNTER,
  MANEUVER,
  ATTACK,
  COUNTER_ATTACK,
}

export interface GameAction {
  type: GameActionType
}

export interface MoveAction extends GameAction {
  type: GameActionType.MOVE,
  from: [number, number],
  to: [number, number],
}

export interface SelectAction extends GameAction {
  type: GameActionType.SELECT,
  card: CardData | null,
}



export function gameReducer(state: GameState, action: GameAction) {
  switch (action.type) {
    case GameActionType.RESET:
      return createGame();
    case GameActionType.UNDO:
      if (state.history === null) {
        throw new TypeError("Tried to undo, but history is null");
      }

      return undo(state.history);
    case GameActionType.NEXT_PHASE:
      nextPhase(state);
      break;
    case GameActionType.FLIP_SELECTED:
      flipSelected(state);
      break;
    case GameActionType.MOVE:
      const moveAction = action as MoveAction;
      doMoveAction(state, moveAction.from, moveAction.to);
      break;
    case GameActionType.SELECT:
      const selectAction = action as SelectAction;
      doSelectAction(state, selectAction.card);
      break;
  }
  
  state.canFlip = canFlip(state);
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
  if (!state.history) {
    state.history = [];
  }
  if (state.history.length >= NUM_UNDOS) {
    state.history.shift();
  }

  const newState = structuredClone(state);
  newState.history = null;

  state.history.push(newState);
}

// Pure function
function undo(history: readonly GameState[]): GameState {
  if (history.length === 0) {
    throw new Error("Tried to undo with empty history");
  }

  const newHistory = [...history];
  const newState = newHistory.pop()!;
  newState.history = newHistory;
  
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

  dealEnemies(state.deck, state.board);


  updateJokerAdjacentHealth(state.board);
}


function maneuverPhase(state: GameState) {
  handleMortars(state.board);
}


function attackPhase(state: GameState) {
  removeFlares(state.board);
  unrotateCards(state.board);
}


function counterAttackPhase(state: GameState) {
  unrotateCards(state.board);
  counterAttack(state.board);
  removeTanks(state.board);
}


function dealEnemies(deck: EnemyCard[], board: Board) {
  for (let row = 0; row < NUM_ROWS; row++) {
    // Deal top card
    const card = deck.pop()!;

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
        board[row][position][1] = card;
      } else {
        board[row][position][0] = card;
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
        const card = board[mortarIndex[0]][mortarIndex[1]][0]! as PlayerCard;
        card.down = true;
        card.rotated = true;
      }
      
      // TODO: Use findAdjacent
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
          (card as PlayerCard).down = true;
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
  for (const row of board) {
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
}


function removeFlares(board: Board) {
  for (const cards of board.flat()) {
    for (const [cardIndex, card] of cards.entries()) {
      if (card?.name === "Flare") {
        cards[cardIndex] = null;
      }
    }
  }
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
    board[row][0][0] = null;
  }
}


function flipSelected(state: GameState) {
  if (!state.canFlip) {
    return;
  }

  addStateToHistory(state);

  // Find selected card
  const selectedCard = state.board.flat().find((card) => card[0]?.id === state.selected)![0] as PlayerCard;

  selectedCard.down = !selectedCard.down;
  selectedCard.rotated = true;

  // If joker, update enemy health
  if (selectedCard.name === "The Joker") {
    updateJokerAdjacentHealth(state.board);
  }
  
  // If pacifist, update hammer/anvil strength
  if (selectedCard.name === "The Pacifist") {
    updateHammerAnvilStrength(state.board);
  }
  
  // Deselect card
  state.selected = null;
}


function doMoveAction(state: GameState, from: [number, number], to: [number, number]) {
  if (canMoveTo(state.board, from, to)) {
    addStateToHistory(state);
  
    const shouldUnselect = moveCard(state.board, from, to, state.selected);
    if (shouldUnselect) {
      state.selected = null;
    }
  }
}

function canMoveTo(board: ReadonlyBoard, from: [number, number], to: [number, number]): boolean {
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
  [
    board[from[0]][from[1]][0],
    board[to[0]][to[1]][0]
  ] = [card2, card1];
  

  // Rotate cards
  if (card1?.type === CardType.PLAYER) {
    rotatePlayer(card1 as PlayerCard);
  }
  if (card2?.type === CardType.PLAYER) {
    rotatePlayer(card2 as PlayerCard);
  }
  
  updateHammerAnvilStrength(board);

  let shouldUnselect = false;

  for (const card of [card1, card2]) {
    // If one of the cards is the joker (up), reduce enemy strength
    if (card?.name === "The Joker" && !(card as PlayerCard).down) {
      const adjacentEnemies = findAdjacentEnemies(card.index!, board);        
      for (const enemy of adjacentEnemies) {
        enemy.health = enemy.strength - 1;
      }
    }
    
    
    // If one of the cards was selected but is now down, should unselect
    if (card && card.id === selected && (card as PlayerCard).down) {
      shouldUnselect = true;
    }
  }
  
  return shouldUnselect;
}


function doAttackAction(state: GameState, enemy: Readonly<EnemyCard>) {
  const selectedCard = state.board.flatMap(row => row.find(
    cards => cards[0]?.id === state.selected
  )).find(
    x => x !== null && x !== undefined
  ) as PlayerCard | undefined;

  if (!selectedCard) {
    return;
  }
  
  if (!canAttackEnemy(selectedCard, enemy)) {
    return;
  }

  addStateToHistory(state);

  attack(state, selectedCard, enemy);
}


export function canAttackEnemy(
  card: Readonly<PlayerCard>,
  enemy: Readonly<EnemyCard>
): boolean {
  if (!canPlayerAttack(card)) {
    return false;
  }
  
  if (enemy.strength === -1) {
    return false;
  }
  
  // Check that selected is adjacent
  // TODO: Use hasAdjacent. Need to add diagonal version
  let adjacentIndexes = [
    [enemy.index![0] - 1, enemy.index![1]],
    [enemy.index![0], enemy.index![1] - 1],
    [enemy.index![0], enemy.index![1] + 1],
    [enemy.index![0] + 1, enemy.index![1]],
  ];
  
  // Special case for the natural, can attack diagonally
  if (card.name === "The Natural") {
    adjacentIndexes = adjacentIndexes.concat([
      [enemy.index![0] - 1, enemy.index![1] - 1],
      [enemy.index![0] - 1, enemy.index![1] + 1],
      [enemy.index![0] + 1, enemy.index![1] - 1],
      [enemy.index![0] + 1, enemy.index![1] + 1],
    ]);
  }

  return (adjacentIndexes.find(
    index => index[0] === card.index![0] && index[1] === card.index![1]
  ) !== null);
}


export function canPlayerAttack(card: Readonly<PlayerCard>): boolean {
  return (
    !(card as PlayerCard).rotated &&
    (!(card as PlayerCard).down || card.name === "The Mouse") &&
    card.strength > 0
  );
}


function attack(state: GameState, selectedCard: PlayerCard, enemy: EnemyCard) {
  const damage = selectedCard.effectiveStrength;
  
  enemy.health -= damage;

  if (enemy.health <= 0) {
    // Remove enemy
    const index = enemy.index!;
    state.board[index[0]][index[1]][0] = null;
  }
  
  // Rotate selected card
  selectedCard.rotated = true;
  
  state.selected = null;
}


function doSelectAction(state: GameState, card: CardData | null) {
  if (card?.type === CardType.ENEMY) {
    doAttackAction(state, card as EnemyCard);
  } else {
    state.selected = card ? card.id : null;
  }
}


function canFlip(state: Readonly<GameState>): boolean {
  // Find selected card
  const selectedCard = state.board.flat().find(
    (card) => card[0]?.id === state.selected
  );
  
  if (selectedCard === undefined) {
    console.log("No selected");
    return false;
  }

  const selectedPlayerCard = selectedCard[0] as PlayerCard;
  return canCardFlip(state, selectedPlayerCard);
}


export function canCardFlip(state: Readonly<GameState>, card: Readonly<PlayerCard>): boolean {
  if (state.phase !== Phase.MANEUVER) {
    return false;
  }

  // Mouse can always flip DOWN
  if (card.name === "The Mouse" && !card.down) {
    return true;
  }
  
  // Card can't flip if it is rotated
  // Includes athlete's half-rotation
  if (
    card.rotated || 
    (
      card.name === "The Athlete" &&
      (card as AthleteCard).halfRotated
    )
  ) {
    return false;
  }
  

  // Leader can always flip, even if down
  if (!card.down || card.name === "The Leader") {
    return true;
  } else {
    // Card is down

    // Check if adjacent up card exists
    return hasAdjacent(card.index!, state.board, (card) => (
      (card !== null) &&
      (card.type === CardType.PLAYER) && 
      (!(card as PlayerCard).down)
    ));
  }
}


function rotatePlayer(card: PlayerCard) {
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
function isPacifistAdjacent(index: [number, number], board: ReadonlyBoard): boolean {
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
      const card = cards[0]! as PlayerCard;

      if (isPacifistAdjacent(card.index!, board)) {
        // Increase strength
        card.effectiveStrength = card.strength + 1;
      } else {
        // Reset strength
        card.effectiveStrength = card.strength;
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
    const onTop = board[enemy.index![0]][enemy.index![1]][0]!.type === CardType.PLAYER;

    if (isDown) {
      enemy.health = enemy.strength;
    } else {
      enemy.health = enemy.strength - 1;
    }
  }
}


function resetEnemyHealth(board: Board) {
  for (const [enemy] of board.flat().filter(cards => cards[0]?.type === CardType.ENEMY)) {
    (enemy! as EnemyCard).health = enemy!.strength;
  }
  
  updateJokerAdjacentHealth(board);
}


function findAdjacent(
  index: [number, number],
  board: Board,
  predicate: (card: Readonly<CardData> | null) => boolean
): CardData[] {
  const adjacent = [
    [index[0] - 1, index[1]],
    [index[0], index[1] - 1],
    [index[0], index[1] + 1],
    [index[0] + 1, index[1]],
  // No out of bounds indexes
  ].filter(adjIndex => (
    (adjIndex[0] >= 0) &&
    (adjIndex[1] >= 1) &&
    (adjIndex[0] < board.length) &&
    (adjIndex[1] < board[0].length)
  ));
  
  const adjacentCards = adjacent
    .map(adjIndex => board[adjIndex[0]][adjIndex[1]][0])
    .filter(predicate)
    .map(card => card!);
  
  return adjacentCards;
}


function findAdjacentEnemies(
  index: [number, number],
  board: Board
): EnemyCard[] {
  return findAdjacent(
    index,
    board,
    card => card?.type === CardType.ENEMY
  ) as EnemyCard[];
}


function findAdjacentPlayers(
  index: [number, number],
  board: Board,
  up?: boolean
): PlayerCard[] {
  if (up === undefined) {
    up = false;
  }

  return findAdjacent(
    index,
    board,
    card => card?.type === CardType.PLAYER && (!up || !(card! as PlayerCard).down)
  ) as PlayerCard[];
}


// Creates copy of card with updated index and places it on board
// Returns updated card
// function placeCard<T extends CardData | null>(
//   board: Board, card: Readonly<T>, index: [number, number], stackIndex: number
// ): T {
//   const newCard = (card ? {
//     ...card,
//     index: index,
//   } : null) as T;
  
//   const newCards = [...board[index[0]][index[1]]]
//   newCards[stackIndex] = newCard;

//   board[index[0]][index[1]] = newCards;
  
//   return newCard;
// }


export function isMoveable(state: Readonly<GameState>, card: Readonly<CardData>): boolean {
  return (
    state.phase === Phase.MANEUVER &&
    card.type === CardType.PLAYER &&
    (
      !(card as PlayerCard).down ||
      card.name === "The Mouse"
    ) &&
    !(card as PlayerCard).rotated
  )
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
  board: ReadonlyBoard,
  predicate: (card: Readonly<CardData> | null) => boolean
): boolean {
  return findAdjacent(index, board as Board, predicate).length > 0;
}


// // Copies array 2 levels deep
// // Returns a mutable copy
// // Note: When copying Board, won't copy third layer. It will reference the same
// // object
// function copy2DArray<T>(
//   array: ReadonlyArray<ReadonlyArray<T>>
// ): T[][] {
//   return array.map((row) => [...row]);
// }