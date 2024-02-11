import Cell from "./Cell";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { NUM_ROWS, } from "./App";
import { useContext } from "react";
import { SharedContexts } from "./Contexts";


interface GridProps {
  board: (CardData | null)[][][],
  setBoard: React.Dispatch<React.SetStateAction<(CardData | null)[][][]>>,
}


function Grid({ board, setBoard }: GridProps) {

  // const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1}}))
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } })
  );
  
  const { selected, setSelected, addStateToHistory } = useContext(SharedContexts)!;


  function onDragEnd({over, active}: DragEndEvent) {

    if (!over) {
      return;
    }
    
    const destIndex: [number, number] = over?.data.current?.index;
    const sourceIndex: [number, number] = active.data.current?.card.index;
    
    // Check if destIndex == sourceIndex
    if (destIndex[0] === sourceIndex[0] && destIndex[1] === sourceIndex[1]) {
      // Dragging back to the same spot means cancel the drag
      return;
    }
    
    // Check if card is adjacent or diagonally adjacent
    const adjacent = [
      [sourceIndex[0] - 1, sourceIndex[1] - 1],
      [sourceIndex[0] - 1, sourceIndex[1]],
      [sourceIndex[0] - 1, sourceIndex[1] + 1],
      [sourceIndex[0], sourceIndex[1] - 1],
      [sourceIndex[0], sourceIndex[1] + 1],
      [sourceIndex[0] + 1, sourceIndex[1] - 1],
      [sourceIndex[0] + 1, sourceIndex[1]],
      [sourceIndex[0] + 1, sourceIndex[1] + 1],
    ];
    if (adjacent.filter((source) => source[0] === destIndex[0] && source[1] === destIndex[1]).length === 0) {
      return
    }
    
    // If diagonally adjacent, check that movement is not blocked by diagonal enemies
    let blocked = [[-1, -1], [-1, 1], [1, -1], [1, 1]].filter((value) => {
      if (destIndex[0] === sourceIndex[0] + value[0] && destIndex[1] === sourceIndex[1] + value[1]) {
        const card0 = board[sourceIndex[0]][sourceIndex[1] + value[1]];
        const card1 = board[sourceIndex[0] + value[0]][sourceIndex[1]];

        if (!card0 || !card1) {
          // Not blocked
          return false;
        }

        if (
          (card0[0]?.type === CardType.Enemy || card0[1]?.type === CardType.Enemy) &&
          (card1[0]?.type === CardType.Enemy || card1[1]?.type === CardType.Enemy)
        ) {
          // Blocked
          return true;
        }
      }

      // Not blocked
      return false;
    }).length > 0;

    if (blocked) {
      return;
    }

    
    // Check if card to swap with is an enemy
    if (board[destIndex[0]][destIndex[1]][0]?.type === CardType.Enemy) {
      return;
    }
    
    // Check if card to swap with has card stacked on top
    if (board[destIndex[0]][destIndex[1]][1]) {
      return;
    }
    

    // ALL CHECKS COMPLETED
    // Move is successful
    

    addStateToHistory();
    
    // If one of the cards is the joker (up), reset enemy strength
    for (const index of [sourceIndex, destIndex]) {
      if (board[index[0]][index[1]][0]?.name === "The Joker" && !(board[index[0]][index[1]][0]! as PlayerCard).down) {
        const adjacentEnemies = findAdjacentEnemies(index, board);
        for (const enemy of adjacentEnemies) {
          enemy.health = enemy.strength;
        }
      }
    }
    
    // Swap cards
    const newBoard = [...board];
    [
      newBoard[sourceIndex[0]][sourceIndex[1]][0],
      newBoard[destIndex[0]][destIndex[1]][0]
    ] = [
      newBoard[destIndex[0]][destIndex[1]][0],
      newBoard[sourceIndex[0]][sourceIndex[1]][0]
    ];
    
    // Update card indexes
    newBoard[destIndex[0]][destIndex[1]][0]!.index = destIndex;
    if (newBoard[sourceIndex[0]][sourceIndex[1]][0]) {
      newBoard[sourceIndex[0]][sourceIndex[1]][0]!.index = sourceIndex;
    }

    // Rotate cards
    rotatePlayer(newBoard[destIndex[0]][destIndex[1]][0], selected, setSelected);
    rotatePlayer(newBoard[sourceIndex[0]][sourceIndex[1]][0], selected, setSelected);
    

    updateHammerAnvilStrength(newBoard);


    // If one of the cards is the joker (up), reduce enemy strength
    for (const index of [sourceIndex, destIndex]) {
      if (newBoard[index[0]][index[1]][0]?.name === "The Joker" && !(newBoard[index[0]][index[1]][0]! as PlayerCard).down) {
        const adjacentEnemies = findAdjacentEnemies(index, newBoard);        
        for (const enemy of adjacentEnemies) {
          enemy.health = enemy.strength - 1;
        }
      }
    }


    setBoard(newBoard);
  }
  

  function attack(enemy: EnemyCard) {
    const selectedCard = board.flatMap(row => row.find(cards => cards[0]?.id === selected)).filter(x => x)[0];
    if (!selectedCard) {
      return;
    }
    

    // Check that selected is adjacent
    let adjacentIndexes = [
      [enemy.index![0] - 1, enemy.index![1]],
      [enemy.index![0], enemy.index![1] - 1],
      [enemy.index![0], enemy.index![1] + 1],
      [enemy.index![0] + 1, enemy.index![1]],
    ];
    
    // Special case for the natural, can attack diagonally
    if (selectedCard.name === "The Natural") {
      adjacentIndexes = adjacentIndexes.concat([
        [enemy.index![0] - 1, enemy.index![1] - 1],
        [enemy.index![0] - 1, enemy.index![1] + 1],
        [enemy.index![0] + 1, enemy.index![1] - 1],
        [enemy.index![0] + 1, enemy.index![1] + 1],
      ]);
    }

    if (!adjacentIndexes.find(index => index[0] === selectedCard.index![0] && index[1] === selectedCard.index![1])) {
      return;
    }
    
    
    // CHECKS COMPLETED, attack is successful
    addStateToHistory();
    
    const newBoard = [...board];
    const damage = (selectedCard as PlayerCard).effectiveStrength;
    
    enemy.health -= damage;

    if (enemy.health <= 0) {
      // Remove enemy
      const index = enemy.index!;
      newBoard[index[0]][index[1]][0] = null;
    }
    
    // Rotate player
    (selectedCard as PlayerCard).rotated = true;
    
    // Unselect player
    setSelected(null);
    
    setBoard(newBoard);
  }


  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <table className={`table-fixed grid-aspect`}>
        {
          board.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{height: `${100 / NUM_ROWS}%`}}
            >
            {/* <tr key={rowIndex} className={`h-100%`}> */}
              {row.map((cards, columnIndex) => (
                <Cell
                  key={`${rowIndex},${columnIndex}`}
                  id={`${rowIndex},${columnIndex}`}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  cards={cards}
                  attackCallback={attack}
                />
              ))}            
            </tr>
          ))
        }
      </table>
   </DndContext> 
  );
}


function rotatePlayer(
  card: CardData | null,
  selected: string | null,
  setSelected: React.Dispatch<React.SetStateAction<string | null>>
) {
  if (!card || card.type !== CardType.Player) {
    return;
  }

  card = card as PlayerCard;

  if (card.name === "The Athlete") {
    // Special case for athlete
    if (!(card as AthleteCard).halfRotated) {
      (card as AthleteCard).halfRotated = true;
    } else {
      card.rotated = true;
      
      // Unselect card
      if (card.id === selected) {
        setSelected(null);
      }
    }
  } else {
    card.rotated = true;
    
    // Unselect card
    if (card.id === selected) {
      setSelected(null);
    }
  }
  
}


function is_Adjacent(
  index: [number, number],
  board: (CardData | null)[][][],
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

// Is pacifist adjacent AND UP
function isPacifistAdjacent(index: [number, number], board: (CardData | null)[][][]): boolean {
  return is_Adjacent(index, board, card => card?.name === "The Pacifist" && !(card! as PlayerCard).down);
}

export function updateHammerAnvilStrength(board: (CardData | null)[][][]) {
  // Check if pacifist adjacent to any hammer/anvil
  for (const row of board) {
    // For all hammer/anvils
    for (const cards of row
      .filter(
        cards => cards[0]?.name === "The Hammer" ||
        cards[0]?.name === "The Anvil"
      )
    ) {
      if (isPacifistAdjacent(cards[0]!.index!, board)) {
        // Increase strength
        (cards[0]! as PlayerCard).effectiveStrength = (cards[0]!.strength + 1);
      } else {
        // Reset strength
        (cards[0]! as PlayerCard).effectiveStrength = (cards[0]!.strength);
      }
    }
  }
}


function findAdjacent(
  index: [number, number],
  board: (CardData | null)[][][],
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

export function findAdjacentEnemies(index: [number, number], board: (CardData | null)[][][]): EnemyCard[] {
  return findAdjacent(index, board, card => card?.type === CardType.Enemy)
    .map(card => card as EnemyCard);
}

export function findAdjacentPlayers(index: [number, number], board: (CardData | null)[][][], up?: boolean): PlayerCard[] {
  if (up === undefined) {
    up = false;
  }

  return findAdjacent(
    index,
    board,
    card => card?.type === CardType.Player && (!up || !(card! as PlayerCard).down)
  ).map(card => card as PlayerCard);
}


export default Grid;