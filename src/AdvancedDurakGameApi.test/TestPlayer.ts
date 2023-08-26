/* eslint-disable no-console */
import { DurakGameApi } from "../DurakGameApi";
import { DurakPlayerApi } from "../DurakPlayerApi";
import { DeepReadonly } from "../type";

export class TestPlayer extends DurakPlayerApi {

  constructor(public readonly name: string) {
    super();
  }

  onUpdate(state: DeepReadonly<DurakGameApi.IState.Personal>): void {
    console.log('player ' + this.name + ' state:', state);
  }
}
