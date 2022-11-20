
export enum CardSuit {
  clubs, //♣
  diamonds, //♦
  hearts, //♥️
  spades, //♠
}

export enum CardValue {
  _9,
  _10,
  jack,
  queen,
  king,
  ace,
}

export interface Card {
  readonly suit: CardSuit;
  readonly val: CardValue;
}

export type DeepReadonly<T> =
  T extends Array<infer R> ? DeepReadonlyArray<R> :
  T extends Function ? T :
  T extends object ? DeepReadonlyObject<T> :
  T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> { }

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
