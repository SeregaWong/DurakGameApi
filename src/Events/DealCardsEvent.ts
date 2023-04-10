import { Card, PlayerIndex } from "../type";
import { Event } from "./Event";

export class DealCardsEvent extends Event {
  constructor(
    public readonly playerIndex: PlayerIndex,
    public readonly cardsAmount: number,
  ) {
    super();
  }
}
