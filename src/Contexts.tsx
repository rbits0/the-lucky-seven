import { createContext, Dispatch } from "react";
import { GameAction, GameState } from "./Game";

export const GameContext = createContext<
  [Readonly<GameState>, Dispatch<GameAction>] | undefined
>(undefined);