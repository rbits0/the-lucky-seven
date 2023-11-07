export enum CardType {
  Player,
  Enemy,
}


export interface CardData {
  id: string,
  name: string,
  type: CardType,
  strength: number,
  down?: boolean,
  position?: number,
  index?: [number, number]
}