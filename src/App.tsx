import "./App.css";
import { useSelector } from "@xstate/react";
import { elevatorActor } from "./elevatorMachine";
import ElevatorDoor from "./ElevatorDoor";
import ElevatorButtonPanel from "./ElevatorPanel";
import Floor from "./Floor";

function App() {
  const elevatorState = useSelector(elevatorActor, (state) => state);
  const { currentWeight, height, floors } = elevatorState.context;

  return (
    <div className="flex gap-64">
      <div className="gap-4 flex flex-col">
        <div className="overflow-hidden flex h-16 w-24 mx-auto bg-gray-900 rounded-xl text-2xl text-red-700 relative">
          <ul
            className="flex relative"
            style={{ width: 96 * floors, left: -height * 96 }}
          >
            {[...Array(floors).fill(0)].map((_, floor) => (
              <div className="w-24 flex items-center justify-center">
                <Floor floor={floor} />
              </div>
            ))}
          </ul>
        </div>
        <ElevatorDoor
          weight={currentWeight}
          isOpen={
            elevatorState.matches("Doors Open") ||
            elevatorState.matches("Doors Opening")
          }
        />
        <ElevatorButtonPanel />
      </div>
      <div className="flex">
        <div className="flex flex-col justify-end">
          <div
            className="bg-gray-500 h-32 w-24 relative"
            style={{ bottom: `${height * 128}px` }}
          />
        </div>
        <div className="divide-gray-900 divide-y">
          {[...Array(floors).fill(0)].map((_, floor) => (
            <div className="h-32 w-64 bg-red-900 p-4 text-xl flex items-center">
              <Floor floor={floors - floor - 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
