import { Event } from "../Events/Event";
import { gameStateReducer } from "./Reducer";

/**
 * @description game state view
 */
export class GameState {

  public handle(event: Event): void;
  public handle(events: Event[]): void;
  public handle(events: Event | Event[]): void {
    if (Array.isArray(events)) {
      return events.forEach(e => this.handle(e));
    }

    const event = events;

    gameStateReducer.handle(this, event);
  }
}
