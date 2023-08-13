import { DurakPlayerApi } from './DurakPlayerApi';
import { AdvancedLocalEventStore } from './EventStore';
import { DurakGame } from './DurakGame';
import { DurakGameApi } from './DurakGameApi';

export namespace AdvancedDurakGameApi {
  export interface IEventStore extends DurakGameApi.IEventStore {
    readonly currentIndex: number;
    toIndex(index: number): void;
    snapshot(): void;
  }
}

export class AdvancedDurakGameApi extends DurakGameApi {
  protected readonly store!: AdvancedDurakGameApi.IEventStore;

  protected createStore(): DurakGameApi.IEventStore {
    return new AdvancedLocalEventStore();
  }

  private actionIndexes: number[] = [];

  public update(player: DurakPlayerApi, action: DurakGame.Action) {
    super.update(player, action);
    const { currentIndex } = this.store;
    (this.actionIndexes = this.actionIndexes.filter((index) => index > currentIndex))
      .push(currentIndex);
    this.store.snapshot();
  }

  public toPreviousState() {
    const { currentIndex } = this.store;

    if (currentIndex < 2) {
      // to init event
      return;
    }

    const index = this.actionIndexes
      .sort((a, b) => b - a)
      .find((index) => index < currentIndex)
      || (currentIndex - 1);

    this.store.toIndex(index);

    this.onUpdate();
  }

  public toNextState() {
    const { currentIndex } = this.store;

    const index = this.actionIndexes
      .sort((a, b) => a - b)
      .find((index) => index > currentIndex);
    
    if (!index) {
      return;
    }

    this.store.toIndex(index);

    this.onUpdate();
  }
}
