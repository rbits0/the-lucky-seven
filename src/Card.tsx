import React, { useContext, useEffect, useState } from "react";
import { AthleteCard, CardData, CardType, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Phase, PhaseContext, SelectedContext, SetSelectedContext } from "./Contexts";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
  above?: boolean,
}


function Card({ card, className, disabled, above }: CardProps) {
  const [enabled, setEnabled] = useState(false);
  const phase = useContext(PhaseContext);
  const selected = useContext(SelectedContext);
  const setSelected = useContext(SetSelectedContext)!;
  const [isSelected, setIsSelected] = useState(false);
  const [rotation, setRotation] = useState("0");

  const isClickable = (
    card.type === CardType.Player &&
    (phase === Phase.MANEUVER || phase === Phase.ATTACK) && 
    !(card as PlayerCard).rotated
  );
  const rotated = (card as PlayerCard).rotated;

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
  }, [card, rotated, disabled, phase]);

  // Update rotation whenever card changes
  useEffect(() => {
    if (card.type === CardType.Player && (card as PlayerCard).rotated) {
      setRotation("90");
    } else if (card.name === "The Athlete" && (card as AthleteCard).halfRotated) {
      setRotation("45");
    } else {
      setRotation("0");
    }
  }, [card, rotated])


  // Update isSelected whenever selected changes
  useEffect(() => {
    setIsSelected(selected === card.id);
  }, [selected, card])


  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    console.log("A");
    
    if (isClickable) {
      setSelected(card.id);
    }
  }


  return (
    <>
      <div
        ref={setNodeRef}
        className={`text-center flex flex-col border-black select-none p-1 rounded-lg aspect-[9/14]
          ${card.type === CardType.Enemy ? "bg-rose-700" : "bg-green-700"}
          ${// Card should be above everything when it's being dragged
            isDragging ? "z-30" : above ? "z-20" : "z-10"
          }
          ${className}
        `}
        {...listeners}
        {...attributes}
        role={isClickable ? "button" : ""}
        style={{
          ...style,
          height: "90%",
          transform: `${style ? style!.transform : ""} rotate(${rotation}deg)`
        }}
        onClick={handleClick}
      >
        <h2 className="text-xl">{card.name}</h2>
        <h2 className="text-xl mt-auto">{card.strength}</h2>
        {card.type === CardType.Player && (card as PlayerCard).down ?
          <h2 className="text-xl">Down</h2>
        : null}
        {isSelected ? <p>Selected</p> : null}
      </div>
    </>
  );
}

export default Card;