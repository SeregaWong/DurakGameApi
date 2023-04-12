import { DurakGameApi } from './DurakGameApi';
import { DeepReadonly } from './type';

export abstract class DurakPlayerApi {
  private game!: DurakGameApi;

  public setGame(game: DurakGameApi) {
    this.game = game;
  }

  abstract onUpdate(state: DeepReadonly<DurakGameApi.IState.Personal>): void;

  public update(action: DurakGameApi.Action) {
    this.game.update(this, action);
  }
}
