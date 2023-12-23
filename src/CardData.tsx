export enum CardType {
  Player,
  Enemy,
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
}


export interface AthleteCard extends PlayerCard {
  halfRotated: boolean,
}


export interface EnemyCard extends GenericCard {
  position: number,
  hitsDown: boolean,
  canOverlap: boolean,
  discardAfterRound: boolean
}

export type CardData = PlayerCard | EnemyCard;