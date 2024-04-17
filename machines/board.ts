import { assign, setup, ActorRefFrom, enqueueActions } from "xstate";
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
      | { type: "BTN.SHAPE.LEFT.PRESSED" }
      | { type: "BTN.SHAPE.LEFT.RELEASED" }
      | { type: "BTN.SHAPE.RIGHT.PRESSED" }
      | { type: "BTN.SHAPE.RIGHT.RELEASED" }
      | { type: "BTN.SHAPE.DOWN.PRESSED" }
      | { type: "BTN.SHAPE.DOWN.RELEASED" }
      | { type: "BTN.SHAPE.DROP" }
      | { type: "BTN.SHAPE.ROTATE" }
      | { type: "SHAPE.DOWN.FINISHED" }
      | { type: "SHAPE.LEFT.FINISHED" }
      | { type: "SHAPE.RIGHT.FINISHED" }
      | { type: "NEW_SHAPE" }
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
}).createMachine({
  /** @xstate-layout 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-F0hwjhgJuBcEAA */
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
        }),
      ],
    },
    Running: {
      initial: "Idle",
      on: {
        "BTN.PAUSE": "Paused",
        AUTO_DOWN: {
          actions: enqueueActions(({ context, enqueue }) => {
            // Catch rest (not caught by child) AUTO_DOWN events and re-throw
            enqueue.raise(
              { type: "AUTO_DOWN" },
              { delay: 1000, id: "autoDown" }
            );
          }),
        },
      },
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
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue.raise(
                  { type: "AUTO_DOWN" },
                  { delay: 1000, id: "autoDown" }
                );
              }),
            },
          },
          always: {
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
          },
        },

        ButtonLeftPressed: {
          on: {
            "BTN.SHAPE.LEFT.RELEASED": "Idle",
            "SHAPE.LEFT.FINISHED": {
              actions: enqueueActions(({ context, enqueue }) => {
                context.shapeRef.send({ type: "LEFT", board: context.grid });
                enqueue.raise(
                  { type: "SHAPE.LEFT.FINISHED" },
                  { delay: 100, id: "leftFinished" }
                );
              }),
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue.raise(
                  { type: "AUTO_DOWN" },
                  { delay: 1000, id: "autoDown" }
                );
              }),
            },
          },
          entry: enqueueActions(({ context, enqueue }) => {
            context.shapeRef.send({ type: "LEFT", board: context.grid });
            enqueue.cancel("leftFinished");
            enqueue.raise(
              { type: "SHAPE.LEFT.FINISHED" },
              { delay: 300, id: "leftFinished" }
            );
          }),
        },

        ButtonRightPressed: {
          on: {
            "BTN.SHAPE.RIGHT.RELEASED": "Idle",
            "SHAPE.RIGHT.FINISHED": {
              actions: enqueueActions(({ context, enqueue }) => {
                context.shapeRef.send({ type: "RIGHT", board: context.grid });
                enqueue.raise(
                  { type: "SHAPE.RIGHT.FINISHED" },
                  { delay: 100, id: "rightFinished" }
                );
              }),
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue.raise(
                  { type: "AUTO_DOWN" },
                  { delay: 1000, id: "autoDown" }
                );
              }),
            },
          },
          entry: enqueueActions(({ context, enqueue }) => {
            context.shapeRef.send({ type: "RIGHT", board: context.grid });
            enqueue.cancel("rightFinished");
            enqueue.raise(
              { type: "SHAPE.RIGHT.FINISHED" },
              { delay: 300, id: "rightFinished" }
            );
          }),
        },

        ButtonDownPressed: {
          initial: "AwaitingDownLongDelay",
          on: {
            "BTN.SHAPE.DOWN.RELEASED": "Idle",
          },
          always: {
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
          },
          states: {
            AwaitingDownLongDelay: {
              on: {
                "SHAPE.DOWN.FINISHED": {
                  target: "AwaitingDownShortDelay",
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
                  enqueue.raise(
                    { type: "SHAPE.DOWN.FINISHED" },
                    { delay: 300 }
                  );
                }
              }),
            },
            AwaitingDownShortDelay: {
              on: {
                "SHAPE.DOWN.FINISHED": {
                  target: "AwaitingDownShortDelay",
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
                  enqueue.raise({ type: "SHAPE.DOWN.FINISHED" }, { delay: 25 });
                }
              }),
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
            NEW_SHAPE: "Idle",
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
              type: canMoveDown(context) ? "NEW_SHAPE" : "FINISHED",
            }));
          }),
        },
      },
    },
    Paused: {
      on: {
        "BTN.RESUME": "Running",
        AUTO_DOWN: {
          actions: enqueueActions(({ enqueue }) => {
            // Re-throw
            enqueue.raise(
              { type: "AUTO_DOWN" },
              { delay: 1000, id: "autoDown" }
            );
          }),
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
