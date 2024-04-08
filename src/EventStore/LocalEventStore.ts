import { DurakGameApi } from "../DurakGameApi";
import { Event } from "../Events";
import { GameState } from "../State/GameState";

export namespace LocalEventStore {

  export interface IState extends DurakGameApi.IState {
    handle(event: Event): void;
    handle(events: Event[]): void;
  }
}

export class LocalEventStore implements DurakGameApi.IEventStore {

  private readonly state: LocalEventStore.IState;

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

  getEvents() {
    return this.events;
  }

  handle(event: Event) {
    this.events.push(event);
    this.state.handle(event);
  }
}
