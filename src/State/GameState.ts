import { DurakGame } from "../DurakGameApi";
import { Event } from "../Events/Event";
import { Card, PlayerIndex } from "../type";
import { gameStateReducer } from "./Reducer";

export namespace GameState {

  export interface Table {
    attackCards: Card[];
    defenceCards: Card[];
  }
}

/**
 * @description game state view
 */
export class GameState implements DurakGame.IGameState {
  public readonly trumpCard: Card;

  public constructor(
    public readonly deck: Card[],
  ) {
    this.trumpCard = deck[0];
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

  public getPersonalState(playerIndex: PlayerIndex): DurakGame.PersonalGameState {
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
}
