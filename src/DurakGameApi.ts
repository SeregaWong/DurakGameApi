import { DurakPlayerApi } from './DurakPlayerApi';
import {
  AttackEvent,
  BeatenOffEvent,
  DealCardsEvent,
  DefenceEvent,
  ReverseAttackEvent,
  TakeDoneEvent,
  TakeEvent,
  WinEvent,
  Event,
} from './Events';
import { LocalEventStore } from './LocalEventStore';
import { GameState } from './State/GameState';
import { shuffle } from './shuffle';
import { Card, CardSuit, CardValue, PlayerIndex } from './type';

export namespace DurakGame {

  export namespace Actions {

    export interface Attack {
      type: 'attack';
      card: Card;
    }

    export interface Done {
      type: 'done';
    }

    export interface Take {
      type: 'take';
    }

    export interface Defence {
      type: 'defence';
      card: Card;
      /**
       * @type int
       * @range [0, 5]
       */
      place: number;
    }

  }

  export type Action =
    Actions.Attack
    | Actions.Take
    | Actions.Defence
    | Actions.Done;

  export type ActionType = Action['type'];

  export type ActionByType<T extends ActionType> = Extract<Action, { type: T }>;

  export type ActionHandler<T extends ActionType = ActionType> =
    (
      game: DurakGame,
      player: DurakPlayerApi,
      action: ActionByType<T>,
    ) => void;

  export type WinHandler = (winner?: DurakPlayerApi) => void;

  export interface CommonGameState {
    table: GameState.Table;
    outGameCards: Card[];
    trumpCard: Card;
    deckCardsLeftAmount: number;
    wasTaken: boolean;
    action?: Action;
  }

  export interface PersonalGameState extends CommonGameState {
    myCards: Card[];
    enemyCardsAmount: number;
    isAttack: boolean;
  }

  export interface IGameState {
    readonly attackPlayer: PlayerIndex;
    readonly defencePlayer: PlayerIndex;
    readonly deck: Card[];
    readonly table: GameState.Table;
    readonly trumpCard: Card;
    readonly allTableCards: Card[];
    readonly defenceCardsAmount: number;
    getPlayerCards(playerIndex: PlayerIndex): readonly Card[];
    readonly wasTaken: boolean;
    getPersonalState(playerIndex: PlayerIndex): PersonalGameState;
  }

  export interface IEventStore {
    handle(event: Event): void;
    getState(): IGameState;
  }

}

export class DurakGame {

  private readonly store: DurakGame.IEventStore = new LocalEventStore(DurakGame.getCardsDeck());
  private readonly state = this.store.getState();

  private step = 0;

  private get maxAttackCardsAmountNow() {
    return this.step === 1 ? 5 : 6;
  }

  private get attackPlayer() {
    return this.getPlayer(true);
  }

  private get defencePlayer() {
    return this.getPlayer(false);
  }

  private getPlayer(isAttack: boolean) {
    const index = isAttack ? 0 : 1;
    if (this.state.attackPlayer === index) {
      return this.player1;
    } else {
      return this.player2;
    }
  }

  private static actionHandlersMap: {
    [P in DurakGame.ActionType]: DurakGame.ActionHandler<P>;
  } = {
      attack: (game, player, action) => game.attack(player, action),
      defence: (game, player, action) => game.defence(player, action),
      done: (game, player) => game.done(player),
      take: (game, player) => game.take(player),
    };

  private attack(player: DurakPlayerApi, action: DurakGame.Actions.Attack): void {
    const playerIndex = this.getPlayerIndex(player);
    const { state } = this;
    const { card } = action;

    if (playerIndex === state.attackPlayer) {
      const { state: { table: { attackCards } }, maxAttackCardsAmountNow } = this;

      if (attackCards.length > maxAttackCardsAmountNow) {
        throw new Error('limit attack');
      }

      if (!!attackCards.length) {
        const isSameValCardOnTable = state.allTableCards
          .some(({ val }) => card.val === val);

        if (!isSameValCardOnTable) {
          throw new Error('can only put card same by val');
        }
      }

      const isDefencePlayerHaveNoCards =
        (
          attackCards.length
          - state.defenceCardsAmount
          - state.getPlayerCards(state.defencePlayer).length
        ) === 0;

      if (isDefencePlayerHaveNoCards) {
        throw new Error('defence player have no cards');
      }

      this.store.handle(new AttackEvent(playerIndex, card));
    } else {
      const {state: { table: { attackCards } }} = this;

      if (!attackCards.length || !!state.defenceCardsAmount) {
        throw new Error('cannot transfer back that table');
      }
      if (card.val !== attackCards[0].val) {
        throw new Error('card must have same val');
      }

      const isAttackPlayerHaveNoCards =
        attackCards.length >= state.getPlayerCards(state.attackPlayer).length;

      if (isAttackPlayerHaveNoCards) {
        throw new Error('attack player have no cards');
      }

      this.store.handle(new ReverseAttackEvent(playerIndex, card));
    }
  }

  private defence(player: DurakPlayerApi, action: DurakGame.Actions.Defence): void {
    const { state } = this;
    const { card, place } = action;

    if (player === this.attackPlayer || state.wasTaken) {
      throw new Error('cannot defence');
    }
    const attackCard = state.table.attackCards[place];

    if (!attackCard || !!state.table.defenceCards[place]) {
      throw new Error('wrong place');
    }

    const trumpCardSuit = state.trumpCard.suit;

    if (card.suit !== trumpCardSuit || attackCard.suit === trumpCardSuit) {

      if (card.suit !== attackCard.suit) {
        throw new Error('cannot defence that card: wrong suit');
      }

      if (card.val < attackCard.val) {
        throw new Error('cannot defence that card: wrong val');
      }

    }

    this.store.handle(new DefenceEvent(this.getPlayerIndex(player), card, place));

    if (
      state.defenceCardsAmount === this.maxAttackCardsAmountNow
      ||
      !state.getPlayerCards(state.attackPlayer).length
      ||
      !state.getPlayerCards(state.defencePlayer).length
    ) {
      this.done(player);
    }
  }

  private done(player: DurakPlayerApi): void {
    const { state } = this;

    if (player !== this.attackPlayer) {

      if (
        !!state.getPlayerCards(state.attackPlayer).length
        &&
        !!state.getPlayerCards(state.defencePlayer).length
      ) {
        throw new Error('cannot done');
      }
    } else {

      if (!state.table.attackCards.length) {
        throw new Error('cannot done');
      }

    }

    if (state.table.attackCards.length !== state.defenceCardsAmount && !state.wasTaken) {
      throw new Error('cannot done');
    }

    this.toStep();
  }

  private take(player: DurakPlayerApi): void {
    if (player === this.attackPlayer || this.state.wasTaken) {
      throw new Error('cannot take');
    }

    this.store.handle(new TakeEvent());
  }

  constructor(
    private readonly player1: DurakPlayerApi,
    private readonly player2: DurakPlayerApi,
    private readonly onWin: DurakGame.WinHandler,
  ) {

    player1.setGame(this);
    player2.setGame(this);

    this.toStep();
    this.onUpdate();
  }

  public update(player: DurakPlayerApi, action: DurakGame.Action) {
    if (player !== this.player1 && player !== this.player2) {
      throw new Error('wrong player');
    }

    const actionHandler = DurakGame.actionHandlersMap[action.type] as DurakGame.ActionHandler; // fix ts

    actionHandler(this, player, action);

    this.onUpdate(action);
  }

  private toStep() {
    const { state, store } = this;
    this.step++;

    if (state.table.attackCards.length) {
      if (state.wasTaken) {
        store.handle(new TakeDoneEvent());
      } else {
        store.handle(new BeatenOffEvent());
      }
    }

    this.dealCards();

    if (!state.getPlayerCards(0).length) {
      if (!state.getPlayerCards(1).length) {
        this.onWin();
        store.handle(new WinEvent());
      } else {
        this.onWin(this.player1);
        store.handle(new WinEvent(0));
      }
    } else if (!state.getPlayerCards(1).length) {
      this.onWin(this.player2);
      store.handle(new WinEvent(1));
    }
  }

  private onUpdate(action?: DurakGame.Action) {
    const { state } = this;

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

  private dealCards() {
    this.dealCardsToPlayer(this.attackPlayer);
    this.dealCardsToPlayer(this.defencePlayer);
  }

  private dealCardsToPlayer(player: DurakPlayerApi) {
    const playerIndex = this.getPlayerIndex(player);
    const cards = this.state.getPlayerCards(playerIndex);
    const { deck } = this.state;

    const needAdd = 6 - cards.length;
    const canAdd = Math.min(needAdd, deck.length);

    if (canAdd < 1) { return; }

    this.store.handle(new DealCardsEvent(
      this.getPlayerIndex(player),
      canAdd,
    ));
  }

  private static getCardsDeck() {
    const deck: Card[] = [];

    for (let suit: CardSuit = 0; suit < 4; suit++) {
      for (let val: CardValue = 0; val < 6; val++) {
        deck.push({ suit, val });
      }
    }

    return shuffle(deck);
  }
}
