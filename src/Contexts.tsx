import React from "react";

export enum Phase {
  GAME_START,
  ENCOUNTER,
  MANEUVER,
  ATTACK,
  COUNTER_ATTACK,
}

export const PhaseContext = React.createContext(Phase.GAME_START);

export const SelectedContext = React.createContext<string | null>(null);
export const SetSelectedContext = React.createContext<React.Dispatch<React.SetStateAction<string | null>> | undefined>(undefined);

export const SaveStateContext = React.createContext<(() => void) | undefined>(undefined);