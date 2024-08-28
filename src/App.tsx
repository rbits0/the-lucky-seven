import { useReducer } from "react";
import './App.css';
import Grid from './Grid';
import { GameContext } from "./Contexts";
import { Active } from "@dnd-kit/core";
import GameEndPopup from "./GameEndPopup";
import { createGame, GameActionType, gameReducer, Phase, WinState } from "./Game";


export const BUTTON_STYLE = "mt-4 h-min p-2 w-40 rounded-md bg-gray-400 hover:bg-gray-500 active:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-700";


function App() {
  const [gameState, gameDispatch] = useReducer(gameReducer, null, createGame);
  
  return (
    <GameContext.Provider value={[gameState, gameDispatch]}>
      {(gameState.winState === WinState.WIN) ? 
        <GameEndPopup win={true}/>
      : (gameState.winState === WinState.LOSS) ?
        <GameEndPopup win={false}/>
      : null}
      <div className="flex flex-wrap h-full justify-start items-center">
        <Grid/>

        <div className="flex flex-col h-min self-start flex-grow justify-center items-center p-4 text-xl">
          <div className="w-44">
            <p className="text-balance text-center">Phase: {phaseToString(gameState.phase)}</p>

            <div className="mx-auto w-min">
              <button
                onClick={() => gameDispatch({ type: GameActionType.FLIP_SELECTED })}
                className={BUTTON_STYLE}
                disabled={!gameState.canFlip}
              >
                Flip Selected
              </button>

              <button
                onClick={() => gameDispatch({ type: GameActionType.NEXT_PHASE })}
                className={BUTTON_STYLE}
              >
                Next Phase
              </button>
              
              <button
                onClick={() => gameDispatch({ type: GameActionType.UNDO })}
                className={BUTTON_STYLE}
                disabled={gameState.history === null || gameState.history.length === 0}
              >
                Undo
              </button>
            </div>
          </div>

        </div>
      </div>
    </GameContext.Provider>
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
