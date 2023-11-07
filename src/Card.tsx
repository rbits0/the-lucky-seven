import React, { useState } from "react";
import { CardData } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";


interface CardProps {
  card: CardData,
  row: number,
  column: number,
}


function Card({ card }: CardProps) {

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    data: {
      card: card,
    }
  })
  
  const style: React.CSSProperties | undefined = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;


  return (
    <div
      ref={setNodeRef}
      className="text-center flex flex-col justify-center border border-black bg-rose-700 select-none"
      {...listeners}
      {...attributes}
      onDragStart={() => {console.log("A")}}
      style={{ ...style, height: "15em", width: "11em"}}
    >
      <h2 className="text-2xl font-bold">{card.name}</h2>
      <h2 className="text-xl">{card.strength}</h2>
    </div>
  );
}

export default Card;