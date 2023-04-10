import { GameState } from "../GameState";
import { Event } from "../../Events/Event";

export interface IStateReducer {
  handle(state: GameState, event: Event): void;
}
