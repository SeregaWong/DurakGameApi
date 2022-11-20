import { DurakGame } from './DurakGameApi';
import { DeepReadonly } from './type';

export abstract class DurakPlayerApi {
  private game!: DurakGame;

  public setGame(game: DurakGame) {
    this.game = game;
  }

  abstract onUpdate(state: DeepReadonly<DurakGame.PersonalGameState>): void;

  public update(action: DurakGame.Action) {
    this.game.update(this, action);
  }
}
