import Cell from "./Cell";
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
  

  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <table className={`self-start flex-shrink table-fixed grid-aspect`}>
        {
          gameState.board.map((row, rowIndex) => (
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