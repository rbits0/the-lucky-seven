import React, { useState } from "react";
import { CardData, CardType, PlayerCard } from "./CardData";
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
      className="w-full h-full text-center flex flex-col justify-center border border-black bg-rose-700 select-none"
      {...listeners}
      {...attributes}
      onDragStart={() => {console.log("A")}}
      style={style}
    >
      <h2 className="text-2xl font-bold">{card.name}</h2>
      <h2 className="text-xl">{card.strength}</h2>
      {card.type === CardType.Player && (card as PlayerCard).down ?
        <h2 className="text-xl">Down</h2>
      : null}
    </div>
  );
}

export default Card;