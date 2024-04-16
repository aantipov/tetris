import { assign, setup, ActorRefFrom, enqueueActions } from "xstate";
import { BoardGridT, Shape, shapesTypes, ShapeTypeT } from "../shapes";
import { getActiveShape, shapeMachine } from "./shape";

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
  linesCleared: number;
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
      | { type: "BTN.SHAPE.DROP" }
      | { type: "BTN.SHAPE.ROTATE" }
      | { type: "SHAPE.DOWN.FINISHED" }
      | { type: "AUTO.NEW_SHAPE" }
      | { type: "DROP.STEP_COMPLETED" }
      | { type: "AUTO.FINISH" };
  },
  actors: {
    shapeM: shapeMachine,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAFgBMAGhABPRAEYAzMpIAOAGwBOAOzqArLsmb125YoC+l2WiwQSASQG8u6ADb5iJKgQCCZPTMwhzcfILCYgjKBooaDOK6KrraBjG6mrIKCOpxBgwFBboG2gm6Fta2GNjkAK4CLgJQXqQACn4AqjSMLEggoa4RfVGK4tqSJJqS+QkMinPlillKc+IkDMbqkuLKktra6qqVIHY1ZPWNzZ0EAPIkAGKORI5UABI9IZyDQsNKYxNTGbiOYLCzLBCKEwGdYWeaJZSaRLqXTHU4Oc4NLhNJwQdxgFo+V5+VoUEgAGQo9wIJFalCoNAAIh8+gNwj9QFFdmpRgwDMjETpFAZheDRgZNJNxQx9vpYlpUdV0RcsVAcXiCW9iaSyI4AOKvam06iM5nsL5syKILkkHl8jLiQXCgyimJxIWaRTjBFpTRpBX2OqY7GOXH4wikTUkkgMm4AdTadJNwRZ5v47NEK104JKEuBU0kQu0vsOKJsJ0VgcuarD3kj2pu-gIFFN-VTQw5El0uhIDuRKWUOz00pdUhtaXmDE0G2BsX9Z2V2LwtR4PEEZLAADMeK1MHBYJANUSoxSqeQKBS-EnemawmnLdFJNyZ-yHdohSL5H9J2OPYou3Lik0OclSDVUlxXQQyC4KAAAtt13WB91wcNCS1cg9QNM8LyvT5b3bDMHyfXkX0dD9shUApJSmeZVEkXk-TLNFKxVEhwNXAQGVQAB3AQdz3A8ULraM41IShsIoJlkxvb57zMOIHWlWIxnULREnBXJoVKKYGFyHR1HEAxJGA5jF2XdjOJ4vjEMgEg-C49BXCaCyBDJQQoAZMB3HQOQcCEmN4weJ4XleCSW1ZO9fmiLsSEkMwNnmEp8hkT8cjGdZNmBcpZlLKoAwxKs2MEZyrKQ2z7Mc9zuJctyPK8nywrbdMojknsp1SUYDlUrMUonbQf09QzEs9dRjPyljCo4qqSpsuyHL4JyqqoGDUEwHhau83yj1JfzSEeZ43lCqTWzwprEA9PrlF0MZjAycwpHUcFZSogtci0OZNGUUaFzAsyiqmhDStmirnKWla1s8jaGpO2S31axSOpUxFuuyLRc0nT0GDoiwnS+0DWNQCCAFsAGFUHcdwuG4QRXnQARcRVHBrjuIgKFjAB9OsoZkyLIWBG1EQYVQUj5KZwX2OItli-S9k0X8RsYitWnQWokIJOkOgAWWbI7wvwkZ-kmaYCmBeY-zBFKMgYSYxUHR9xGRAxjPuLFKZgg8RFgHh0B4MASHQLcwEwAAKGYGAAShwJjnZcWA3YgLmLUiwzRQ9bt7bugddjGHZrDLARUAgOBhDRXDuY7BAAFpMhSivNP2euG4bz6FYDZxXA8UvE-LxRkQ0WI+UUaitm0NSevmDQdBSaUpDhQfccuTuIvLh1sx0kgtOmAzVAFeUW-nPGQzxRe9aUfQSF2TG9GUZETAenrxB2SZ0d5P9YnGIC95Agrfpczd4P4iAx9ToIBKGoaYXZpiSGKHbUUUgraPlSHRHSUwPriHnuNH+UFYL-2soAlM0NIpTjAZnd0UD1C8mRkoCwaxyipGlFfNIBl0GmQgpNSyANIBAPvCPcEekfwFhMCoR8KlmE-VYcVDhDggbzUqjxVyTkIbZGkl3Aioxkooz5rsWKssVIlHMFYT+JkxHmX+gAsqc0VQg2WqtdaSjjplwIh6CUBwdh8hUtA5OKV9JunFEggs5goSiPxkTUm5NKZphpnTCmTQuE8wKBKUY+kH6+hiKUdRiAizqA0JIWKuhMbijSY7QxSsVacPwQ4kYKSbQpBSJoFIOxJzpIQLdG0ehkRSCmJdEwTsXaxzKcopeqjfRxHAfpDIxg5jTFFFA+BuQdICL5BsbQudLBAA */
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
    linesCleared: 0,
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
            "BTN.SHAPE.DROP": "Dropping",
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
                  enqueue.raise({ type: "SHAPE.DOWN.FINISHED" }, { delay: 25 });
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
        Dropping: {
          on: {
            "DROP.STEP_COMPLETED": {
              target: "#board.Running.Dropping",
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
              enqueue.raise({ type: "DROP.STEP_COMPLETED" }, { delay: 5 });
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
        BottomCollisionHandling: {
          on: {
            "AUTO.NEW_SHAPE": "Idle",
          },
          entry: enqueueActions(({ enqueue, context }) => {
            // enqueue.raise("AUTO.FINISH");
            // Merging active shape with the board
            enqueue.assign(({ context }) => {
              let newGrid = context.grid.map((row) => [...row]);
              const { type, position, rotation } =
                context.shapeRef.getSnapshot().context;
              const shape = getActiveShape(type, rotation, position);
              shape.forEach(([r, c]) => {
                newGrid[r][c] = 1;
              });

              // Handle strike - remove filled rows and update score
              const strikedRows = getFullRowsCount(newGrid);
              let newScore = context.score;
              if (strikedRows > 0) {
                newGrid = newGrid.filter((row) =>
                  row.some((cell) => cell === 0)
                );
                while (newGrid.length < BOARD_GRID_ROWS) {
                  newGrid.unshift(new Array(10).fill(0));
                }
                // Update score
                newScore +=
                  strikedRows > 1 ? strikedRows * 200 : strikedRows * 100;
              }

              return {
                grid: newGrid,
                score: newScore,
                linesCleared: context.linesCleared + strikedRows,
              };
            });

            // Setting New Shape
            enqueue(({ context }) => {
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
