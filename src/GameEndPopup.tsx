import React from "react";
import { BUTTON_STYLE, WinState } from "./App";
import { Phase } from "./Contexts";

interface GameEndPopupProps {
  resetGame: () => void,
  setWinState: (value: React.SetStateAction<WinState>) => void,
  setPhase: React.Dispatch<React.SetStateAction<Phase>>,
  win: boolean,
}


function GameEndPopup({resetGame, setWinState, setPhase, win}: GameEndPopupProps) {
    return (
      <div className="fixed z-20 w-full h-full">
        <div className="fixed bg-gray-900 w-full h-full opacity-50"></div>
        <div className={`fixed-center rounded-2xl z-10 opacity-100 p-10
          ${win ? "bg-green-700" : "bg-red-700"}
        `}>
          <h1 className="text-slate-200 font-bold text-5xl text-center">YOU {win ? "WIN" : "LOSE"}</h1>
          <div className="flex mt-10">
            <button
              onClick={resetGame}
              className={`${BUTTON_STYLE} text-xl ml-auto`}
            >
              New Game
            </button>
            <button
              onClick={() => {
                setWinState(WinState.LAST_TURN);
                setPhase(Phase.COUNTER_ATTACK);
              }}
              className={`${BUTTON_STYLE} text-xl ml-5 mr-auto`}
            >
              View Board
            </button>
          </div>
        </div>
      </div>
    )
}


export default GameEndPopup;