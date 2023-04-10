import { GameState } from "./State/GameState";
import { Card } from "./type";
import { Event } from "./Events";
import { DurakGame } from "./DurakGameApi";

export namespace LocalEventStore {

  export interface IGameState {
    handle(event: Event): void;
    handle(events: Event[]): void;
  }
}

export class LocalEventStore implements DurakGame.IEventStore {

  private readonly state: LocalEventStore.IGameState & DurakGame.IGameState;

  private readonly events: Event[] = [];

  constructor(
    readonly deck: Card[],
    ...events: Event[]
  ) {
    this.state = new GameState(deck);

    events.forEach(event => {
      this.handle(event);
    });
  }

  getState() {
    return this.state;
  }

  handle(event: Event) {
    this.events.push(event);
    this.state.handle(event);
  }
}
