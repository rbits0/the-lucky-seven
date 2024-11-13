import { Dispatch } from "react";
import './App.css';
import Grid from './Grid';
import { GameContext } from "./Contexts";
import GameEndPopup from "./GameEndPopup";
import { createGame, GameAction, GameActionType, gameReducer, GameState, Phase, WinState } from "./Game";
import { useImmerReducer } from "use-immer";


export const BUTTON_STYLE = "mt-4 h-min p-2 w-40 rounded-md bg-gray-400 hover:bg-gray-500 active:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-700";


function App() {
  const [gameState, gameDispatch]: [
    Readonly<GameState>, Dispatch<GameAction>
  ] = useImmerReducer(gameReducer, null, createGame);
  
  const roundsLeft = Math.floor(gameState.deck.length / 4) + 1;
  
  return (
    <GameContext.Provider value={[gameState, gameDispatch]}>
      {(gameState.winState === WinState.WIN) ? 
        <GameEndPopup win={true}/>
      : (gameState.winState === WinState.LOSS) ?
        <GameEndPopup win={false}/>
      : null}
      <div className="main">
        <Grid/>

        <div className="sidebar">
          <div className="w-44">
            {gameState.phase === Phase.GAME_START ? (
              <p>Card removed: {gameState.unluckyCard.name}</p>
            ) : null}
            <p className="text-balance text-center">Rounds left: {roundsLeft}</p>
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
