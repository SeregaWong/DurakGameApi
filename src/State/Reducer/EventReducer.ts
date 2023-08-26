import { Event } from "../../Events/Event";
import { GameState } from "../GameState";
import { IStateReducer } from "./IStateReducer";

export class EventReducer<T extends Event = Event> implements IStateReducer {
  constructor(
    readonly EventRef: new (...args: any[]) => T,
    readonly handleEvent: (state: GameState, event: T) => void,
  ) {}

  handle(state: GameState, event: Event): void {
    if (event instanceof this.EventRef) {
      this.handleEvent(state, event);
    }
  }
}
