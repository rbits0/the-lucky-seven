import React, { useState } from "react";
import { DragDropContext, DropResult, ResponderProvided } from "@hello-pangea/dnd";
import Cell from "./Cell";
import { CardData, CardType } from "./CardData";


function Grid() {
  const [list, setList] = useState<CardData[][]>([
    [
      { id: "0", name: "Infantry", type: CardType.Enemy, strength: 2, position: 4 },
      { id: "1", name: "Infantry", type: CardType.Enemy, strength: 2, position: 3 },
    ],
    [
      { id: "2", name: "The Leader", type: CardType.Player, strength: 1 },
      { id: "3", name: "Infantry", type: CardType.Enemy, strength: 2 },
    ]
  ]);
  
  function onDragEnd(result: DropResult) {
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="d-flex mx-1">
        {
          // Array.from({ length: 8 }).map((value, index) => (
          list.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.map((card, columnIndex) => (
                <Cell key={card.id} id={card.id} card={card}/>
              ))}            
            </div>
          ))
          // ))
        }
      </div>
    </DragDropContext>
  );
}

export default Grid;