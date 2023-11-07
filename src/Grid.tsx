import React, { useEffect, useState } from "react";
import Cell from "./Cell";
import { CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import Card from "./Card";


const NUM_ROWS = 4
const NUM_COLUMNS = 6


function Grid() {
  const [initialBoard, initialDeck] = createRandomBoard();
  const [list, setList] = useState<(CardData | null)[][]>(initialBoard);
  const [deck, setDeck] = useState<EnemyCard[]>(initialDeck);
  

  function dealEnemies() {
    if (deck.length < NUM_ROWS) {
      return
    }

    const newDeck = [...deck];
    const newList = list.map(row => [...row]);

    for (let row = 0; row < NUM_ROWS; row++) {
      // Deal top card
      const card = newDeck.pop()!;
      

      // Work out position of card
      let position = card.position;
      // If it can't overlap, need to find position where it doesn't overlap
      if (!card.canOverlap && newList[row][position]) {
        // Determine whether to prioritise left or right
        const prioritisedDirection = position < NUM_COLUMNS / 2 ? -1 : 1;
        
        let index = 1;
        let prioritisedExhausted = false;
        let unprioritisedExhausted = false;

        while (!(prioritisedExhausted && unprioritisedExhausted)) {
          // Try prioritised direction first
          let attemptPosition = position + index * prioritisedDirection;
          if (attemptPosition < 0 || attemptPosition >= NUM_COLUMNS) {
            prioritisedExhausted = true;
          } else {
            if (!newList[row][attemptPosition]) {
              // Success
              position = attemptPosition;
              break;
            }
          }
          
          // Try other direction
          attemptPosition = position + index * (prioritisedDirection * -1);
          if (attemptPosition < 0 || attemptPosition >= NUM_COLUMNS) {
            unprioritisedExhausted = true;
          } else {
            if (!newList[row][attemptPosition]) {
              // Success
              position = attemptPosition;
              break;
            }
          }
          
          // Increment index
          index += 1;
        }
      }
      

      // Place card
      newList[row][position] = card;
    }

    // Save new deck and list
    setList(newList);
    setDeck(newDeck);
  }

  useEffect(() => {
  }, [])
  

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


function createRandomBoard(): [(CardData | null)[][], EnemyCard[]] {
    const cards = require("./cards.json");
    const list: (CardData | null)[][] = [...Array(NUM_ROWS)].map(() => Array(NUM_COLUMNS).fill(null));
    
    // Shuffle row and column numbers
    let row_numbers: number[][] = shuffleArray(cards.rows);
    let column_numbers: number[][] = shuffleArray(cards.columns);
    

    // Shuffle player cards
    let players = shuffleArray(
      (cards.players as any[]).map((card, i) => (
        {...card, id: card.name, type: CardType.Player, down: false}
      ))
    ) as PlayerCard[];
    
    // Place player cards
    players.forEach((player, i) => {
      // Find row and column
      const rowIndex = row_numbers.findIndex(value => value.includes(i));
      const columnIndex = column_numbers.findIndex(value => value.includes(i));
      
      // Update index
      player.index = [rowIndex, columnIndex];

      // Place card
      list[rowIndex][columnIndex] = player;
    });
    

    // Remove last player card
    const rowIndex = row_numbers.findIndex(value => value.includes(players.length - 1));
    const columnIndex = column_numbers.findIndex(value => value.includes(players.length - 1));
    list[rowIndex][columnIndex] = null;
    
    // Down adjacent players
    const adjacent = [[rowIndex - 1, columnIndex], [rowIndex + 1, columnIndex], [rowIndex, columnIndex - 1], [rowIndex, columnIndex + 1]];
    for (const index of adjacent) {
      // Check that index is in bounds
      if (index[0] < 0 || index[0] >= NUM_ROWS || index[1] < 0 || index[1] >= NUM_COLUMNS) {
        continue;
      }
      
      if (list[index[0]][index[1]]) {
        (list[index[0]][index[1]] as PlayerCard).down = true;
      }
    }
    

    // Parse enemy cards
    let enemies: EnemyCard[] = [];
    for (const [i, enemy] of cards.enemies.entries()) {
      for (const position of enemy.positions) {
        const newEnemy = { ...enemy, position: position, id: `enemy${i}`, type: CardType.Enemy};
        delete newEnemy.positions;
        enemies.push(newEnemy);
      }
    }
    
    // Shuffle enemy cards
    shuffleArray(enemies);

    
    return [list, enemies];
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