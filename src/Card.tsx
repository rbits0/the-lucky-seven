import React from "react";
import { CardData } from "./CardData";


interface CardProps {
  card: CardData,
}


function Card({ card }: CardProps) {
  return (
    <div
      className="border border-black bg-rose-700"
      style={{ height: "15em", width: "11em"}}
    >
      <h2>{card.name}</h2>
    </div>
  );
}

export default Card;