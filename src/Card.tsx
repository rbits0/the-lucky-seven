import React, { useContext, useEffect, useState } from "react";
import { AthleteCard, CardData, CardType, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Phase, PhaseContext } from "./Contexts";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
  above?: boolean,
}


function Card({ card, className, disabled, above }: CardProps) {
  const [enabled, setEnabled] = useState(false);
  const phase = useContext(PhaseContext);
  const [rotation, setRotation] = useState("0");

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
    setEnabled(
      !disabled &&
      phase === Phase.MANEUVER &&
      card.type === CardType.Player &&
      (
        !(card as PlayerCard).down ||
        card.name === "The Mouse"
      ) &&
      !(card as PlayerCard).rotated
    );
  }, [card, disabled, phase]);

  // Update rotation whenever card changes
  useEffect(() => {
    if (card.type === CardType.Player && (card as PlayerCard).rotated) {
      setRotation("90");
    } else if (card.name === "The Athlete" && (card as AthleteCard).halfRotated) {
      setRotation("45");
    } else {
      setRotation("0");
    }
  }, [card])



  return (
    <>
      <div
        ref={setNodeRef}
        className={`text-center flex flex-col border-black select-none p-1 rounded-lg
          ${card.type === CardType.Enemy ? "bg-rose-700" : "bg-green-700"}
          ${// Card should be above everything when it's being dragged
            isDragging ? "z-30" : above ? "z-20" : "z-10"
          }
          ${className}
        `}
        {...listeners}
        {...attributes}
        role={enabled ? "button" : ""}
        style={{
          ...style,
          height: "90%",
          width: "calc(90% * 9 / 14)",
          transform: `${style ? style!.transform : ""} rotate(${rotation}deg)`
        }}
      >
        <h2 className="text-xl">{card.name}</h2>
        <h2 className="text-xl mt-auto">{card.strength}</h2>
        {card.type === CardType.Player && (card as PlayerCard).down ?
          <h2 className="text-xl">Down</h2>
        : null}
      </div>
    </>
  );
}

export default Card;