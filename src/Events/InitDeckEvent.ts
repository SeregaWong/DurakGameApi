import { Card } from "../type";
import { Event } from "./Event";

export class InitDeckEvent extends Event {
  constructor (
    public readonly deck: Card[],
  ) {
    super();
  }
}
