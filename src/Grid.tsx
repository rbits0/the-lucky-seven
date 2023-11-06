import React, { useState } from "react";
import { DragDropContext, DragUpdate, DropResult, ResponderProvided } from "@hello-pangea/dnd";
import Cell from "./Cell";
import { CardData, CardType } from "./CardData";


function Grid() {
  const [list, setList] = useState<CardData[][]>([
    [
      { id: "0", name: "Infantry", type: CardType.Enemy, strength: 2, position: 4 },
      { id: "1", name: "Iefantry", type: CardType.Enemy, strength: 2, position: 3 },
    ],
    [
      { id: "2", name: "The Leader", type: CardType.Player, strength: 1 },
      { id: "3", name: "Infantry", type: CardType.Enemy, strength: 2 },
    ]
  ]);
  
  function onDragEnd({ destination, source, draggableId }: DropResult) {
    console.dir(draggableId);
    console.dir(destination);

    // const { destination, source, draggableId } = result;
    // console.dir(result);

    // if (!destination) {
    //   return;
    // }

    // const newList = Array.from(list);
    // newList.splice(source.index, 1);
    // newList.splice(destination.index, 0, draggableId);
    
    // setList(newList);
  }
  
  function onDragUpdate({destination, source, draggableId}: DragUpdate) {
    console.dir(destination);
  }


  return (
    <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
      <div className="mx-1">
        {
          list.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((card, columnIndex) => (
                <Cell key={`${rowIndex},${columnIndex}`} id={`${rowIndex},${columnIndex}`} card={card}/>
              ))}            
            </div>
          ))
        }
      </div>
    </DragDropContext>
  );
}

export default Grid;