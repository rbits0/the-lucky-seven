import React, { createContext } from "react";
import { GameAction, GameState } from "./Game";

export const GameContext = createContext<
  [GameState, React.Dispatch<GameAction>] | undefined
>(undefined);