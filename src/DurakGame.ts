import {
  AttackEvent,
  BeatenOffEvent,
  DealCardsEvent,
  DefenceEvent,
  InitDeckEvent,
  ReverseAttackEvent,
  TakeDoneEvent,
  TakeEvent,
  WinEvent,
  Event,
} from './Events';
import { shuffle } from './shuffle';
import { Card, CardSuit, CardValue, PlayerIndex } from './type';
import { GameState } from './State/GameState';

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
      playerIndex: PlayerIndex,
      action: ActionByType<T>,
    ) => void;

  export interface IState {
    readonly attackPlayer: PlayerIndex;
    readonly defencePlayer: PlayerIndex;
    readonly deck: Card[];
    readonly table: GameState.Table;
    readonly trumpCard: Card;
    readonly allTableCards: Card[];
    readonly defenceCardsAmount: number;
    getPlayerCards(playerIndex: PlayerIndex): readonly Card[];
    readonly wasTaken: boolean;
    readonly isStarted: boolean;
  }

  export interface IDurakGameApi {
    getState(): IState;
    emit(event: Event): void;
  }
}

export class DurakGame {

  private step = 0;

  private get maxAttackCardsAmountNow() {
    return this.step === 1 ? 5 : 6;
  }

  private static actionHandlersMap: {
    [P in DurakGame.ActionType]: DurakGame.ActionHandler<P>;
  } = {
      attack: (game, playerIndex, action) => game.attack(playerIndex, action),
      defence: (game, playerIndex, action) => game.defence(playerIndex, action),
      done: (game, playerIndex) => game.done(playerIndex),
      take: (game, playerIndex) => game.take(playerIndex),
    };

  private attack(playerIndex: PlayerIndex, action: DurakGame.Actions.Attack): void {
    const state = this.durakGameApi.getState();
    const { card } = action;

    if (playerIndex === state.attackPlayer) {
      const { table: { attackCards } } = state;

      if (attackCards.length > this.maxAttackCardsAmountNow) {
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

      this.durakGameApi.emit(new AttackEvent(playerIndex, card));
    } else {
      const { table: { attackCards } } = state;

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

      this.durakGameApi.emit(new ReverseAttackEvent(playerIndex, card));
    }
  }

  private defence(playerIndex: PlayerIndex, action: DurakGame.Actions.Defence): void {
    const state = this.durakGameApi.getState();
    const { card, place } = action;

    if (playerIndex === state.attackPlayer || state.wasTaken) {
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

    this.durakGameApi.emit(new DefenceEvent(playerIndex, card, place));

    if (
      state.defenceCardsAmount === this.maxAttackCardsAmountNow
      ||
      !state.getPlayerCards(state.attackPlayer).length
      ||
      !state.getPlayerCards(state.defencePlayer).length
    ) {
      this.done(playerIndex);
    }
  }

  private done(playerIndex: PlayerIndex): void {
    const state = this.durakGameApi.getState();

    if (playerIndex !== state.attackPlayer) {

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

  private take(playerIndex: PlayerIndex): void {
    const state = this.durakGameApi.getState();

    if (playerIndex === state.attackPlayer || state.wasTaken) {
      throw new Error('cannot take');
    }

    this.durakGameApi.emit(new TakeEvent());
  }

  constructor(
    private readonly durakGameApi: DurakGame.IDurakGameApi,
  ) {
  }

  public start() {
    const { durakGameApi } = this;
    const state = durakGameApi.getState();

    if (state.isStarted) {
      throw new Error('already started');
    }

    durakGameApi.emit(new InitDeckEvent(this.getCardsDeck()));

    this.toStep();
  }

  public update(playerIndex: PlayerIndex, action: DurakGame.Action) {
    const actionHandler = DurakGame.actionHandlersMap[action.type] as DurakGame.ActionHandler; // fix ts

    actionHandler(this, playerIndex, action);
  }

  private toStep() {
    const { durakGameApi } = this;
    const state = durakGameApi.getState();
    this.step++;

    if (state.table.attackCards.length) {
      if (state.wasTaken) {
        durakGameApi.emit(new TakeDoneEvent());
      } else {
        durakGameApi.emit(new BeatenOffEvent());
      }
    }

    this.dealCards();

    if (!state.getPlayerCards(0).length) {
      if (!state.getPlayerCards(1).length) {
        durakGameApi.emit(new WinEvent());
      } else {
        durakGameApi.emit(new WinEvent(0));
      }
    } else if (!state.getPlayerCards(1).length) {
      durakGameApi.emit(new WinEvent(1));
    }
  }

  private dealCards() {
    const { attackPlayer } = this.durakGameApi.getState();
    const defencePlayer = attackPlayer === 0 ? 1 : 0;

    this.dealCardsToPlayer(attackPlayer);
    this.dealCardsToPlayer(defencePlayer);
  }

  private dealCardsToPlayer(playerIndex: PlayerIndex) {
    const state = this.durakGameApi.getState();
    const cards = state.getPlayerCards(playerIndex);
    const { deck } = state;

    const needAdd = 6 - cards.length;
    const canAdd = Math.min(needAdd, deck.length);

    if (canAdd < 1) { return; }

    this.durakGameApi.emit(new DealCardsEvent(
      playerIndex,
      canAdd,
    ));
  }

  protected getCardsDeck() {
    const deck: Card[] = [];

    for (let suit: CardSuit = 0; suit < 4; suit++) {
      for (let val: CardValue = 0; val < 6; val++) {
        deck.push({ suit, val });
      }
    }

    return shuffle(deck);
  }
}
