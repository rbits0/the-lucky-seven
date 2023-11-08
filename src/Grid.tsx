import Cell from "./Cell";
import { CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import Card from "./Card";


interface GridProps {
  list: (CardData | null)[][],
  setList: React.Dispatch<React.SetStateAction<(CardData | null)[][]>>
}


function Grid({ list, setList }: GridProps) {

  function onDragEnd({over, active}: DragEndEvent) {
    if (!over) {
      return;
    }
    
    const destIndex: [number, number] = over?.data.current?.index;
    const sourceIndex: [number, number] = active.data.current?.card.index;
    
    // Check if destIndex == sourceIndex
    if (destIndex[0] === sourceIndex[0] && destIndex[1] === sourceIndex[1]) {
      // Dragging back to the same spot means cancel the drag
      return;
    }
    
    // Swap cards
    const newList = [...list];
    [
      newList[sourceIndex[0]][sourceIndex[1]],
      newList[destIndex[0]][destIndex[1]]
    ] = [
      newList[destIndex[0]][destIndex[1]],
      newList[sourceIndex[0]][sourceIndex[1]]
    ];
    
    // Update card indexes
    newList[destIndex[0]][destIndex[1]]!.index = destIndex;
    if (newList[sourceIndex[0]][sourceIndex[1]]) {
      newList[sourceIndex[0]][sourceIndex[1]]!.index = sourceIndex;
    }


    setList(newList);
  }
  

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="mx-1">
        {
          list.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((card, columnIndex) => (
                <Cell
                  key={`${rowIndex},${columnIndex}`}
                  id={`${rowIndex},${columnIndex}`}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  card={card}
                />
              ))}            
            </div>
          ))
        }
      </div>
   </DndContext> 
  );
}


export default Grid;