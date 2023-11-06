import React from "react";
import { CardData } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";


interface CardProps {
  card: CardData,
}


function Card({ card }: CardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id
  })
  
  const style: React.CSSProperties | undefined = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;

  React.useEffect(() => {
    console.log(style?.transform);
  }, [style])

  return (
    <div
      ref={setNodeRef}
      className="border border-black bg-rose-700"
      {...listeners}
      {...attributes}
      style={{ ...style, height: "15em", width: "11em"}}
    >
      <h2>{card.name}</h2>
    </div>
  );
}

export default Card;