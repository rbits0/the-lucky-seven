import React from "react";
import Card from "./Card";
import { CardData } from "./CardData";


interface CellProps {
  id: string,
  card: CardData
}


function Cell({ id, card }: CellProps) {
  return (
    <div
      className={`flex items-center justify-center border border-black`}
      style={{height: "16em", width: "12em"}}
    >
      <Card card={card}/>
    </div>
  );
}

export default Cell;