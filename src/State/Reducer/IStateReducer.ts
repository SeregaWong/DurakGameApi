import { Event } from "../../Events/Event";
import { GameState } from "../GameState";

export interface IStateReducer {
  handle(state: GameState, event: Event): void;
}
