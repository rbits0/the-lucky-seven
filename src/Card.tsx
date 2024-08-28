import React, { useContext, useMemo } from "react";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GameContext } from "./Contexts";
import { canCardFlip, canPlayerAttack, GameActionType, GameState, isMoveable, Phase, SelectAction } from "./Game";


interface CardProps {
  card: Readonly<CardData>,
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
  const cardIsMoveable = (!disabled && isMoveable(gameState, card));
  const cardIsClickable = isClickable(gameState, card);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      card: card,
    },
    disabled: !cardIsMoveable,
  })
  
  const style: React.CSSProperties | undefined = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;


  function handleClick() {
    if (cardIsClickable) {
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
        role={cardIsClickable ? "button" : ""}
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


function isClickable(state: GameState, card: CardData): boolean {
  if (card.type === CardType.PLAYER) {
    const playerCard = card as PlayerCard;
    return (
      (canCardFlip(state, playerCard)) ||
      (
        (state.phase === Phase.ATTACK) && 
        (canPlayerAttack(playerCard))
      )
    );
  } else {
    return (state.phase === Phase.ATTACK);
  }
}

export default Card;