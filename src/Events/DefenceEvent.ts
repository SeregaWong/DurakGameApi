import { Card, PlayerIndex } from "../type";
import { Event } from "./Event";

export class DefenceEvent extends Event {
  constructor(
    public readonly playerIndex: PlayerIndex,
    public readonly card: Card,
    /**
     * @type int
     * @range [0, 5]
     */
    public readonly place: number,
  ) {
    super();
  }
}
