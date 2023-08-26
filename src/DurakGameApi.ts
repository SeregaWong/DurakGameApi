import { DurakGame } from './DurakGame';
import { DurakPlayerApi } from './DurakPlayerApi';
import {
  Event, WinEvent,
} from './Events';
import { LocalEventStore } from './EventStore';
import { GameState } from './State/GameState';
import { Card, PlayerIndex } from './type';

export namespace DurakGameApi {

  export type WinHandler = (winner?: DurakPlayerApi) => void;

  export interface IEventStore {
    handle(event: Event): void;
    getState(): IState;
  }

  export interface IGameLogic {
    update(playerIndex: PlayerIndex, action: DurakGame.Action): void;
    start(): void;
  }

  export namespace IState {

    export interface Common {
      table: GameState.Table;
      outGameCards: Card[];
      trumpCard: Card;
      deckCardsLeftAmount: number;
      wasTaken: boolean;
      action?: DurakGame.Action;
    }

    export interface Personal extends Common {
      myCards: Card[];
      enemyCardsAmount: number;
      isAttack: boolean;
    }
  }

  export interface IState extends DurakGame.IState {
    getPersonalState(playerIndex: PlayerIndex): IState.Personal;
  }

  export type Action = DurakGame.Action;
}

export class DurakGameApi {

  protected readonly store: DurakGameApi.IEventStore = this.createStore();

  private readonly gameLogic: DurakGameApi.IGameLogic = this.createGameLogic();

  constructor(
    private readonly player1: DurakPlayerApi,
    private readonly player2: DurakPlayerApi,
    private readonly onWin: DurakGameApi.WinHandler,
  ) {

    player1.setGame(this);
    player2.setGame(this);

    this.start();
  }

  public update(player: DurakPlayerApi, action: DurakGame.Action) {
    if (player !== this.player1 && player !== this.player2) {
      throw new Error('wrong player');
    }

    this.gameLogic.update(this.getPlayerIndex(player), action);

    this.onUpdate(action);
  }

  protected createStore(): DurakGameApi.IEventStore {
    return new LocalEventStore();
  }

  protected createGameLogic(): DurakGameApi.IGameLogic {
    return new DurakGame(this.getInterfaceForGameLogic());
  }

  protected getInterfaceForGameLogic() {
    return {
      getState: () => this.getState(),
      emit: (event: Event) => this.emit(event),
    };
  }


  protected onUpdate(action?: DurakGame.Action) {
    const state = this.getState();

    this.player1.onUpdate({
      ...(state.getPersonalState(0)),
      action,
    });

    this.player2.onUpdate({
      ...(state.getPersonalState(1)),
      action,
    });
  }

  private start() {
    this.gameLogic.start();
    this.onUpdate();
  }

  private getState(): DurakGameApi.IState {
    return this.store.getState();
  }

  private emit(event: Event): void {
    if (event instanceof WinEvent) {
      const player = event.playerIndex === 0
        ? this.player1
        : event.playerIndex === 1
          ? this.player2
          : undefined;

      this.onWin(player);
    }

    this.store.handle(event);
  }

  private getPlayerIndex(player: DurakPlayerApi): PlayerIndex {
    if (player === this.player1) {
      return 0;
    }

    return 1;
  }
}
