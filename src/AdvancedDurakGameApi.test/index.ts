/* eslint-disable no-console */
import { CardSuit, CardValue } from "../type";
import { AdvancedDurakGameTestApi } from "./AdvancedDurakGameTestApi";
import { TestPlayer } from "./TestPlayer";

const player1 = new TestPlayer('player1');
const player2 = new TestPlayer('player2');

const game = new AdvancedDurakGameTestApi(player1, player2, (winner) => {
  console.log(winner);
});

class Test {
  static runTest1() {
    player1.update({
      type: 'attack',
      card: {val: CardValue._9, suit: CardSuit.clubs},
    });
    player1.update({
      type: 'attack',
      card: {val: CardValue._9, suit: CardSuit.diamonds},
    });

    game.toPreviousState();
    game.toPreviousState();

    game.toNextState();

    player2.update({
      type: 'defence',
      card: {val: CardValue._9, suit: CardSuit.spades},
      place: 0,
    });

    game.toPreviousState();
    game.toNextState();
  }

  static runTest2() {
    player1.update({
      type: 'attack',
      card: {val: CardValue._9, suit: CardSuit.clubs},
    });
    player2.update({
      type: 'attack',
      card: {val: CardValue._9, suit: CardSuit.hearts},
    });
    player1.update({
      type: 'attack',
      card: {val: CardValue._9, suit: CardSuit.diamonds},
    });

    game.toPreviousState();
    game.toPreviousState();
    game.toPreviousState();

    game.toNextState();
    game.toNextState();
    game.toNextState();

    player2.update({
      type: 'defence',
      card: {val: CardValue._9, suit: CardSuit.spades},
      place: 0,
    });

    game.toPreviousState();
    game.toNextState();
  }
}

Test.runTest2();
