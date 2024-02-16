import { useSelector } from "@xstate/react";
import { elevatorActor } from "./elevatorMachine";
import Floor from "./Floor";

const ElevatorButtonPanel = () => {
  const elevatorState = useSelector(elevatorActor, (state) => state);
  const { floors, schedule } = elevatorState.context;

  return (
    <div className="max-w-xl w-full mx-auto p-4 bg-gray-800 text-white">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(floors).fill(0)].map((_, floor) => (
          <button
            key={floor}
            className={`p-2 bg-gray-700 rounded-md focus:outline-none ${schedule.includes(floor) ? "ring-2 ring-red-500" : ""}`}
            onClick={() => elevatorActor.send({ type: "press button", floor })}
          >
            <Floor floor={floor} />
          </button>
        ))}
        <button
          className="col-span-3 p-2 bg-gray-700 rounded-md flex justify-center items-center focus:outline-none"
          onClick={() => elevatorActor.send({ type: "doors open" })}
        >
          Open
        </button>
        <button
          className="col-span-3 p-2 bg-gray-700 rounded-md flex justify-center items-center focus:outline-none"
          onClick={() => elevatorActor.send({ type: "doors close" })}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ElevatorButtonPanel;
