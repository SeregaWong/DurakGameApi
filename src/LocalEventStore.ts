import { GameState } from "./State/GameState";
import { Event } from "./Events";
import { DurakGameApi } from "./DurakGameApi";

export namespace LocalEventStore {

  export interface IState {
    handle(event: Event): void;
    handle(events: Event[]): void;
  }
}

export class LocalEventStore implements DurakGameApi.IEventStore {

  private readonly state: LocalEventStore.IState & DurakGameApi.IState;

  private readonly events: Event[] = [];

  constructor(...events: Event[]) {
    this.state = new GameState();

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
