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
          className="border m-1 mt-2 bg-body-secondary"
          style={{ ...provided.draggableProps.style, width: "8em", height: "12em" }}
        >
          <h2>{card.name}</h2>
        </div>
      )}
    </Draggable>
  );
}

export default Card;