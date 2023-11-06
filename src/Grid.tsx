import React, { useState } from "react";
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
  

  return (
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
  );
}

export default Grid;