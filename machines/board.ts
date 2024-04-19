import {
  assign,
  setup,
  ActorRefFrom,
  enqueueActions,
  raise,
  cancel,
} from "xstate";
import { shapesTypes, type BoardGridT, type ShapeTypeT } from "../shapes";
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

function canMoveDown(context: BoardContextT) {
  const { type, position, rotation } = context.shapeRef.getSnapshot().context;
  const shape = getActiveShape(type, rotation, position);
  return shape.every(([r, c]) => r < 19 && context.grid[r + 1][c] === 0);
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
      | { type: "BTN.LEFT.PRESSED" }
      | { type: "BTN.LEFT.LONG_PRESSED" }
      | { type: "BTN.LEFT.PRESSED" }
      | { type: "BTN.LEFT.RELEASED" }
      | { type: "BTN.RIGHT.PRESSED" }
      | { type: "BTN.RIGHT.LONG_PRESSED" }
      | { type: "BTN.RIGHT.RELEASED" }
      | { type: "BTN.DOWN.PRESSED" }
      | { type: "BTN.DOWN.RELEASED" }
      | { type: "BTN.DROP" }
      | { type: "BTN.ROTATE" }
      | { type: "SHAPE.DOWN.FINISHED" }
      | { type: "MOVE.SHAPE.LEFT" }
      | { type: "MOVE.SHAPE.RIGHT" }
      | { type: "MOVE_SHAPE_DOWN" }
      | { type: "SET_NEW_SHAPE" }
      | { type: "NEW_SHAPE_SET" }
      | { type: "HANDLE_COLLISION" }
      | { type: "DROP.STEP_COMPLETED" }
      | { type: "AUTO_DOWN" }
      | { type: "FINISHED" };
  },
  actors: {
    shapeM: shapeMachine,
  },
  guards: {
    cantMoveDown: ({ context }) => !canMoveDown(context),
  },
  actions: {
    rethrowAutoDown: raise(
      { type: "AUTO_DOWN" },
      { delay: 1000, id: "autoDown" }
    ),
    moveLeft: ({ context }) => {
      context.shapeRef.send({ type: "LEFT", board: context.grid });
    },
    moveRight: ({ context }) => {
      context.shapeRef.send({ type: "RIGHT", board: context.grid });
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMkkgBYAzADYAHAEYA7AE5Jy+coCsihsoA0IAJ6JVkhgxKLrm1cs0N9DWZuUBfb2bRYECQAkgK8XOgANvjEJFQEAIJk9MzCHNx8gsJiCPLS9i4ebl6assZmlgjWziTqqvL6qvqS+rKS8tq+-hjY5ACuAmECUDGkAAoJAKo0jCxIIOnhWfM5qpqa8nLKsrLN1i4tihWIuopyTuo2ZUqyPn4gAb1kA0MjUwQA8gD6ACIfAOpEWZpThLIQrKyaFQkAyGTR1WTqW4eY5VfTydQkJSKXZ6BjteQMTRdB49ILPQZcYYkACyYB46GCEEiYBwAAkEkQfgAZChfADCH253OCVGCHyBqXmi0y4NAq30SJINgYeSUcKa8lRqn29gUsjWUMkik0hhJj3JLypUFp9MZzNZ72+f0BwOloNl2UQ6jcysVpraCic8i1FisRLsHlcRVcnnNZP6lOpdIZTJZIQdoxIvIAYgRsxKAOJfMaUKg0H5u9ge-hy0Tewz2FWyRQ2RTqZSXbW3M5rYw6FsMdQh4n3C2J1621MOjMsrNkYKFtn57lFktlitVhY15byqwGs6q9RaY11HFNbvqQ-NbSSeHKIe3eOBCfWqf29Np1mEUg-MgfMYtxlWsvSqJo7FuJETVVBx21DSodRqeR9m2RooSaZ8nitZM7S-Wdv1iXN81LahNylasMhAiEEChWRamsHE1HqVtJFkbVmk2BhFEUbF9E7Y8h0wy0kxtFMPzAfD50XZcSBI8sKErcjt0o3d6yqY1NkMRU6h9B9LlUdj2hILieO4vjjx9dQhNfHDp0-TMf3ID5EgICggJ3OtVh0GR1mcfQ+O4xjtTyM5WM7AweMMbZrIpScxLwr8sxdcYNwU9yVM8k5GmM9xVFsdomjWNiwyqMoZDaLjVTcSzFH0GLsNE3CZzwPoeB4QRuTAAAzHgxkwOBYEgLMiPICheQSMi5gosFQK8TiuJbDt5E8WrJG1HFD0kOoimUU47m6F9YrfeLmta9qBE6nq+oGoaaQ+AA1Cg4g5MYnqI9KZuooxNmYiMNAUIlNG1Yc7CMA0GHqXR9ChRR6pE988JatrBDILgoAAC16-rYEG3BHIXJd80ocbJpBDLQOsViSFadEtq8Y0AvWltjK2vKyl2pR9tJQ6GoR07kYEVGMaxm7cDux7noSV7yGklIpuUz69yqWqzhxSRHAHE122Bwl7CKZbbCMZwufHI7qSR86flQAB3ARrpxobHOS0aSbSpTgNUnIXE0WpasNoljyMfRUQE6mNFUW49GsRVVDhycLcEK3bft3GcHFvkqBevlko+z1qPqX0FC0NpWwcOpUXbOxlFbA07122nZDjt8E4EJO7ex1Pc6opXmJkSvtk7HUtaBkrlBac5SlUVtjB4jwm+pH5MFQNg2GtHA-wAuJXLGAUPhpMZeVcxT5Y9zKaOhOplp2dwDmHVFtDo6uGlKPi8gUeebUX5fV+GHAu89qwYU5CIi4jqdWKgx73y2iQHUDRWyEmgnGMcCYzY2jwKgZGABbfkqBIiRC4NwQQbJ0ACGZGvGgBAvhEAoP8L4mcpZuXdh5Cm7ZVDUwZqUJw6tdCmFHrYZUlxOwQ22BcE2KDeboKwTgvBBDazENIfg3+1DaH0NenQ2g-8z4R2ZtXJoiInC1X8vBcMqoYSGGHEHZaKhYbIJ5vDSR7VsG4PwYQgQ8iyG-xzMEIgoo2RuxPsw-OAZaiEnUOiLi8JnDGPPj7KqU8nAtnRFeayYx0B9FTvjagkwaSMICeTIJ1cYReBvjiMJNMK6ImVM4fKKgoS6EbrY3oqT0lDSdL8AEko8mKzUtICGWJhzmK0G4KewcSrnhgWoDoYTWxT3fo0oIOYqQEPRo7WIZYNFMPyUraQBoYHNHqfUDQOJioIWKSQbQnZ4FwIitZRZYRYArNwCIWADIeASXQD1MAmAAAU7hbAAEocDjjucsyAmjQLtAcCzcxOIiR5TWiVGweg9ZXl2LceuXhfD3AEKgCAcBhAWjJt0nI4gfRyE5hoC5ehDAGRKp4fQMIWIGGQnUNQVl5khDCHwKIRK84908DAgZiJq46HhKabU3CYHRkRA0HZpQP68u7mpdwmJfquH+oSLwRwSqvyxCxVl0g7ytg-nzFkiqAEIH8gytVEMkSapHghIqypbjaA7GPZaJqTr2TNe6LZakh6YiDDC9ozRuxKFqI0H0BoOhT0kJ6pq6YW6XRFg7CA5qz4PjotIcOhgeIhlbOtdW1MVBrFLsYK18a7ISRbkLTGKdIDpopi2NhKg+LZsuCGNw60iTsLqFcHZHY40ctQSQFubd61pt9cSqwQ9qbomriZfE1gQ6thgSaK17QDhTxNV-Fe1pG350htTY87RTRjy4Qiyo6wzi7DvKqM9XguImocagJxMjXHuMUVAA9-LtDnOWh0DYKgDTaFRC4UK+kDFGraPIFJaTcY-p6dYOiDROyNDBpcFsIddnVw7BDBwqp2hDoOr0EFDyG1Tr5Uh5acg2YKBUD6DQErw0aA7QaJECS6pYqAA */
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
          actions: enqueueActions(({ context, enqueue }) => {
            context.shapeRef.send({
              type: "RESET",
              shape: context.nextShape,
            });
            enqueue.assign(pullNextShape);
            enqueue.cancel("autoDown"); // cleanup from prev games
            enqueue.raise(
              { type: "AUTO_DOWN" },
              { delay: 1000, id: "autoDown" }
            );
          }),
        },
      },
      entry: [
        assign({
          grid: () => createBoard(),
          nextShape: initialShapeType,
          shapesBag: () => [...initialShapesTypes],
          score: 0,
          linesCleared: 0,
        }),
      ],
    },

    Running: {
      initial: "MetaIdle",
      on: {
        // TODO: Do not interrupt Collision Hanlding process with Pausing
        "BTN.PAUSE": "Paused",
        AUTO_DOWN: {
          actions: ["rethrowAutoDown"],
        },
      },
      states: {
        MetaIdle: {
          initial: "Idle",
          description:
            "Either no buttons actively pressed, or left/right pressed",
          on: {
            HANDLE_COLLISION: {
              target: "#board.Running.BottomCollisionHandling",
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({
                    type: "DOWN",
                    board: context.grid,
                  });
                } else {
                  // Delay collision handling to allow the shape to move left/right
                  enqueue.raise({ type: "HANDLE_COLLISION" });
                }
                enqueue("rethrowAutoDown");
              }),
            },
          },
          states: {
            Idle: {
              on: {
                "BTN.LEFT.LONG_PRESSED": "ButtonLeftPressed",
                "BTN.RIGHT.LONG_PRESSED": "ButtonRightPressed",
                "BTN.DROP": "#board.Running.Dropping",
                "BTN.LEFT.PRESSED": {
                  actions: ["moveLeft"],
                },
                "BTN.RIGHT.PRESSED": {
                  actions: ["moveRight"],
                },
                "BTN.ROTATE": {
                  actions: ({ context }) => {
                    context.shapeRef.send({
                      type: "ROTATE",
                      board: context.grid,
                    });
                  },
                },

                "BTN.DOWN.PRESSED": {
                  target: "#board.Running.ButtonDownPressed",
                },
              },
            },
            ButtonLeftPressed: {
              on: {
                "BTN.LEFT.RELEASED": "Idle",
                "MOVE.SHAPE.LEFT": {
                  actions: [
                    "moveLeft",
                    raise(
                      { type: "MOVE.SHAPE.LEFT" },
                      { delay: 50, id: "moveShapeLeft" }
                    ),
                  ],
                },
              },
              entry: raise(
                { type: "MOVE.SHAPE.LEFT" },
                { id: "moveShapeLeft" }
              ),
              exit: cancel("moveShapeLeft"),
            },
            ButtonRightPressed: {
              on: {
                "BTN.RIGHT.RELEASED": "Idle",
                "MOVE.SHAPE.RIGHT": {
                  actions: [
                    "moveRight",
                    raise(
                      { type: "MOVE.SHAPE.RIGHT" },
                      { delay: 50, id: "moveShapeRight" }
                    ),
                  ],
                },
              },
              entry: raise(
                { type: "MOVE.SHAPE.RIGHT" },
                { id: "moveShapeRight" }
              ),
              exit: cancel("moveShapeRight"),
            },
          },
        },

        ButtonDownPressed: {
          on: {
            "BTN.DOWN.RELEASED": "#board.Running.MetaIdle",
            MOVE_SHAPE_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                context.shapeRef.send({ type: "DOWN", board: context.grid });
                enqueue.raise(
                  { type: "MOVE_SHAPE_DOWN" },
                  { delay: 50, id: "moveShapeDown" }
                );
              }),
            },
          },
          always: {
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
          },
          entry: enqueueActions(({ context, enqueue }) => {
            enqueue.cancel("autoDown");
            context.shapeRef.send({ type: "DOWN", board: context.grid });
            enqueue.cancel("moveShapeDown");
            enqueue.raise(
              { type: "MOVE_SHAPE_DOWN" },
              { delay: 300, id: "moveShapeDown" }
            );
          }),
          exit: ["rethrowAutoDown"],
        },

        Dropping: {
          on: {
            "DROP.STEP_COMPLETED": {
              target: "#board.Running.Dropping",
              reenter: true,
            },
          },
          entry: enqueueActions(({ context, enqueue, event }) => {
            if (canMoveDown(context)) {
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
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
          },
        },

        BottomCollisionHandling: {
          on: {
            SET_NEW_SHAPE: {
              actions: enqueueActions(({ enqueue }) => {
                // Setting New Shape
                enqueue(({ context }) => {
                  context.shapeRef.send({
                    type: "RESET",
                    shape: context.nextShape,
                  });
                });

                // Set Next Shape
                enqueue.assign(pullNextShape);

                // Check if there is a collision with the new shape
                enqueue.raise(({ context }) => ({
                  type: canMoveDown(context) ? "NEW_SHAPE_SET" : "FINISHED",
                }));
              }),
            },
            NEW_SHAPE_SET: "#board.Running.MetaIdle",
            FINISHED: "#board.Finished",
          },
          entry: enqueueActions(({ enqueue, context }) => {
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

            enqueue.raise({ type: "SET_NEW_SHAPE" }, { delay: 300 });
          }),
        },
      },
    },

    Paused: {
      on: {
        "BTN.RESUME": "Running",
        AUTO_DOWN: {
          actions: ["rethrowAutoDown"],
        },
      },
    },

    Finished: {
      on: {
        "BTN.RESET": "Initial",
      },
      after: {
        5000: {
          target: "Initial",
          reenter: true,
        },
      },
    },
  },
});
