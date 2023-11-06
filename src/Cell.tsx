import React from "react";
import Card from "./Card";
import { CardData } from "./CardData";
import { useDroppable } from "@dnd-kit/core";


interface CellProps {
  id: string,
  card: CardData
}


function Cell({ id, card }: CellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div
      className={`flex items-center justify-center border border-black ${isOver ? "bg-pink-400" : "bg-white"}`}
      style={{height: "16em", width: "12em"}}
      ref={setNodeRef}
    >
      <Card card={card}/>
    </div>
  );
}

export default Cell;