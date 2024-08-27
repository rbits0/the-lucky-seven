import React, { useContext, useMemo } from "react";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GameContext, Phase } from "./Contexts";
import { GameActionType, SelectAction } from "./Game";


interface CardProps {
  card: CardData,
  className?: string,
  disabled: boolean,
  above?: boolean,
}


function Card({ card, className, disabled, above }: CardProps) {
  const [gameState, gameDispatch] = useContext(GameContext)!;
  
  const rotation = (
    (card.type === CardType.PLAYER && (card as PlayerCard).rotated) ? "90" :
    (card.name === "The Athlete" && (card as AthleteCard).halfRotated) ? "45" :
    "0"
  );
  const imagePaths = useMemo(() => getImagePaths(card), [card]);
  const isSelected = (gameState.selected === card.id);

  // TODO: Move to seperate function
  const isMoveable = (
    !disabled &&
    gameState.phase === Phase.MANEUVER &&
    card.type === CardType.PLAYER &&
    (
      !(card as PlayerCard).down ||
      card.name === "The Mouse"
    ) &&
    !(card as PlayerCard).rotated
  )

  // TODO: Move to seperate functions
  const isClickable = (
    (

      gameState.phase === Phase.MANEUVER && 
      card.type === CardType.PLAYER &&
      (
        // The mouse can flip *DOWN* even if rotated
        !(card as PlayerCard).rotated ||
        (
          card.name === "The Mouse" &&
          !(card as PlayerCard).down
        )
      )

    ) || (

      gameState.phase === Phase.ATTACK &&
      (
        (
          card.type === CardType.PLAYER &&
            !(card as PlayerCard).rotated &&
            (!(card as PlayerCard).down || card.name === "The Mouse") &&
            card.strength > 0
        ) || (
          card.type === CardType.ENEMY &&
            gameState.selected &&
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
    disabled: !isMoveable,
  })
  
  const style: React.CSSProperties | undefined = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;


  function handleClick() {
    if (isClickable) {
      gameDispatch({
        type: GameActionType.SELECT,
        card: card,
      } as SelectAction);
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


// Update image paths whenever card changes
function getImagePaths(card: CardData): string[] {
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
  
  return newImagePaths;
}

export default Card;