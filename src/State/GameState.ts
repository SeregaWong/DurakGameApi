import { DurakGameApi } from "../DurakGameApi";
import { AdvancedLocalEventStore } from "../EventStore";
import { Event } from "../Events";
import { Card, PlayerIndex } from "../type";
import { gameStateReducer } from "./Reducer";

export namespace GameState {

  export interface Table {
    attackCards: Card[];
    defenceCards: Card[];
  }

  export interface Snapshot {
    _deck?: Card[];
    table: GameState.Table;
    attackPlayer: PlayerIndex;
    wasTaken: boolean;
    outGameCards: Card[];
    player1Cards: Card[];
    player2Cards: Card[];
  }
}

/**
 * @description game state view
 */
export class GameState implements DurakGameApi.IState, AdvancedLocalEventStore.IState<GameState.Snapshot> {
  private _trumpCard?: Card;

  public get trumpCard(): Card {
    const { _trumpCard } = this;

    if (!_trumpCard) {
      throw new Error('have no trumpCard');
    }

    return _trumpCard;
  }

  private _deck?: Card[];

  public get deck(): Card[] {
    const { _deck } = this;

    if (!_deck) {
      throw new Error('have no deck');
    }

    return _deck;
  }

  public set deck(v: Card[]) {
    this._deck = v;
    this._trumpCard = v[0];
  }

  public get isStarted() {
    return !!this._deck;
  }

  public table: GameState.Table = { attackCards: [], defenceCards: [] };
  public attackPlayer: PlayerIndex = 0;
  public wasTaken = false;
  public readonly outGameCards: Card[] = [];

  public get defencePlayer() {
    return this.attackPlayer === 0 ? 1 : 0;
  }

  public get defenceCardsAmount() {
    return this.table.defenceCards
      .reduce((amount, card) => !card ? amount : amount + 1, 0);
  }

  public get allTableCards() {
    const { table } = this;

    return [
      table.attackCards,
      table.defenceCards,
    ].flat();
  }

  private player1Cards: Card[] = [];
  private player2Cards: Card[] = [];

  public handle(event: Event): void;
  public handle(events: Event[]): void;
  public handle(events: Event | Event[]): void {
    if (Array.isArray(events)) {
      return events.forEach(e => this.handle(e));
    }

    const event = events;

    gameStateReducer.handle(this, event);
  }

  public takeAwayCard(playerIndex: PlayerIndex, card: Card) {
    const playerCards = this.getPlayerCards(playerIndex);

    const newCards = playerCards
      .filter(({ suit, val }) => !(card.suit === suit && card.val === val));

    if (newCards.length !== playerCards.length - 1) {
      throw new Error('have no card');
    }

    this.setPlayerCards(playerIndex, newCards);
  }

  public reverseAttackPlayer() {
    this.attackPlayer = this.defencePlayer;
  }

  public clearTable() {
    const { table } = this;

    table.attackCards = [];
    table.defenceCards = [];
  }

  public addPlayerCards(playerIndex: PlayerIndex, cards: Card[]) {
    this.getPlayerCards(playerIndex).push(...cards);
  }

  public getPersonalState(playerIndex: PlayerIndex): DurakGameApi.IState.Personal {
    const myCards = this.getPlayerCards(playerIndex);

    return {
      outGameCards: this.outGameCards,
      table: this.table,
      trumpCard: this.trumpCard,
      deckCardsLeftAmount: this.deck.length,
      wasTaken: this.wasTaken,
      myCards,
      enemyCardsAmount: myCards.length,
      isAttack: playerIndex === this.attackPlayer,
    };
  }

  public getPlayerCards(playerIndex: PlayerIndex) {
    if (playerIndex === 0) {
      return this.player1Cards;
    } else {
      return this.player2Cards;
    }
  }

  private setPlayerCards(playerIndex: PlayerIndex, cards: Card[]) {
    if (playerIndex === 0) {
      this.player1Cards = cards;
    } else {
      this.player2Cards = cards;
    }
  }

  toSnapshot() {
    return {
      _deck: this._deck,
      table: this.table,
      attackPlayer: this.attackPlayer,
      wasTaken: this.wasTaken,
      outGameCards: this.outGameCards,
      player1Cards: this.player1Cards,
      player2Cards: this.player2Cards,
    };
  }

  static fromSnapshot(snapshot: GameState.Snapshot) {
    const state = new GameState();

    state._deck = snapshot._deck;
    state.table = snapshot.table;
    state.attackPlayer = snapshot.attackPlayer;
    state.wasTaken = snapshot.wasTaken;
    state.outGameCards.push(...snapshot.outGameCards);
    state.player1Cards = snapshot.player1Cards;
    state.player2Cards = snapshot.player2Cards;

    return state;  
  }
}
