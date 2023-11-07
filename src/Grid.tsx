import React, { useState } from "react";
import Cell from "./Cell";
import { CardData, CardType } from "./CardData";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import Card from "./Card";


function Grid() {
  const [list, setList] = useState<CardData[][]>([
    [
      { id: "0", name: "Infantry", type: CardType.Enemy, strength: 2, position: 4, index: [0, 0] },
      { id: "1", name: "Iefantry", type: CardType.Enemy, strength: 2, position: 3, index: [0, 1]},
    ],
    [
      { id: "2", name: "The Leader", type: CardType.Player, strength: 1, index: [1, 0] },
      { id: "3", name: "Infantry", type: CardType.Enemy, strength: 2, index: [1, 1] },
    ]
  ]);
  

  function onDragEnd({over, active}: DragEndEvent) {
    if (!over) {
      return;
    }
    
    const destIndex: [number, number] = over?.data.current?.index;
    const sourceIndex: [number, number] = active.data.current?.card.index;
    
    // Swap cards
    const newList = [...list];
    console.log(`dest: ${destIndex[0]},${destIndex[1]}  source: ${sourceIndex[0]},${sourceIndex[1]}`)
    console.dir(newList);
    [
      newList[sourceIndex[0]][sourceIndex[1]],
      newList[destIndex[0]][destIndex[1]]
    ] = [
      newList[destIndex[0]][destIndex[1]],
      newList[sourceIndex[0]][sourceIndex[1]]
    ];
    
    // Update card indexes
    newList[destIndex[0]][destIndex[1]].index = destIndex;
    if (newList[sourceIndex[0]][sourceIndex[1]]) {
      newList[sourceIndex[0]][sourceIndex[1]].index = sourceIndex;
    }


    setList(newList);
    console.dir(newList);
  }
  

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="mx-1">
        {
          list.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((card, columnIndex) => (
                <Cell
                  key={`${rowIndex},${columnIndex}`}
                  id={`${rowIndex},${columnIndex}`}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  card={card}
                />
              ))}            
            </div>
          ))
        }
      </div>
   </DndContext> 
  );
}

export default Grid;