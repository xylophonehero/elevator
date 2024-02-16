interface Props {
  isOpen: boolean;
  weight: number;
}

const ElevatorDoor = ({ isOpen, weight }: Props) => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative w-64 h-80 bg-gray-800 flex items-center justify-center">
        <div className="text-purple-400 text-4xl">{weight}</div>
        <div
          className={`absolute top-0 bottom-0 left-0 w-1/2 bg-gray-500 transition-transform duration-1000 ${isOpen ? "-translate-x-full" : "translate-x-0"}`}
        ></div>
        <div
          className={`absolute top-0 right-0 bottom-0 w-1/2 bg-gray-500 transition-transform duration-1000 ${isOpen ? "translate-x-full" : "translate-x-0"}`}
        ></div>
      </div>
    </div>
  );
};

export default ElevatorDoor;
