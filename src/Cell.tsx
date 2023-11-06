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
    <Droppable droppableId={id} isCombineEnabled={true} isDropDisabled={true}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex items-center justify-center border border-black ${snapshot.isDraggingOver ? "bg-pink-400" : "bg-white"}`}
          style={{height: "16em", width: "12em"}}
        >
          <Card card={card}/>
        </div>
      )}
    </Droppable>
  );
}

export default Cell;