import { GameState } from "../GameState";
import { Event } from "../../Events/Event";
import { IStateReducer } from "./IStateReducer";

class GameStateReducer implements IStateReducer {

  private readonly reducers: IStateReducer[] = [];

  handle(state: GameState, event: Event) {
    this.reducers.forEach(reducer => reducer.handle(state, event));
  }
}

export const gameStateReducer = new GameStateReducer();
