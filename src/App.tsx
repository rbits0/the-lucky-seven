import React, { MutableRefObject, useEffect, useReducer, useRef, useState } from "react";
import './App.css';
import Grid, { findAdjacentEnemies, findAdjacentPlayers, updateHammerAnvilStrength } from './Grid';
import { AthleteCard, CardData, CardType, EnemyCard, PlayerCard } from "./CardData";
import { Contexts, Phase, SharedContexts } from "./Contexts";
import { Active } from "@dnd-kit/core";
import GameEndPopup from "./GameEndPopup";
import { createGame, gameReducer, GameState } from "./Game";


export const BUTTON_STYLE = "mt-4 h-min p-2 w-40 rounded-md bg-gray-400 hover:bg-gray-500 active:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-700";


function App() {
  const [gameState, gameDispatch] = useReducer(gameReducer, null, createGame);
  
  

  
  

  // Check if selected card can be flipped
  useEffect(() => {
    if (phase !== Phase.MANEUVER) {
      setCanFlip(false);
      return;
    }


    let canFlip = false;
    
    // Find selected card
    const selectedCard = board.flat().find((card) => card[0]?.id === selected);

    if (selectedCard) {
      const selectedPlayerCard = selectedCard[0] as PlayerCard;

      // Card can't flip if it is rotated
      // Includes athlete's half-rotation
      // Mouse is an exception, it can flip *DOWN* when rotated
      if ((selectedPlayerCard.rotated || (
          selectedPlayerCard.name === "The Athlete" &&
          (selectedPlayerCard as AthleteCard).halfRotated
        )) && !(
          // If card is mouse and up, it can flip
          selectedPlayerCard.name === "The Mouse" &&
          !selectedPlayerCard.down
        )
      ) {
        setCanFlip(false);
        return;
      }
      
      // Leader can always flip
      if (selectedPlayerCard.name === "The Leader") {
        canFlip = true;
      } else if (selectedPlayerCard.down) {
        // Check if adjacent up card exists
        const index = selectedPlayerCard.index!;
        const adjacent = [
          [index[0] - 1, index[1]],
          [index[0], index[1] - 1],
          [index[0] + 1, index[1]],
          [index[0], index[1] + 1],
        ]
        
        canFlip = adjacent.some((adjacentIndex) => {
          // Check index is in bounds
          if (adjacentIndex[0] < 0 || adjacentIndex[1] < 1 || adjacentIndex[0] >= board.length || adjacentIndex[1] >= board[0].length) {
            return false;
          }

          // Check that there is an adjacent card
          const adjacentCard = board[adjacentIndex[0]][adjacentIndex[1]][0];
          if (adjacentCard && adjacentCard.type === CardType.PLAYER && !(adjacentCard as PlayerCard).down) {
            return true;
          } else {
            return false;
          }
        });

      } else {
        canFlip = true;
      }
    }
    
    setCanFlip(canFlip);
  }, [selected, board, phase]);


    return (
    <SharedContexts.Provider value={sharedContexts}>
      
      {winState === WinState.WIN ? 
        <GameEndPopup resetGame={resetGame} setWinState={setWinState} setPhase={setPhase} win={true}/>
      : winState === WinState.LOSS ?
        <GameEndPopup resetGame={resetGame} setWinState={setWinState} setPhase={setPhase} win={false}/>
      : null}
      
      <div className="flex flex-wrap h-full justify-start items-center">
        <Grid board={board} setBoard={setBoard}/>

        <div className="flex flex-col h-min self-start flex-grow justify-center items-center p-4 text-xl">
          <div className="w-44">
            <p className="text-balance text-center">Phase: {phaseToString(phase)}</p>

            <div className="mx-auto w-min">
              <button
                onClick={flipSelected}
                className={BUTTON_STYLE}
                disabled={!canFlip}
              >
                Flip Selected
              </button>

              <button
                onClick={nextPhase}
                className={BUTTON_STYLE}
              >
                Next Phase
              </button>
              
              <button
                onClick={undo}
                className={BUTTON_STYLE}
                disabled={history.current.length === 0}
              >
                Undo
              </button>
            </div>
          </div>

        </div>
      </div>

    </SharedContexts.Provider>
  );
}







function phaseToString(phase: Phase): string {
  switch (phase) {
    case Phase.GAME_START:
      return "Game Start";
    case Phase.ENCOUNTER:
      return "Encounter";
    case Phase.MANEUVER:
      return "Maneuver";
    case Phase.ATTACK:
      return "Attack";
    case Phase.COUNTER_ATTACK:
      return "Counter-Attack"
  }
}


export default App;
