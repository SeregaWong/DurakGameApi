import { CardSuit, CardValue } from "../type";
import { AdvancedDurakGameTestApi } from "./AdvancedDurakGameTestApi";
import { TestPlayer } from "./TestPlayer";

const player1 = new TestPlayer('player1');
const player2 = new TestPlayer('player2');

const game = new AdvancedDurakGameTestApi(player1, player2, (winner) => {
  console.log(winner);
});

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
