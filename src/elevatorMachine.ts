import {
  assign,
  createActor,
  enqueueActions,
  fromCallback,
  raise,
  sendTo,
  setup,
} from "xstate";

type Direction = "up" | "down";

export const elevatorMachine = setup({
  actions: {
    updateWeight: assign({
      currentWeight: ({ context }, params: { weight: number }) => {
        return context.currentWeight + params.weight;
      },
    }),
    addToSchedule: assign({
      schedule: ({ context }, params: { floor: number }) => {
        if (context.direction === "none")
          return context.schedule.concat(params.floor);
        if (context.direction === "up" && params.floor > context.height)
          return [params.floor].concat(context.schedule);
        if (context.direction === "up" && params.floor < context.height)
          return context.schedule.concat(params.floor);
        if (context.direction === "down" && params.floor < context.height)
          return [params.floor].concat(context.schedule);
        if (context.direction === "down" && params.floor > context.height)
          return context.schedule.concat(params.floor);
        return context.schedule;
      },
    }),
    removeFromSchedule: assign({
      schedule: ({ context }, params: { floor: number }) =>
        context.schedule.filter((floor) => floor !== params.floor),
    }),
  },
  actors: {
    intervalForElevatorMovement: fromCallback(({ sendBack }) => {
      setInterval(() => {
        sendBack({ type: "update height", height: 1 / 32 });
      }, 1000 / 32);
    }),
    timeoutForDoorsCloseAutomatically: fromCallback(({ sendBack, receive }) => {
      let timeout = setTimeout(() => {
        sendBack({ type: "doors close" });
      }, 3000);

      receive((event) => {
        if (event.type === "restart") {
          clearTimeout(timeout);

          timeout = setTimeout(() => {
            sendBack({ type: "doors close" });
          }, 3000);
        }
      });
      return () => {
        clearTimeout(timeout);
      };
    }),
  },
  guards: {},
  delays: {
    doorDelay: 1000,
  },
  types: {
    input: {} as {
      weightLimit: number;
      floors: number;
    },
    events: {} as
      | { type: "exit"; weight: number }
      | { type: "enter"; weight: number }
      | { type: "doors open" }
      | { type: "doors close" }
      | { type: "stop moving" }
      | { type: "doors closed" }
      | { type: "doors opened" }
      | { type: "update height"; height: number }
      | { type: "press button"; floor: number }
      | { type: "start moving"; floor: number }
      | { type: "manager instruction" }
      | { type: "check schedule" },
    context: {} as {
      direction: Direction | "none";
      floors: number;
      height: number;
      schedule: number[];
      currentWeight: number;
      buttonsPressed: unknown[];
      weightLimit: number;
    },
  },
}).createMachine({
  context: ({ input }) => ({
    direction: "none",
    floors: input.floors,
    height: 0,
    schedule: [],
    currentWeight: 0,
    buttonsPressed: [],
    weightLimit: input.weightLimit,
  }),
  id: "elevator",
  initial: "DoorsClosed",
  states: {
    DoorsClosed: {
      description: "The elevator is idle, waiting for an event to occur.",
      on: {
        "check schedule": {
          actions: enqueueActions(({ enqueue, context }) => {
            const { schedule, height } = context;
            if (schedule.length === 0) {
              enqueue.assign({ direction: "none" });
              return;
            }
            const nextFloor = schedule[0];
            enqueue.assign({
              direction: nextFloor > height ? "up" : "down",
            });
            enqueue.raise({ type: "start moving", floor: nextFloor });
          }),
        },
        "doors open": {
          target: "Doors Opening",
        },
        "start moving": {
          target: "Moving",
        },
      },
    },
    "Doors Opening": {
      description:
        "The elevator doors are opening after reaching the scheduled floor.",
      after: {
        doorDelay: {
          actions: raise({ type: "doors opened" }),
        },
      },
      on: {
        "doors opened": {
          target: "Doors Open",
        },
      },
    },
    Moving: {
      description: "The elevator is moving to the next scheduled floor.",
      invoke: {
        src: "intervalForElevatorMovement",
      },
      on: {
        "update height": {
          actions: [
            assign({
              height: ({ context, event }) =>
                context.height +
                event.height * (context.direction === "up" ? 1 : -1),
            }),
            enqueueActions(({ enqueue, context }) => {
              if (context.schedule.includes(context.height)) {
                enqueue.raise({ type: "stop moving" });
                enqueue.raise({ type: "doors open" });
              }
            }),
          ],
        },
        "stop moving": {
          actions: {
            params: ({ context }) => ({ floor: context.height }),
            type: "removeFromSchedule",
          },
          target: "DoorsClosed",
        },
      },
    },
    "Doors Open": {
      description:
        "The elevator doors are open, allowing passengers to enter or exit.",
      invoke: {
        input: {},
        src: "timeoutForDoorsCloseAutomatically",
        id: "automaticDoorsClose",
      },
      on: {
        enter: {
          guard: ({ context }) => context.currentWeight < context.weightLimit,
          actions: [
            {
              params: { weight: 1 },
              type: "updateWeight",
            },
            sendTo("automaticDoorsClose", { type: "restart" }),
          ],
        },
        "doors close": {
          target: "Doors Closing",
        },
        exit: {
          guard: ({ context }) => context.currentWeight > 0,
          actions: [
            {
              params: { weight: -1 },
              type: "updateWeight",
            },
            sendTo("automaticDoorsClose", { type: "restart" }),
          ],
        },
      },
    },
    "Doors Closing": {
      description:
        "The elevator doors are closing, preparing to move if there is a scheduled floor.",
      after: {
        doorDelay: {
          actions: raise({ type: "doors closed" }),
        },
      },
      on: {
        "doors closed": {
          actions: raise({ type: "check schedule" }),
          target: "DoorsClosed",
        },
      },
    },
  },
  on: {
    "press button": {
      guard: ({ context, event }) =>
        !context.schedule.includes(event.floor) &&
        event.floor !== context.height,
      actions: [
        {
          params: ({ event }) => ({ floor: event.floor }),
          type: "addToSchedule",
        },
        raise({ type: "check schedule" }),
      ],
    },
  },
});

export const elevatorActor = createActor(elevatorMachine, {
  input: {
    weightLimit: 8,
    floors: 6,
  },
}).start();
