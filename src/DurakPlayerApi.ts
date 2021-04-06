import {DurakGame} from './DurakGameApi';
import {DeepReadonly} from './type';

export abstract class DurakPlayerApi {
    private game!: DurakGame;

    public setGame(game: DurakGame) {
        this.game = game;
    }

    public onUpdate(state: DeepReadonly<DurakGame.PersonalGameState>) {
    }

    public update(action: DurakGame.Action) {
        this.game.update(this, action);
    }
}
