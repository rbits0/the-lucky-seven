import React, { useContext, useEffect, useState } from "react";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Phase, SharedContexts } from "./Contexts";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
  above?: boolean,
  attackCallback: (enemy: EnemyCard) => void,
}


function Card({ card, className, disabled, above, attackCallback }: CardProps) {
  const { phase, selected, setSelected } = useContext(SharedContexts)!;
  const [rotation, setRotation] = useState("0");
  const [imagePaths, setImagePaths] = useState<string[]>([]);

  // Variables to check in useEffects
  const rotated = (card as PlayerCard).rotated;
  const halfRotated = (card as AthleteCard).halfRotated;
  const down = (card as PlayerCard).down;
  const effectiveStrength = (card as PlayerCard).effectiveStrength;
  const health = (card as EnemyCard).health;

  const isSelected = selected === card.id;

  const enabled = (
    !disabled &&
    phase === Phase.MANEUVER &&
    card.type === CardType.PLAYER &&
    (
      !(card as PlayerCard).down ||
      card.name === "The Mouse"
    ) &&
    !(card as PlayerCard).rotated
  )

  const isClickable = (
    (

      phase === Phase.MANEUVER && 
      card.type === CardType.PLAYER &&
      !(card as PlayerCard).rotated

    ) || (

      phase === Phase.ATTACK &&
      (
        (
          card.type === CardType.PLAYER &&
            !(card as PlayerCard).rotated &&
            (!(card as PlayerCard).down || card.name === "The Mouse") &&
            card.strength > 0
        ) || (
          card.type === CardType.ENEMY &&
            selected &&
            (card as EnemyCard).strength >= 0
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
    if (card.type === CardType.PLAYER && rotated) {
      setRotation("90");
    } else if (card.name === "The Athlete" && halfRotated) {
      setRotation("45");
    } else {
      setRotation("0");
    }
  }, [card, rotated, halfRotated])
  

  // Update image paths whenever card changes
  useEffect(() => {
    const newImagePaths = [];
    
    if (card.type === CardType.ENEMY) {
      // Enemy
      
      

      //Image
      if (card.name === "Infantry") {
        newImagePaths.push(`Enemy/Image/Infantry ${card.strength}`);
      } else {
        newImagePaths.push(`Enemy/Image/${card.name}`);
      }
      
      // Health
      if (card.strength > 0) {
        // If health is different from strength, need to indicate that via change in colour
        const modified = card.strength === (card as EnemyCard).health ? "" : " Modified"
        
        newImagePaths.push(`Enemy/Strength/${card.name} ${(card as EnemyCard).health}${modified}`);
      } else {
        newImagePaths.push(`Enemy/Strength/${card.name}`);
      }
      
      // Position
      newImagePaths.push(`Enemy/Position/${(card as EnemyCard).position}`);
    } else {
      // Player

      if ((card as PlayerCard).down) {
        newImagePaths.push(`Player/Down/${card.name}`);
      } else {
        newImagePaths.push(`Player/Up/Image/${card.name}`);
        newImagePaths.push(`Player/Up/Strength/${card.name} ${(card as PlayerCard).effectiveStrength}`);
      }
    }
    
    setImagePaths(newImagePaths);
  }, [card, down, effectiveStrength, health])


  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (isClickable) {
      if (card.type === CardType.PLAYER) {
        setSelected(card.id);
      } else {
        attackCallback(card as EnemyCard);
      }
    }
  }


  return (
      <div
        ref={setNodeRef}
        className={`aspect-[185/258] absolute
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
        <div className={`w-full h-full absolute rounded-lg
          ${isSelected && !isDragging ? "outline outline-4 outline-offset-2 outline-sky-600" : ""}
        `}></div>
        <div className={`w-full h-full text-center flex flex-col select-none rounded-lg card
          ${card.type === CardType.ENEMY ? "bg-rose-700" : "bg-green-700"}
        `}>
          {imagePaths.map(imagePath => (
            <img key={imagePath} src={`${process.env.PUBLIC_URL}/cards/${imagePath}.png`} alt={card.name}/>
          ))}
        </div>
      </div>
  );
}

export default Card;