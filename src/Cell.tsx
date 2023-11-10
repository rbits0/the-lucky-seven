import React from "react";
import Card from "./Card";
import { CardData } from "./CardData";
import { useDroppable } from "@dnd-kit/core";


interface CellProps {
  id: string,
  rowIndex: number,
  columnIndex: number,
  card: CardData | null,
}


function Cell({ id, rowIndex, columnIndex, card }: CellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      index: [rowIndex, columnIndex]
    }
  })

  return (
    <div
      className={`flex p-2 items-center justify-center border border-black ${isOver ? "bg-pink-400" : "bg-white"}`}
      style={{height: "16em", width: "12em"}}
      ref={setNodeRef}
    >
      {card ? 
        <Card card={card} row={rowIndex} column={columnIndex}/>
      : null}
    </div>
  );
}

export default Cell;