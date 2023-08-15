import { GameState } from "../GameState";
import { IStateReducer } from "./IStateReducer";
import { 
  AttackEvent,
  BeatenOffEvent,
  DealCardsEvent,
  DefenceEvent,
  Event,
  ReverseAttackEvent,
  TakeDoneEvent,
  TakeEvent,
  InitDeckEvent,
 } from "../../Events";
import { EventReducer } from "./EventReducer";

const attackReducer = new EventReducer(AttackEvent, (state, event) => {
  const { card } = event;

  state.table.attackCards.push(card);
  state.takeAwayCard(event.playerIndex, card);
});

const beatenOffReducer = new EventReducer(BeatenOffEvent, (state) => {
  state.reverseAttackPlayer();
  state.outGameCards.push(...state.allTableCards);
  state.clearTable();
});

const dealCardsReducer = new EventReducer(DealCardsEvent, (state, event) => {
  const { deck } = state;

  state.addPlayerCards(
    event.playerIndex,
    deck.splice(deck.length - event.cardsAmount),
  );
});

const defenceReducer = new EventReducer(DefenceEvent, (state, event) => {
  const { card } = event;

  state.takeAwayCard(event.playerIndex, card);
  state.table.defenceCards[event.place] = card;
});

const initDeckReducer = new EventReducer(InitDeckEvent, (state, event) => {
  state.setNewDeck(event.deck);
});

const reversAttackReducer = new EventReducer(ReverseAttackEvent, (state, event) => {
  const {card} = event;

  state.table.attackCards.push(card);
  state.takeAwayCard(event.playerIndex, card);
  state.reverseAttackPlayer();
});

const takeDoneReducer = new EventReducer(TakeDoneEvent, (state) => {
  state.wasTaken = false;
  state.addPlayerCards(state.defencePlayer, state.allTableCards);
  state.clearTable();
});

const takeReducer = new EventReducer(TakeEvent, (state) => {
  state.wasTaken = true;
});

class GameStateReducer implements IStateReducer {

  private readonly reducers: IStateReducer[] = [
    attackReducer,
    beatenOffReducer,
    dealCardsReducer,
    defenceReducer,
    initDeckReducer,
    reversAttackReducer,
    takeDoneReducer,
    takeReducer,
  ];

  handle(state: GameState, event: Event) {
    this.reducers.forEach(reducer => reducer.handle(state, event));
  }
}

export const gameStateReducer = new GameStateReducer();
