export enum CardType {
  PLAYER,
  ENEMY,
}


export interface GenericCard {
  id: string,
  name: string,
  type: CardType,
  strength: number,
  index?: [number, number]
}


export interface PlayerCard extends GenericCard {
  down: boolean,
  rotated: boolean,
  // Strength when attacking enemies (different than strength for hammer and anvil)
  effectiveStrength: number,
}


export interface AthleteCard extends PlayerCard {
  halfRotated: boolean,
}


export interface EnemyCard extends GenericCard {
  position: number,
  hitsDown: boolean,
  canOverlap: boolean,
  discardAfterRound: boolean,
  health: number,
}

export type CardData = PlayerCard | EnemyCard;