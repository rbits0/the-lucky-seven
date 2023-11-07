import React, { useEffect, useState } from "react";
import Cell from "./Cell";
import { CardData, CardType, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import Card from "./Card";


const NUM_ROWS = 4
const NUM_COLUMNS = 6


function Grid() {
  const [list, setList] = useState<(CardData | null)[][]>(createRandomBoard());
  const [deck, setDeck] = useState<CardData[]>([]);
  

  useEffect(() => {
  }, [])
  

  function onDragEnd({over, active}: DragEndEvent) {
    if (!over) {
      return;
    }
    
    const destIndex: [number, number] = over?.data.current?.index;
    const sourceIndex: [number, number] = active.data.current?.card.index;
    
    // Swap cards
    const newList = [...list];
    console.log(`dest: ${destIndex[0]},${destIndex[1]}  source: ${sourceIndex[0]},${sourceIndex[1]}`)
    console.dir(newList);
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
    console.dir(newList);
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


function createRandomBoard(): (CardData | null)[][] {
    const cards = require("./cards.json");
    const list = [...Array(NUM_ROWS)].map(() => Array(NUM_COLUMNS).fill(null));
    
    // Shuffle row and column numbers
    let row_numbers: number[][] = shuffleArray(cards.rows);
    let column_numbers: number[][] = shuffleArray(cards.columns);
    
    // Shuffle player cards
    let players: PlayerCard[] = shuffleArray(cards.players);
    
    // Place player cards
    players.forEach((player, i) => {
      // Find row and column
      const row_index = row_numbers.findIndex(value => value.includes(i));
      const column_index = column_numbers.findIndex(value => value.includes(i));

      // Place card
      console.log(`${row_index}, ${column_index}`)
      list[row_index][column_index] = player;
    });

    
    return list;
}


// Taken from https://stackoverflow.com/a/12646864
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i --) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}


export default Grid;