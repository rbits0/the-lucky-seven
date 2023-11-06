import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { CardData } from "./CardData";


interface CardProps {
  card: CardData,
}


function Card({ card }: CardProps) {
  return (
    <Draggable draggableId={card.id} index={0}>
      {provided => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className="border border-black bg-rose-700"
          style={{ ...provided.draggableProps.style, height: "15em", width: "11em"}}
        >
          <h2>{card.name}</h2>
        </div>
      )}
    </Draggable>
  );
}

export default Card;