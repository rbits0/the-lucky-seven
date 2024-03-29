import React from "react";
import Card from "./Card";
import { CardData, EnemyCard } from "./CardData";
import { useDroppable } from "@dnd-kit/core";
import { NUM_ROWS } from "./App";


interface CellProps {
  id: string,
  rowIndex: number,
  columnIndex: number,
  cards: (CardData | null)[],
  attackCallback: (enemy: EnemyCard) => void,
}


function Cell({ id, rowIndex, columnIndex, cards, attackCallback }: CellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      index: [rowIndex, columnIndex]
    }
  })

  return (
    <td
      className={`border border-black border-collapse bg-clip-border
        ${isOver && (columnIndex !== 0) ? "bg-slate-200" : "bg-white"}
      `}
      // style={{height: "14em", width: "14em"}}
      ref={setNodeRef}
    >
      <div className="flex justify-center items-center relative h-full">
        {cards[0] ? 
          <Card card={cards[0]} disabled={cards[1] !== null} attackCallback={attackCallback}/>
        : null}
        {cards[1] ? 
          <Card card={cards[1]} disabled={true} className="absolute mt-[30%]" attackCallback={attackCallback} above={true} /> 
        : null}
      </div>
    </td>
  );
}

export default Cell;