import React from "react";
import Card from "./Card";
import { CardData } from "./CardData";
import { useDroppable } from "@dnd-kit/core";
import { NUM_ROWS } from "./App";


interface CellProps {
  id: string,
  rowIndex: number,
  columnIndex: number,
  cards: (CardData | null)[],
}


function Cell({ id, rowIndex, columnIndex, cards }: CellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      index: [rowIndex, columnIndex]
    }
  })

  return (
    <td
      className={`border border-black border-collapse bg-clip-border
        ${isOver ? "bg-pink-400" : "bg-white"}
      `}
      // style={{height: "14em", width: "14em"}}
      ref={setNodeRef}
    >
      <div className="flex justify-center items-center relative h-full">
        {cards[0] ? 
          <Card card={cards[0]} disabled={cards[1] !== null}/>
        : null}
        {cards[1] ? 
          <Card card={cards[1]} disabled={true} className="absolute mt-[30%]" above={true}/> 
        : null}
      </div>
    </td>
  );
}

export default Cell;