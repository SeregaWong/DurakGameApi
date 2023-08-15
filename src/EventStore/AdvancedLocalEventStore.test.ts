import { InitDeckEvent, DealCardsEvent, AttackEvent } from "../Events";
import { CardSuit, CardValue } from "../type";
import { AdvancedLocalEventStore } from "./AdvancedLocalEventStore";

const store = new AdvancedLocalEventStore();

store.handle(new InitDeckEvent([
  {val: CardValue._9, suit: CardSuit.clubs},
  {val: CardValue._9, suit: CardSuit.diamonds},
  {val: CardValue._10, suit: CardSuit.clubs},
  {val: CardValue._10, suit: CardSuit.diamonds},
  {val: CardValue.jack, suit: CardSuit.clubs},
  {val: CardValue.jack, suit: CardSuit.diamonds},
  {val: CardValue._9, suit: CardSuit.hearts},
  {val: CardValue._9, suit: CardSuit.spades},
  {val: CardValue._10, suit: CardSuit.hearts},
  {val: CardValue._10, suit: CardSuit.spades},
  {val: CardValue.jack, suit: CardSuit.hearts},
  {val: CardValue.jack, suit: CardSuit.spades},
  {val: CardValue.queen, suit: CardSuit.clubs},
  {val: CardValue.queen, suit: CardSuit.diamonds},
  {val: CardValue.queen, suit: CardSuit.hearts},
  {val: CardValue.queen, suit: CardSuit.spades},
  {val: CardValue.king, suit: CardSuit.clubs},
  {val: CardValue.king, suit: CardSuit.diamonds},
  {val: CardValue.king, suit: CardSuit.hearts},
  {val: CardValue.king, suit: CardSuit.spades},
  {val: CardValue.ace, suit: CardSuit.clubs},
  {val: CardValue.ace, suit: CardSuit.diamonds},
  {val: CardValue.ace, suit: CardSuit.hearts},
  {val: CardValue.ace, suit: CardSuit.spades},
].reverse()));

store.handle(new DealCardsEvent(0, 6));
store.handle(new DealCardsEvent(1, 6));

store.snapshot();

store.handle(new AttackEvent(0, {val: CardValue._9, suit: CardSuit.clubs}));
store.snapshot();

store.handle(new AttackEvent(0, {val: CardValue._9, suit: CardSuit.diamonds}));
store.snapshot();

store.toIndex(store.currentIndex - 1);
store.snapshot();
debugger;

store.toIndex(store.currentIndex - 1);
store.snapshot();
debugger;

store.getState();
debugger;

store.currentIndex;