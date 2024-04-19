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
    moveDown: ({ context }) => {
      context.shapeRef.send({ type: "DOWN", board: context.grid });
    },
    rotate: ({ context }) => {
      context.shapeRef.send({ type: "ROTATE", board: context.grid });
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMkkgBYAzADYAHAEYA7AE5Jy+coCsihsoA0IAJ6JVkhgxKLrm1cs0N9DWZuUBfb2bRYECQAkgK8XOgANvjEJFQEAIJk9MzCHNx8gsJiCPLS9i4ebl6assZmlgjWziTqqvL6qvqS+rKS8tq+-hjY5ACuAmECUDGkAAoJAKo0jCxIIOnhWfM5qpqa8nLKsrLN1i4tihWIuopyTuo2ZUqyPn4gAb1kA0MjUwQA8gD6ACIfAOpEWZpThLIQrKyaFQkAyGTR1WTqW4eY5VfTydQkJSKXZ6BjteQMTRdB49ILPQZcYYkACyYB46GCEEiYBwAAkEkQfgAZChfADCH253OCVGCHyBqXmi0y4NAq0Mm3kGNu6n0Wn0mv0qNURNUtUUeiRskU6nkJMe5JeVKgtPpjOZrPe3z+gOB0tBsuyiHUbhIkkUDmUxjqHTNOoYGJI+nWqkRinhOOVFrJ-Up1LpDKZLJCjtGJF5ADECAWJQBxL5jShUGg-d3sT38OWiH2Gew2DyKGym5SXHW3M5rYw6E0MM0dFOBNOvO1Zx25ln5sjBMtskvc8uV6u1+sLRvLeVWWSqM6R9RaAN1HFNfvqU-NbSSeHBpF3bpTikzzMOnPZ1mEUhXVIDciArKtqB3KUGwyJtvQQYN9DkIx2laE1lENdR+0jaMuyUWMNkJWRJyea0M3tP8F3-WIfjID4xl3GVYIhKo431XC1hNW4A21CwrEkc8SDWbQGGcTQY3WfRiKtdNbW-Ci-3zIsS3AmsKDrKC9xgg8WwQKFZFqawcTUeou0kWQdWaTYGEDbF9F7c8xyk6cbVnH8wEopcVzXEgVMguZoLBODDM2Qx1TqX0X0kVQLPaEhrMNQM7PPX11Ccz8XLk+cFIAkggJ87c1IY-dm1WAMZGkGxdSRWwkp1J9MXkDR8QTHR8WMNLSNk8isrzHLaMSAgKCKrSSsQEpakaX0FE7ZR2jq+EsSagNtGDGw31JD9Otcii8D6HgeEEbkwAAMx4MZMDgWBIEUihi3ICheQSPyQRGuCvH0w1hKcTx6i8HUcVPfjdTKZRTnWy1nLIucc12-bDpOs6LtgK7cBpD4ADUKDiDkxixpThsC5ijE2EyiREpFCXWHUzTsIxjxEvQGihRQOpk7b51hg6BDILgoAAC0Ry7rr6ryS0oR7no9V7mOsMzo1xfivG49D-pNOKgaKUGlHB1N0qhtySE5wQef5wXkeutHMexhJcfIUWCa9GXFDbHEoqfEcE1NanCXsIp5DKayRNB1mZyNgQflQAB3ARzqF3Acry8WKCewqNMY7SchcTQDXcQP4TvNxUQc6MNDjXQ1BaOoQ5csOI+j2PzdRjG+SoHG+SAh2mMPKplWznZ8UfOETSOXiEFNOxjCaJ9PG7SNq+pWuo5jpGUZwTuM6sJQZHH7Ze1UE8oU0VFZsQzxShPNbDQ8efbR+TBUDYNgbRwGi6LiQaxgFD4aTGXlBvU-ymlCbd0MnYZoRJNQOGMCJcyo9dRGGjGqccGhjyGiIvcCGetb730fs-deo0qhPjOF4dUzgTyakJJIVEj51bSBEg4dEShJIYN1ltPAqA4YAFt+SoEiJELg3BBBsnQAIZkz8aAEC+EQCg-wvitxtkNNOxUgqmn1M0Z2pQnBRXLsfWw-pLi9iDj9dQOtNps3YVwnhfCBFNmEaI-hwwcDSNkfI3GcjaD4KCjsM46EmiIicM7ChEZsIGFNEoNw-sVAsxYWY0OHCDrcN4fwwRAg7FiMcYWYIRBRRslToA9OBCNBtlnp7Qk+JZrUJ9ioUo6EbDqj0Mw98vQxjoD6KvPq1BJg0kUfk5RMsvA+JIcYHEapWg8UqCM-0zhbABhcCof2TkWltOus6X4AJJS9Olt3Oh+oMQNFNFoNw5DUTXkEmoMMhgopJicoWKkAi+bC1iNWDxSitk6WkMeQSzRdDHkaneHYOoSEkBWneAkhhQk3LubAB5uARCwAZDwdy6BTpgEwAAClzgwAAlDgCGtywjQsgJ45i7QHDq0MP8vU+JUQ2D0L7f5rRQYGC8L4e4AhUAQDgMIS0L1gE6XEL6OQ2sNArQaQ4VEnhEKT2aHeXUAYmjRKaUEUI4Qoi8sdiAzwgkzStBMV2FwGo6o1CHB4HVHzSg33VV3HS7hMSk1cCgymKtR52RkHZJocqEz+0MDfdmLIrUbwQFqQS4SHUUyJEfOB5DFoJgMNYJQr5fWZV-I6ANhSTyYgUGJU0uFmj9iUBNJqvyAmSCTd1GGe0uZHVOg3FGaa4LBn0tIUuhhDTKi7P9KKOE1BQgDMYLUZbobuTDibAWtbID1pliaNivZ237wxI0TtaiVBrC7EYWEjSNokXMZWwQddl5x0nSA-eZwKHoXiviawRcuyCQTFqdoBwTy+rvg-J+wwj06X3k+AyhJCTVRqtQuM0YamK1aPsVKMTt1xMsUkmxQiRHpKgB+1YM9gX+w6BsFQx5tDHyhPoqKJa9LtEWa0utUs+U5DdvpBovZGh00uCaIunz0ImPobqPIeRIUEphchxAbswFNEjM7GZJjMJwPaPpTwxkNiRlYqy7wQA */
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
