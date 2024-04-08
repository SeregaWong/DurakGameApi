import { AdvancedDurakGameApi } from "../AdvancedDurakGameApi";
import { DurakGameApi } from "../DurakGameApi";
import { Event } from "../Events";
import { GameState } from "../State/GameState";

export namespace AdvancedLocalEventStore {

  export interface IState<Snapshot> extends DurakGameApi.IState {
    handle(event: Event): void;
    handle(events: Event[]): void;

    toSnapshot(): Snapshot;
  }

  export interface IStateClass<Snapshot> {
    new (): AdvancedLocalEventStore.IState<Snapshot>;
    fromSnapshot(snapshot: Snapshot): IState<Snapshot>;
  }
}

export class AdvancedLocalEventStore implements AdvancedDurakGameApi.IEventStore {

  private static readonly MAX_SNAPSHOTS_AMOUNT = 3;

  private static readonly State: AdvancedLocalEventStore.IStateClass<GameState.Snapshot> = GameState;

  public currentIndex: number = 0;

  private readonly events: Event[] = [];

  private snapshots: {
    index: number;
    snapshot: GameState.Snapshot;
  }[] = [];

  private state: AdvancedLocalEventStore.IState<GameState.Snapshot>;

  constructor(...events: Event[]) {
    this.state = this.createState();

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
    if (this.currentIndex != this.events.length - 1) {
      this.events.splice(this.currentIndex + 1);
    }

    this.state.handle(event);
    this.currentIndex = this.events.push(event) - 1;
  }

  toIndex(index: number) {
    if (index === this.currentIndex) {
      return;
    }

    if (index >= this.events.length) {
      throw new Error('not enough events');
    }

    const snapshot = this.getNearestSnapshot(index);

    let startHandle: number;

    if (snapshot) {
      this.state = AdvancedLocalEventStore.State.fromSnapshot(snapshot.snapshot);
      startHandle = snapshot.index + 1;

    } else if (index > this.currentIndex) {
      startHandle = this.currentIndex + 1;

    } else {
      this.state = this.createState();
      startHandle = 0;
    }

    this.state.handle(this.events.slice(startHandle, index + 1));

    this.currentIndex = index;
  }

  snapshot() {
    const { currentIndex } = this;

    const snapshots = this.snapshots = this.snapshots.filter(snapshot => {
      return snapshot.index < currentIndex;
    });

    snapshots.push({
      index: currentIndex,
      snapshot: this.state.toSnapshot(),
    });

    if (snapshots.length > AdvancedLocalEventStore.MAX_SNAPSHOTS_AMOUNT) {
      snapshots.shift();
    }
  }

  private createState() {
    return new AdvancedLocalEventStore.State();
  }

  private getNearestSnapshot(index: number) {
    const nearestIndex = this.snapshots
      .map(s => s.index)
      .sort((a, b) => b - a)
      .find(i => i <= index);

    if (!nearestIndex) {
      return;
    }

    return this.snapshots.find(s => s.index === nearestIndex);
  }
}
