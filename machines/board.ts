import {
  assign,
  setup,
  ActorRefFrom,
  AnyActor,
  log,
  raise,
  enqueueActions,
} from "xstate";
import { BoardGridT, Shape, shapesTypes, ShapeTypeT } from "../shapes";
import { getActiveShape, shapeMachine } from "./shape";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const initialShapeType = shapesTypes[0];
const initialShapesTypes = shapesTypes.slice(1);
const BOARD_GRID_ROWS = 20;
const BOARD_GRID_COLS = 10;

function createBoard(): BoardGridT {
  const board = [];
  for (let r = 0; r < BOARD_GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < BOARD_GRID_COLS; c++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
}

function canMoveDown(shape: Shape, board: BoardGridT) {
  return shape.every(([r, c]) => r < 19 && board[r + 1][c] === 0);
}

function getFullRowsCount(grid: BoardGridT) {
  return grid.filter((row) => row.every((cell) => cell === 1)).length;
}

interface BoardContextT {
  grid: BoardGridT;
  shapeRef: ActorRefFrom<typeof shapeMachine>;
  nextShape: ShapeTypeT;
  shapesBag: ShapeTypeT[];
  score: number;
}

function pullNextShape({
  context: { shapesBag },
}: {
  context: BoardContextT;
}): Partial<BoardContextT> {
  if (shapesBag.length === 1) {
    return {
      nextShape: shapesBag[0],
      shapesBag: [...shapesTypes],
    };
  } else {
    const randomIndex = Math.floor(Math.random() * shapesBag.length);
    const nextShape = shapesBag[randomIndex];
    return {
      nextShape,
      shapesBag: shapesBag.filter((type) => type !== nextShape),
    };
  }
}

export const boardMachine = setup({
  types: {} as {
    context: BoardContextT;
    events:
      | { type: "BTN.START" }
      | { type: "BTN.PAUSE" }
      | { type: "BTN.RESUME" }
      | { type: "BTN.RESET" }
      | { type: "BTN.SHAPE.LEFT.PRESSED" }
      | { type: "BTN.SHAPE.LEFT.RELEASED" }
      | { type: "BTN.SHAPE.RIGHT.PRESSED" }
      | { type: "BTN.SHAPE.RIGHT.RELEASED" }
      | { type: "BTN.SHAPE.DOWN.PRESSED" }
      | { type: "BTN.SHAPE.DOWN.RELEASED" }
      | { type: "SHAPE.DOWN.FINISHED" }
      | { type: "BTN.SHAPE.DROP" }
      | { type: "BTN.SHAPE.ROTATE" }
      | { type: "AUTO.NEW_SHAPE" }
      | { type: "AUTO.FINISH" };
  },
  actors: {
    shapeM: shapeMachine,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAFgBMAGhABPRAEYAzMpIAOAGwBOAOzrdqxeJ3qAvmdlosEEgEkBvLugA2+YiSoEAgmXrNhDm4+QWExBGUAVkUNBhNtcUjxOOVDXVkFBHUYyIY8hkjI3UldUtSLKwxscgBXAUcBKHdSAAVvAFUaRhYkECCnUN7w421JEk1JaMj1OO1IqMiMpQZjEgZi9VU53XFxZXEKkGtqsjqGpo6CAHkSADE7IjsqAAluwM4BoSGlcVHxycU01m80KSwQikkmkia2UigYBnUiKkyk0h2OtlO9S4jXsEBcYGanme3haFBIABkKLcCCQWpQqDQACJvXr9EJfUDhZSSNTGBgTTSAzS6SITMHGUXjUUqfbZSTaTQHSxHKoYs7YqC4-GEl4kslkOwAcWeNLp1CZLPYH3ZYUQ3N5yQFQpFYvkSiiMSFkkh-OMulRyvRtSxOLseIJhFIutJJEZVwA6q16RaAqzrfwOaJluk3QhIgqSI7JIlNFCeUrKjZg+ctRGPNH9VcfAQKJa+unBpyJKVC5oDEVVJtxKVNOL9mNAbD9soGB7pmjVdWNSQ8DUeDxBOSwAAzHgtTBwWCQHXEmOU6nkCiU7wpnpW4IZ20RHkkPlO0UumS5t+vwraPTJFoxYLlWmI1qu66CGQXBQAAFnuB6wEeuCRkSerkEaJqXtet7vA+nZZs+Dr8pCzqil+mQqHkUoTLsDCSNkUKRCBJzqjiEEbgIjKoAA7gI+6HseqENrGCakJQOEUMyqb3p8T6FCQ2jqAqkSQoO3J6Is355JoikkRKKylkpLFqiGmocYI3F8QJSGQCQ3g8egTiNFZAjkoIUCMmALjoHIOAiXGiZ3A8TzPFJbZso+3wRD2DHaOscL5rkkiKGC6i-GsGw7FIUKKCKJlLuxa6ca5NnIfZjnOZ5vFuR5Xk+X5EUdpm4TKTEJgMHMIyIoq6jink2i-hMcWFJoM6SAVYHLhZXE1WVdkOU5fAuTVVCwagmA8PVvn+aeZKBaQ9yPC84Uye2+EtYggqDakuSKBCujaIomxaZk+jQlCEzRIiKWQgGlasWZK7FZZc2IeVi1Va5a0bVt3k7U1F1Pm1vaddEvw9eIfW5loulFjyymjKWiiTWx5moJBAC2ADCqAuC4XDcIIzzoAIeIajglw3EQFDxgA+g2iNydF93wrEhiqf6ejPeI4rRJ68zKDM8rpflgaLi06A1MhhL0u0ACyrZnZFBHDL8YxfYCMy-CCr2IP6DDjBK4iAoopbesx6tVrc2KM7Bx4iLAPDoDwYAkOgu5gJgAAUuR5AAlDgQY+44sD+xAQs2tFqnioKuiFspqS6BCWhxLoFjKgIqAQHAwjonhwtdggAC0yRrHC+yGMTwr0XbLf-SqVYOE4rgN1nTfPfn6hTBMKI6J1FFKHCGg6I9kwmH28Ll17gPnGPUVN-nSkqWpSsaSKYK5Ooem0QNxYfqTQNhvi++m0o+gkNys5u4qKWIso4pdhqE0L6JWBgqKqEfuBEGbkdwIUEhAV+l08zaDUJMfQ9F5S-FdoAyQjseRzHmPoHkOwoHTRgdBOC8DbKILTEjaKIC0HTiJsOLGOZKKwnECQQwcw9hGUVKpMhRVIKzWsuDSASCnwJDBKYIaxYxqdX2KgoR5kYGlXEbYSGy1qp8Xci5eGmRZLj0IsYReWQ27cnlHkaYKVZwDyDFNYRJUwYIIqktDU0N1qbW2oY86jdCKCl0kpPY0xEQikmAAnGLs5FbEBHw7QKiVwUw3DTOmDMmYCBZmzBmjRJEizhLpR6OlFBzE7iUsE-oJzkVSOlYseVlAFU1trCRdD-HDChLyR6cx4SqFLJsCpOhXx6HAdPQo6wKyD2qCnP2LSjEHxMblEgkwZgrGLioHYo5vwlHwdkCECQQHqDwRNCuQA */
  id: "board",
  initial: "Initial",
  context: ({ spawn }) => ({
    grid: createBoard(),
    shapeRef: spawn("shapeM", {
      id: "shapeId",
      input: { type: initialShapeType },
    }),
    nextShape: initialShapeType,
    shapesBag: [...initialShapesTypes],
    score: 0,
  }),
  on: {
    "BTN.RESET": ".Initial",
  },
  states: {
    Initial: {
      on: {
        "BTN.START": {
          target: "Running",
          actions: [
            ({ context }) =>
              context.shapeRef.send({
                type: "RESET",
                shape: context.nextShape,
              }),
            assign(pullNextShape),
          ],
        },
      },
      entry: [
        assign({
          grid: () => createBoard(),
          nextShape: initialShapeType,
          shapesBag: () => [...initialShapesTypes],
        }),
      ],
    },
    Running: {
      initial: "Idle",
      states: {
        Idle: {
          on: {
            "BTN.SHAPE.LEFT.PRESSED": "ButtonLeftPressed",
            "BTN.SHAPE.RIGHT.PRESSED": "ButtonRightPressed",
            "BTN.SHAPE.DOWN.PRESSED": "ButtonDownPressed",
            "BTN.SHAPE.ROTATE": {
              actions: ({ context }) => {
                context.shapeRef.send({ type: "ROTATE", board: context.grid });
              },
            },
          },
        },
        ButtonLeftPressed: {
          on: {
            "BTN.SHAPE.LEFT.RELEASED": "Idle",
          },
          entry: ({ context }) => {
            context.shapeRef.send({ type: "LEFT", board: context.grid });
          },
        },
        ButtonRightPressed: {
          on: {
            "BTN.SHAPE.RIGHT.RELEASED": "Idle",
          },
          entry: ({ context }) => {
            context.shapeRef.send({ type: "RIGHT", board: context.grid });
          },
        },
        ButtonDownPressed: {
          initial: "AwaitingDownLongDelay",
          on: {
            "BTN.SHAPE.DOWN.RELEASED": "Idle",
          },
          states: {
            AwaitingDownLongDelay: {
              on: {
                "SHAPE.DOWN.FINISHED": {
                  target: "AwaitingDownShortDelay",
                },
              },
              entry: enqueueActions(({ context, enqueue, event }) => {
                const { type, position, rotation } =
                  context.shapeRef.getSnapshot().context;
                const shape = getActiveShape(type, rotation, position);
                if (canMoveDown(shape, context.grid)) {
                  enqueue(({ context }) => {
                    context.shapeRef.send({
                      type: "DOWN",
                      board: context.grid,
                    });
                  });
                  enqueue.raise(
                    { type: "SHAPE.DOWN.FINISHED" },
                    { delay: 500 }
                  );
                }
              }),
              always: {
                guard: ({ context }) => {
                  const { type, position, rotation } =
                    context.shapeRef.getSnapshot().context;
                  const shape = getActiveShape(type, rotation, position);
                  return !canMoveDown(shape, context.grid);
                },
                target: "#board.Running.BottomCollisionHandling",
              },
            },
            AwaitingDownShortDelay: {
              on: {
                "SHAPE.DOWN.FINISHED": {
                  target: "AwaitingDownShortDelay",
                  reenter: true,
                },
              },
              entry: enqueueActions(({ context, enqueue, event }) => {
                const { type, position, rotation } =
                  context.shapeRef.getSnapshot().context;
                const shape = getActiveShape(type, rotation, position);
                if (canMoveDown(shape, context.grid)) {
                  enqueue(({ context }) => {
                    context.shapeRef.send({
                      type: "DOWN",
                      board: context.grid,
                    });
                  });
                  enqueue.raise({ type: "SHAPE.DOWN.FINISHED" }, { delay: 50 });
                }
              }),
              always: {
                guard: ({ context }) => {
                  const { type, position, rotation } =
                    context.shapeRef.getSnapshot().context;
                  const shape = getActiveShape(type, rotation, position);
                  return !canMoveDown(shape, context.grid);
                },
                target: "#board.Running.BottomCollisionHandling",
              },
            },
          },
        },
        BottomCollisionHandling: {
          on: {
            "AUTO.NEW_SHAPE": "Idle",
          },
          entry: enqueueActions(({ enqueue, context }) => {
            // enqueue.raise("AUTO.FINISH");
            // Merging active shape with the board
            enqueue.assign({
              grid: ({ context }) => {
                let newGrid = context.grid.map((row) => [...row]);
                const { type, position, rotation } =
                  context.shapeRef.getSnapshot().context;
                const shape = getActiveShape(type, rotation, position);
                shape.forEach(([r, c]) => {
                  newGrid[r][c] = 1;
                });

                // Handle strike - remove filled rows and update score
                const strikedRows = getFullRowsCount(newGrid);
                if (strikedRows > 0) {
                  newGrid = newGrid.filter((row) =>
                    row.some((cell) => cell === 0)
                  );
                  while (newGrid.length < BOARD_GRID_ROWS) {
                    newGrid.unshift(new Array(10).fill(0));
                  }
                  // Update score
                }

                return newGrid;
              },
            });

            // Setting New Shape
            enqueue(({ context }) => {
              console.log("HandleCollision 2");
              context.shapeRef.send({
                type: "RESET",
                shape: context.nextShape,
              });
            });

            // Set Next Shape
            enqueue.assign(pullNextShape);

            enqueue.raise({ type: "AUTO.NEW_SHAPE" });
          }),
        },
      },
      on: {
        "BTN.PAUSE": {
          target: "Paused",
        },
        "AUTO.FINISH": "Finished",
      },
    },
    Paused: {
      on: {
        "BTN.RESUME": "Running",
      },
    },
    Finished: {
      type: "final",
      after: {
        5000: {
          target: "Initial",
          reenter: true,
        },
      },
    },
  },
});
