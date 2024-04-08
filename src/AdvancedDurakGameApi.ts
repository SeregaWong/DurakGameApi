import { DurakGame } from './DurakGame';
import { DurakGameApi } from './DurakGameApi';
import { DurakPlayerApi } from './DurakPlayerApi';
import { AdvancedLocalEventStore } from './EventStore';

export namespace AdvancedDurakGameApi {
  export interface IEventStore extends DurakGameApi.IEventStore {
    readonly currentIndex: number;
    toIndex(index: number): void;
    snapshot(): void;
  }
}

export class AdvancedDurakGameApi extends DurakGameApi {
  protected readonly store!: AdvancedDurakGameApi.IEventStore;

  private readonly INIT_EVENTS_AMOUNT = 3;  // [ init cards, deal cards, deal cards ]

  private actionIndexes: number[] = [];

  constructor(...args: ConstructorParameters<typeof DurakGameApi>) {
    super(...args);
    this.store.snapshot();
  }

  public update(player: DurakPlayerApi, action: DurakGame.Action) {
    super.update(player, action);
    const { currentIndex } = this.store;
    (this.actionIndexes = this.actionIndexes.filter((index) => index < currentIndex))
      .push(currentIndex);
    this.store.snapshot();
  }

  public toPreviousState() {
    const { currentIndex } = this.store;

    if (currentIndex < this.INIT_EVENTS_AMOUNT) {
      return;
    }

    const index = this.actionIndexes
      .sort((a, b) => b - a)
      .find((actionIndex) => actionIndex < currentIndex)
      || (currentIndex - 1);

    this.store.toIndex(index);

    this.onUpdate();
  }

  public toNextState() {
    const { currentIndex } = this.store;

    const index = this.actionIndexes
      .sort((a, b) => a - b)
      .find((actionIndex) => actionIndex > currentIndex);

    if (!index) {
      return;
    }

    this.store.toIndex(index);

    this.onUpdate();
  }

  protected createStore(...events: Event[]): AdvancedDurakGameApi.IEventStore {
    return new AdvancedLocalEventStore(...events);
  }
}
