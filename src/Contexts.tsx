import React from "react";

export enum Phase {
  GAME_START,
  ENCOUNTER,
  MANEUVER,
  ATTACK,
  COUNTER_ATTACK,
}

export const PhaseContext = React.createContext(Phase.GAME_START);
