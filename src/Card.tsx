import React, { useContext, useEffect, useState } from "react";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Phase, PhaseContext, SelectedContext, SetSelectedContext } from "./Contexts";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
  above?: boolean,
  attackCallback: (enemy: EnemyCard) => void,
}


function Card({ card, className, disabled, above, attackCallback }: CardProps) {
  const phase = useContext(PhaseContext);
  const selected = useContext(SelectedContext);
  const setSelected = useContext(SetSelectedContext)!;
  const [rotation, setRotation] = useState("0");

  const rotated = (card as PlayerCard).rotated;
  const halfRotated = (card as AthleteCard).halfRotated;
  const isSelected = selected === card.id;

  const enabled = (
    !disabled &&
    phase === Phase.MANEUVER &&
    card.type === CardType.Player &&
    (
      !(card as PlayerCard).down ||
      card.name === "The Mouse"
    ) &&
    !(card as PlayerCard).rotated
  )

  const isClickable = (
    (
      phase === Phase.MANEUVER && 
      card.type === CardType.Player &&
      !(card as PlayerCard).rotated
    ) || (
      phase === Phase.ATTACK &&
      (
        (
          card.type === CardType.Player &&
          !(card as PlayerCard).rotated
        ) || (
          card.type === CardType.Enemy &&
          selected
        )
      )
    )
  );

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

  
  // Update rotation whenever card changes
  useEffect(() => {
    if (card.type === CardType.Player && rotated) {
      setRotation("90");
    } else if (card.name === "The Athlete" && halfRotated) {
      setRotation("45");
    } else {
      setRotation("0");
    }
  }, [card, rotated, halfRotated])


  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (isClickable) {
      if (card.type === CardType.Player) {
        setSelected(card.id);
      } else {
        attackCallback(card as EnemyCard);
      }
    }
  }


  return (
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
        <h2 className="text-xl mt-auto">{
          card.type === CardType.Player ?
            card.strength : 
            (card as EnemyCard).health
        }</h2>
        {card.type === CardType.Player && (card as PlayerCard).down ?
          <h2 className="text-xl">Down</h2>
        : null}
        {isSelected ? <p>Selected</p> : null}
      </div>
  );
}

export default Card;