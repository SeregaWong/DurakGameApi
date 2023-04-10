import { Card, PlayerIndex } from "../type";
import { Event } from "./Event";

export class AttackEvent extends Event {
  constructor(
    public readonly playerIndex: PlayerIndex,
    public readonly card: Card,
  ) {
    super();
  }
}
