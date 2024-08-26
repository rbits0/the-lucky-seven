import Cell from "./Cell";
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { GameActionType, MoveAction, NUM_ROWS } from "./Game";
import { useContext } from "react";
import { GameContext } from "./Contexts";


function Grid() {
  const [gameState, gameDispatch] = useContext(GameContext)!;

  // const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1}}))
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } })
  );
  

  function onDragEnd({over, active}: DragEndEvent) {
    if (!over) {
      return;
    }
    
    const destIndex: [number, number] = over?.data.current?.index;
    const sourceIndex: [number, number] = active.data.current?.card.index;
    
    gameDispatch({
      type: GameActionType.MOVE,
      from: sourceIndex,
      to: destIndex
    } as MoveAction)
  }
  

  function attack(enemy: EnemyCard) {
    const selectedCard = board.flatMap(row => row.find(cards => cards[0]?.id === selected)).filter(x => x)[0];
    if (!selectedCard) {
      return;
    }
    

    // Check that selected is adjacent
    let adjacentIndexes = [
      [enemy.index![0] - 1, enemy.index![1]],
      [enemy.index![0], enemy.index![1] - 1],
      [enemy.index![0], enemy.index![1] + 1],
      [enemy.index![0] + 1, enemy.index![1]],
    ];
    
    // Special case for the natural, can attack diagonally
    if (selectedCard.name === "The Natural") {
      adjacentIndexes = adjacentIndexes.concat([
        [enemy.index![0] - 1, enemy.index![1] - 1],
        [enemy.index![0] - 1, enemy.index![1] + 1],
        [enemy.index![0] + 1, enemy.index![1] - 1],
        [enemy.index![0] + 1, enemy.index![1] + 1],
      ]);
    }

    if (!adjacentIndexes.find(index => index[0] === selectedCard.index![0] && index[1] === selectedCard.index![1])) {
      return;
    }
    
    
    // CHECKS COMPLETED, attack is successful
    addStateToHistory();
    
    const newBoard = [...board];
    const damage = (selectedCard as PlayerCard).effectiveStrength;
    
    enemy.health -= damage;

    if (enemy.health <= 0) {
      // Remove enemy
      const index = enemy.index!;
      newBoard[index[0]][index[1]][0] = null;
    }
    
    // Rotate player
    (selectedCard as PlayerCard).rotated = true;
    
    // Unselect player
    setSelected(null);
    
    setBoard(newBoard);
  }


  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <table className={`self-start flex-shrink table-fixed grid-aspect`}>
        {
          board.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{height: `${100 / NUM_ROWS}%`}}
            >
            {/* <tr key={rowIndex} className={`h-100%`}> */}
              {row.map((cards, columnIndex) => (
                <Cell
                  key={`${rowIndex},${columnIndex}`}
                  id={`${rowIndex},${columnIndex}`}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  cards={cards}
                  attackCallback={attack}
                />
              ))}            
            </tr>
          ))
        }
      </table>
   </DndContext> 
  );
}


export default Grid;