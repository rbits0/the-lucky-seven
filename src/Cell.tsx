import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";
import { CardData } from "./CardData";


interface CellProps {
  id: string,
  card: CardData
}


function Cell({ id, card }: CellProps) {
  return (
    <Droppable droppableId={id}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-danger-subtle"
          style={{height: "min-content"}}
        >
          <Card card={card}/>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default Cell;