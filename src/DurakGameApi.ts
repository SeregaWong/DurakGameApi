import { DurakPlayerApi } from './DurakPlayerApi';
import {
  Event, WinEvent,
} from './Events';
import { LocalEventStore } from './LocalEventStore';
import { Card, PlayerIndex } from './type';
import { DurakGame } from './DurakGame';
import { GameState } from './State/GameState';

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

  private readonly store: DurakGameApi.IEventStore = new LocalEventStore();

  private readonly gameLogic: DurakGameApi.IGameLogic = new DurakGame({
    getState: () => this.getState(),
    emit: (event) => this.emit(event),
  });

  constructor(
    private readonly player1: DurakPlayerApi,
    private readonly player2: DurakPlayerApi,
    private readonly onWin: DurakGameApi.WinHandler,
  ) {

    player1.setGame(this);
    player2.setGame(this);

    this.start();
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

  public update(player: DurakPlayerApi, action: DurakGame.Action) {
    if (player !== this.player1 && player !== this.player2) {
      throw new Error('wrong player');
    }

    this.gameLogic.update(this.getPlayerIndex(player), action);

    this.onUpdate(action);
  }

  private onUpdate(action?: DurakGame.Action) {
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

  private getPlayerIndex(player: DurakPlayerApi): PlayerIndex {
    if (player === this.player1) {
      return 0;
    } 
    return 1;
  }
}
