import React from "react";
import Card from "./Card";
import { CardData } from "./CardData";
import { useDroppable } from "@dnd-kit/core";


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
    <div
      className={`flex items-center justify-center relative 
        ${columnIndex > 0 ? "border border-black" : ""}
        ${isOver ? "bg-pink-400" : "bg-white"}`
      }
      style={{height: "14em", width: "14em"}}
      ref={setNodeRef}
    >
      {cards[0] ? 
        <Card card={cards[0]} disabled={cards[1] !== null}/>
      : null}
      {cards[1] ? 
        <Card card={cards[1]} disabled={true} className="absolute mt-[30%]" above={true}/> 
      : null}
    </div>
  );
}

export default Cell;