import Cell from "./Cell";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { NUM_ROWS, } from "./App";
import { useContext } from "react";
import { SelectedContext, SetSelectedContext } from "./Contexts";


interface GridProps {
  list: (CardData | null)[][][],
  setList: React.Dispatch<React.SetStateAction<(CardData | null)[][][]>>,
}


function Grid({ list, setList }: GridProps) {

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1}}))
  const selected = useContext(SelectedContext);
  const setSelected = useContext(SetSelectedContext)!;


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
        const card0 = list[sourceIndex[0]][sourceIndex[1] + value[1]];
        const card1 = list[sourceIndex[0] + value[0]][sourceIndex[1]];

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
    if (list[destIndex[0]][destIndex[1]][0]?.type === CardType.Enemy) {
      return;
    }
    
    // Check if card to swap with has card stacked on top
    if (list[destIndex[0]][destIndex[1]][1]) {
      return;
    }
    
    // If one of the cards is the joker, reset enemy strength
    for (const index of [sourceIndex, destIndex]) {
      if (list[index[0]][index[1]][0]?.name === "The Joker") {
        const adjacentEnemies = findAdjacentEnemies(index, list);
        for (const enemy of adjacentEnemies) {
          enemy.health = enemy.strength;
        }
      }
    }
    
    // Swap cards
    const newList = [...list];
    [
      newList[sourceIndex[0]][sourceIndex[1]][0],
      newList[destIndex[0]][destIndex[1]][0]
    ] = [
      newList[destIndex[0]][destIndex[1]][0],
      newList[sourceIndex[0]][sourceIndex[1]][0]
    ];
    
    // Update card indexes
    newList[destIndex[0]][destIndex[1]][0]!.index = destIndex;
    if (newList[sourceIndex[0]][sourceIndex[1]][0]) {
      newList[sourceIndex[0]][sourceIndex[1]][0]!.index = sourceIndex;
    }

    // Rotate cards
    rotatePlayer(newList[destIndex[0]][destIndex[1]][0], selected, setSelected);
    rotatePlayer(newList[sourceIndex[0]][sourceIndex[1]][0], selected, setSelected);
    

    updateHammerAnvilStrength(newList);


    // If one of the cards is the joker, reduce enemy strength
    for (const index of [sourceIndex, destIndex]) {
      if (newList[index[0]][index[1]][0]?.name === "The Joker") {
        const adjacentEnemies = findAdjacentEnemies(index, newList);        
        for (const enemy of adjacentEnemies) {
          enemy.health = enemy.strength - 1;
        }
      }
    }


    setList(newList);
  }
  

  function attack(enemy: EnemyCard) {
    const selectedCard = list.flatMap(row => row.find(cards => cards[0]?.id === selected)).filter(x => x)[0];
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
    
    const newList = [...list];
    const damage = (selectedCard as PlayerCard).effectiveStrength;
    
    enemy.health -= damage;

    if (enemy.health <= 0) {
      // Remove enemy
      const index = enemy.index!;
      newList[index[0]][index[1]][0] = null;
    }
    
    // Rotate player
    (selectedCard as PlayerCard).rotated = true;
    
    // Unselect player
    setSelected(null);
    
    setList(newList);
  }


  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <table className={`table-fixed grid-aspect`}>
        {
          list.map((row, rowIndex) => (
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
  list: (CardData | null)[][][],
  predicate: (card: CardData | null) => boolean
): boolean {

  const adjacent = [
    [index[0] - 1, index[1]],
    [index[0], index[1] - 1],
    [index[0], index[1] + 1],
    [index[0] + 1, index[1]],
  // No out of bounds indexes
  ].filter(adjIndex => adjIndex[0] >= 0 && adjIndex[1] >= 1 && adjIndex[0] < list.length && adjIndex[1] < list[0].length);
  
  const cardIsAdjacent = adjacent
    .map(adjIndex => list[adjIndex[0]][adjIndex[1]][0])
    .find(predicate) !== undefined;
  
  return cardIsAdjacent;
}

function isPacifistAdjacent(index: [number, number], list: (CardData | null)[][][]): boolean {
  return is_Adjacent(index, list, card => card?.name === "The Pacifist");
}

export function updateHammerAnvilStrength(list: (CardData | null)[][][]) {
  // Check if pacifist adjacent to any hammer/anvil
  for (const row of list) {
    // For all hammer/anvils
    for (const cards of row
      .filter(
        cards => cards[0]?.name === "The Hammer" ||
        cards[0]?.name === "The Anvil"
      )
    ) {
      if (isPacifistAdjacent(cards[0]!.index!, list)) {
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
  list: (CardData | null)[][][],
  predicate: (card: CardData | null) => boolean
): CardData[] {
  const adjacent = [
    [index[0] - 1, index[1]],
    [index[0], index[1] - 1],
    [index[0], index[1] + 1],
    [index[0] + 1, index[1]],
  // No out of bounds indexes
  ].filter(adjIndex => adjIndex[0] >= 0 && adjIndex[1] >= 1 && adjIndex[0] < list.length && adjIndex[1] < list[0].length);
  
  const adjacentCards = adjacent
    .map(adjIndex => list[adjIndex[0]][adjIndex[1]][0])
    .filter(predicate)
    .map(card => card!);
  
  return adjacentCards;
}

export function findAdjacentEnemies(index: [number, number], list: (CardData | null)[][][]): EnemyCard[] {
  return findAdjacent(index, list, card => card?.type === CardType.Enemy)
    .map(card => card as EnemyCard);
}

export function findAdjacentPlayers(index: [number, number], list: (CardData | null)[][][], up?: boolean): PlayerCard[] {
  if (up === undefined) {
    up = false;
  }

  return findAdjacent(
    index,
    list,
    card => card?.type === CardType.Player && (!up || !(card! as PlayerCard).down)
  ).map(card => card as PlayerCard);
}


export default Grid;