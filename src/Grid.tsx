import Cell from "./Cell";
import { AthleteCard, CardData, CardType, EnemyCard, GenericCard, PlayerCard } from "./CardData";
import { Active, DndContext, DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { useContext, useEffect, useState } from "react";
import { SetSelectedContext } from "./Contexts";


interface GridProps {
  list: (CardData | null)[][][],
  setList: React.Dispatch<React.SetStateAction<(CardData | null)[][][]>>,
}


function Grid({ list, setList }: GridProps) {
  // Checks whether mouse press was a click or a drag
  const [clickPhase, setClickPhase] = useState(0);
  const setSelected = useContext(SetSelectedContext);

  function onDragStart(_: DragStartEvent) {
    setClickPhase(1);
  }

  function onDragMove(_: DragMoveEvent) {
    setClickPhase(0);
  }

  function onDragEnd({over, active}: DragEndEvent) {
    if (clickPhase === 1) {
      setClickPhase(0);
      handleClick(active);
      return;
    }

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
    rotatePlayer(newList[destIndex[0]][destIndex[1]][0]);
    rotatePlayer(newList[sourceIndex[0]][sourceIndex[1]][0]);


    setList(newList);
  }


  function handleClick(active: Active) {
    setSelected!(active.data.current?.card.id);
  }


  return (
    <DndContext onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <div>
        {
          list.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cards, columnIndex) => (
                <Cell
                  key={`${rowIndex},${columnIndex}`}
                  id={`${rowIndex},${columnIndex}`}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  cards={cards}
                />
              ))}            
            </div>
          ))
        }
      </div>
   </DndContext> 
  );
}


function rotatePlayer(card: CardData | null) {
  if (!card || card.type !== CardType.Player) {
    return;
  }

  card = card as PlayerCard;

  if (card.name === "The Athlete") {
    if (!(card as AthleteCard).halfRotated) {
      (card as AthleteCard).halfRotated = true;
    } else {
      card.rotated = true;
    }
  } else {
    card.rotated = true;
  }
}


export default Grid;