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
  /** @xstate-layout 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 */
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
          on: {
            "BTN.SHAPE.DOWN.RELEASED": "Idle",
            "SHAPE.DOWN.FINISHED": {
              actions: enqueueActions(({ context, enqueue }) => {
                context.shapeRef.send({ type: "DOWN", board: context.grid });
                enqueue.raise(
                  { type: "SHAPE.DOWN.FINISHED" },
                  { delay: 50, id: "downFinished" }
                );
              }),
            },
          },
          always: {
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
          },
          entry: enqueueActions(({ context, enqueue }) => {
            context.shapeRef.send({ type: "DOWN", board: context.grid });
            enqueue.cancel("downFinished");
            enqueue.raise(
              { type: "SHAPE.DOWN.FINISHED" },
              { delay: 300, id: "downFinished" }
            );
          }),
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
