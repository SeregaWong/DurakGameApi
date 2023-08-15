import { DurakGame } from "../DurakGame";
import { CardSuit, CardValue } from "../type";

export class TestGameLogic extends DurakGame {
  getCardsDeck() {
    return [
      { val: CardValue._9, suit: CardSuit.clubs },
      { val: CardValue._9, suit: CardSuit.diamonds },
      { val: CardValue._10, suit: CardSuit.clubs },
      { val: CardValue._10, suit: CardSuit.diamonds },
      { val: CardValue.jack, suit: CardSuit.clubs },
      { val: CardValue.jack, suit: CardSuit.diamonds },
      { val: CardValue._9, suit: CardSuit.hearts },
      { val: CardValue._9, suit: CardSuit.spades },
      { val: CardValue._10, suit: CardSuit.hearts },
      { val: CardValue._10, suit: CardSuit.spades },
      { val: CardValue.jack, suit: CardSuit.hearts },
      { val: CardValue.jack, suit: CardSuit.spades },
      { val: CardValue.queen, suit: CardSuit.clubs },
      { val: CardValue.queen, suit: CardSuit.diamonds },
      { val: CardValue.queen, suit: CardSuit.hearts },
      { val: CardValue.queen, suit: CardSuit.spades },
      { val: CardValue.king, suit: CardSuit.clubs },
      { val: CardValue.king, suit: CardSuit.diamonds },
      { val: CardValue.king, suit: CardSuit.hearts },
      { val: CardValue.king, suit: CardSuit.spades },
      { val: CardValue.ace, suit: CardSuit.clubs },
      { val: CardValue.ace, suit: CardSuit.diamonds },
      { val: CardValue.ace, suit: CardSuit.hearts },
      { val: CardValue.ace, suit: CardSuit.spades },
    ].reverse();
  }
}
