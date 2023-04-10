import { PlayerIndex } from "../type";
import { Event } from "./Event";

export class WinEvent extends Event {
  constructor (
    public readonly playerIndex?: PlayerIndex,
  ) {
    super();
  }
}
