import React, { useEffect, useState } from "react";
import { CardData, CardType, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
}


function Card({ card, className, disabled }: CardProps) {
  const [enabled, setEnabled] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      card: card,
    },
    disabled: !enabled,
  })
  
  const style: React.CSSProperties | undefined = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;

  
  // Update enabled whenever card changes
  useEffect(() => {
    setEnabled(!disabled && card.type === CardType.Player && !(card as PlayerCard).down);
  }, [card, disabled]);


  return (
    <>
      <div
        ref={setNodeRef}
        className={`text-center mt-3 mb-3 flex flex-col justify-center border border-black select-none
          ${card.type === CardType.Enemy ? "bg-rose-700" : "bg-green-700"}
          ${// Card should be above everything when it's being dragged
            isDragging ? "z-30" : "z-10"
          }
          ${className}
        `}
        {...listeners}
        {...attributes}
        role={enabled ? "button" : ""}
        onDragStart={() => {console.log("A")}}
        style={{ ...style, height: "calc(100% - 2rem)", width: "calc(100% - 2rem)" }}
      >
        <h2 className="text-2xl font-bold">{card.name}</h2>
        <h2 className="text-xl">{card.strength}</h2>
        {card.type === CardType.Player && (card as PlayerCard).down ?
          <h2 className="text-xl">Down</h2>
        : null}
      </div>
    </>
  );
}

export default Card;