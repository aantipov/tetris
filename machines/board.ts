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
      | { type: "NEW_SHAPE" }
      | { type: "DROP.STEP_COMPLETED" }
      | { type: "FINISHED" };
  },
  actors: {
    shapeM: shapeMachine,
  },
  guards: {
    cantMoveDown: ({ context }) => !canMoveDown(context),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAdgDMJAIwAmAGwyALJIAcqhgrWSArABoQAT0STl4kguW6rymVIbjxcgL4vDaLBBIBJAby50ABt8YhIqAgBBMnpmYQ5uPkFhMQRnEl05a11JAE41XV1HfMMTBBtdDJU5XJq9ZQbxNw8MbHIAVwF-AShQ0gAFSIBVGkYWJBAEgOSJ1NrKhQU880yFOV01NVLENYVLZUddXNzxXLWVZpBPNrJO7qhfCCCwPvCACUj+ihIAGQoAMQIJH6lCoNAAImN4pxpkJZohVHISDoFOJ7EU5DICpJxNsEDIjmoSHI1I41DIVOJFvlLtdvLculweo9nq8qB8vuQfABxN5AkHUCFQiZTJJw0CpRYkE6KNbHGzHRx4+wMXIkVXiRwEuRyBjyGS01r0u5Mh4+J4vQikdmfb7ggDyAHUBqChXERTCxSlEJikViFFpJGYgwGDMZEDIGAwiWpcpH7GoSetcspDV4OozmebWVb3raSOCyPb+sL2J7+OLRAiilUluINuYGLpnGGyhTm7Ilsp8tpyYo1Gmbiasxa2RzvkWogQKKXJuWZhLEABaXQyDLWAoaXJmTIyZV2SqxtZo5RqcSaAfuK5GjP3Eh4do8HiCH5gABmPH6mDgsEgY-zfyAuQFB-JEbrjGWiQVt6CByJIDAkJIXbRjkChxgw5jKgoHbrKiZzqHYUauFedK3qa96Ps+AhkFwUAABaft+sC-rguY2pyZA8nywGgeB0JQQuVYIMoSKrk4WjdpiORnMqpLKMSBwUommrmIsg7GpmDwPk+gjgqgADuAhfj+f5seOBZOqQlC8RQkLupBsIwQ0JDZJGJy1GhTZ7uGCBnkSMhLIUeQMCSayXi06YMne2lUXphnGcxf6zqK0HwviIkWFoawMGYFKKMoeK5KuxJSOSiwqui6lkcyMW6QZRlMSxJCRPp6ABD0cUCD8ghQOCYBBOgRg4OxdqWSQ-w+EQPjsrZyXzpWqTiAUJBOKuGwyHGahWN5ZRFfJTihthaxwXkVVReRtUCJ1CVNS1bV8B19VUHRqCYDwfUDUNI0Wc642TdNbyzfZc4CQtEZki5WKrk2UZbRseKbGqqLNnBmxefYZ3Dg84KYKgbBsKaOCFsW4TTv0AD6ADC9oALL9H8052RBIOOWlS1IsUBRZEojiSMqchogpsakkcG05JImOaQWuP44Tc2gzBFJSIhOKSJG56OIsyoEghxxnJsAYBuYBokTe501agOkALaU6gQRBFw3CCG86ACE8hNEBQjrkyN8us4u+KZGqeqJs2S1IVY-OnhkeryA0RT5EtkvRZbz423bDtOwILtuw7PQ4BNU0zUz-H+0JBIHNKDTRlY6gC5HPmRtGyLoXBaEkk2TSm+m-ToO0LGvKCQw0zOwMpYJqTyKq6o5YoQe6MbuI+bs+yOE4UmogSVX-Eyjt0X+IiwDw6A8GAJDoB+YCYAAFEUUYAJQ4KRO-+LA+8QH7XppUGfp2DisZFSbLGPEDR5K1A0PYKGDgTZXgEKgCAcBhB0lLl-AOS5KTrg2A2bc1hMR4kUAhFQNg-5q20DkKqfgAjBBQalAO6QMIHHXkhZsmQtg+TsGqcBBxCgEj1gvZOpoaET2XMcTBm5uw7jwT5E8lh6zaHbnqcwqZu5DiltmMAQiwaByJJIXUQZSQBlOKuZUmQkRKC5tGKMOJagCJqpRF875GImQgJopyZ4XIkngpqWMhR4aN2wv5WO3ZCiqE1BLFRGlor2OorRBiN1ICuLSqeJEiYSRoi3GhE4ypxIuTPNGQBOIlgKFsVpaJ11GoJI9ArJJKZLBFE1LPewaEl5lFJH6esmoF5WJqLoEpFEdJXXqvE7wd12q9Xqt1Dq-VBqJIDgvMx9TulNKyT5FMCFEQCyQuYbcUg+mXXKc45qrUxmdWeq9d60yygOVQeXJs0hSRx0KDUVUDddo5BWk8gMR4kI1D6TjPGBMeizKEpsDmJIbCLBEmrJC2tiponbkUAk2Fjh7NTqgdO9tHYVhzu7IFVSy6TyURkJa1gtBYgwhtbWujZACy2khPIiw9BVV7v3Sp1zaG3M1NKXcZhQzzLYWUHIRIsinjpdDXRxSInjV3m-NlLMbmTwwmqSMGgmybyjASEBIlZAkruWjNCGM3AuCAA */
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
      on: {
        "BTN.PAUSE": "Paused",
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
                    { delay: 500 }
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
