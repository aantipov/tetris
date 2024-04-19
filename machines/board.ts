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
const LONG_PRESS_MOVE_DELAY = 50;
const AUTO_DOWN_DELAY = 500;

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
      | { type: "BTN.DOWN.LONG_PRESSED" }
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
    rethrowAutoDown: enqueueActions(({ enqueue }) => {
      enqueue.cancel("autoDown");
      enqueue.raise(
        { type: "AUTO_DOWN" },
        { delay: AUTO_DOWN_DELAY, id: "autoDown" }
      );
    }),
    moveLeft: ({ context }) => {
      context.shapeRef.send({ type: "LEFT", board: context.grid });
    },
    moveRight: ({ context }) => {
      context.shapeRef.send({ type: "RIGHT", board: context.grid });
    },
    moveDown: ({ context }) => {
      if (canMoveDown(context)) {
        context.shapeRef.send({ type: "DOWN", board: context.grid });
      }
    },
    rotate: ({ context }) => {
      context.shapeRef.send({ type: "ROTATE", board: context.grid });
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMkkgBYAzPNkA2AOwBOWQA55a+QEYANCACeifZOUMS8huv3qGy-Q20N5AXw-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 */
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
            enqueue("rethrowAutoDown");
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
                "BTN.DOWN.LONG_PRESSED": "#board.Running.ButtonDownPressed",
                "BTN.DROP": "#board.Running.Dropping",
                "BTN.LEFT.PRESSED": {
                  actions: ["moveLeft"],
                },
                "BTN.RIGHT.PRESSED": {
                  actions: ["moveRight"],
                },
                "BTN.DOWN.PRESSED": {
                  actions: ["moveDown"],
                },
                "BTN.ROTATE": {
                  actions: ["rotate"],
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
                      { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeLeft" }
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
                      { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeRight" }
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
                  { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeDown" }
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
