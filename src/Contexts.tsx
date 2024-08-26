import React, { createContext } from "react";
import { GameAction, GameState } from "./Game";

export enum Phase {
  GAME_START,
  ENCOUNTER,
  MANEUVER,
  ATTACK,
  COUNTER_ATTACK,
}


export interface Contexts {
  phase: Phase,
  selected: string | null,
  setSelected: React.Dispatch<React.SetStateAction<string | null>>,
  addStateToHistory: () => void,
}


// export const SharedContexts = createContext<Contexts | undefined>(undefined);


export const GameContext = createContext<
  [GameState, React.Dispatch<GameAction>] | undefined
>(undefined);