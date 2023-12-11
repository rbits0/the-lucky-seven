import Cell from "./Cell";
import { CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { NUM_ROWS, NUM_COLUMNS } from "./App";


interface GridProps {
  list: (CardData | null)[][][],
  setList: React.Dispatch<React.SetStateAction<(CardData | null)[][][]>>
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
    
    // Check if card to swap with is an enemy
    if (list[destIndex[0]][destIndex[1]][0]?.type === CardType.Enemy) {
      return;
    }
    
    // Check if card to swap with has card stacked on top
    if (list[destIndex[0]][destIndex[1]][1]) {
      return;
    }
    
    // Swap cards
    const newList = [...list];
    [
      newList[sourceIndex[0]][sourceIndex[1]][0],
      newList[destIndex[0]][destIndex[1]][0]
    ] = [
      newList[destIndex[0]][destIndex[1]][0],
      newList[sourceIndex[0]][sourceIndex[1]][0]
    ];
    
    // Update card indexes
    newList[destIndex[0]][destIndex[1]][0]!.index = destIndex;
    if (newList[sourceIndex[0]][sourceIndex[1]][0]) {
      newList[sourceIndex[0]][sourceIndex[1]][0]!.index = sourceIndex;
    }


    setList(newList);
  }
  

  return (
    <DndContext onDragEnd={onDragEnd}>
      <table className={`table-fixed w-[80%]`}
        style={{aspectRatio: `${NUM_COLUMNS}/${NUM_ROWS}`}}
      >
        {
          list.map((row, rowIndex) => (
            <tr key={rowIndex} className="">
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