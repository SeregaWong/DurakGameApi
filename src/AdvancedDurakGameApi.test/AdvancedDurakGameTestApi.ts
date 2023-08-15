import { AdvancedDurakGameApi } from "../AdvancedDurakGameApi";
import { TestGameLogic } from "./TestGameLogic";

export class AdvancedDurakGameTestApi extends AdvancedDurakGameApi {
  createGameLogic() {
    return new TestGameLogic(this.getInterfaceForGameLogic());
  }
}
