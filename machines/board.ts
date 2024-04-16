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
      | { type: "AUTO.FINISH" };
  },
  actors: {
    shapeM: shapeMachine,
  },
  guards: {
    cantMoveDown: ({ context }) => !canMoveDown(context),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EANgYkAzAwYAOadMUNpAVgZqAjABoQAT0QBaWVIBM0s2fEAWaQE4NAdkcBfV3rRYIJAJIDeLnQAG3xiEioCAEEyemZhDm4+QWExBDV7EnF7ezMnNSd1dQsbGz1DBCN5KQL1JzMGSS0Ge3k1d08MbHIAVwEAgSgw0gAFKIBVGkYWJBBEwJTZtNybEnsFcTNq3IZ83QNEKXk2m3kS3PECpy12jxAvbrI+gaGJggB5EgAxXyJfKgAEtMEpwFkIlog1PJMgwbBk7ND5M1TuVDiRjmptGotjYtkoCuIOvcuj4nv0uIM-BBgmBhhEAVERhQSAAZChfAgkEaUKg0AAiwNm82S4NAaTsZnR0nE13yDDMWja0icqIQN1aJC2uyRWhsTnE2XkRIepOeFKgVJpdMBjOZZF8AHEAZzudR+YL2KCRakJOI1vUDWYcmpsusVQc1U4WiQWlHrtiGloFcaSb1yZTfNTaYRSDamSQ+e8AOqjHnu+JCr38UWiRAKyWKyTiJR2aWaVXNBTo+zNLROM5neEp7xpl6W7PhPPMvlkd4jD1zKuLMWIWTSEi6xrWG4ykP7CpaByS9abaR69S2JPDx5mjNZ60M-Oz6IECgL4XVn2VbQkNRwtryDY9hnti+6ILqNzdps1ynE4dgKNeprphaeA9DwPCCCyYAAGY8CMmBwLAkAPrarLspylBslE5YzJ6SSfhCCAWFI0pngoajSj2sLhgelxOJqIYuM2gGdmYiGjuaJCoehghkFwUAABZ4QRsBEbgOb0qR9pOhRFBUTRIL0cutYILiv59lGti5DcDjiB21SrGYNgMFoip5NxBriWSY7SRhAh8qgADuAj4YRxEaVOBbFqQlEUNRFAChWdFgl+pQkHC2ixhc6zaKq8j9huzaYg48ryJsRp3CaEmUr5ggBcFoWqcR75LjWaS6hkv7HIe9iSNKiiqj2aianBJ4KM0lzSF5t4oWhfn1SFKlqSQUSBeggSDAtLKCFAfJgME6D6DgkWFiW3y-P8AIJS1RltYggGrDccGnG2eoKoNnWlC4yhbNY4hnNNyFSXNdVBYtYU+Kt618JtYNUApqCYDwe0HUdJ3RedfyAtdSWLrdX7NGVmqthi1Q2XZEbQn6qiHk9P1OIUgNjnymCoGwbDmjgM5zhEr4jAA+gAwu8ACyIxsq+iW0XjKWMSGUhwdozYTcqWwdr96UKo0vVles0haEzkks2zHODDgN2yyuCD2GZFy2aevbyB2NjNCQhQ24aSbqBVnQjt5kl4KgMkALaC6gwTBFw3CCAC6ACNSnNEBQRb81OFveoxWjZPx6i7C4fZ7uoHaNOumLObkDQ9lo9hOOJIzoD0al0jy4wi2+uMfsZ7VWKXMqSN9xUUxUJjyFkHFAbYZgZCU0riV8FJRwpxEiLAPDoDwYAkOguFgJgAAUGhyAAlDgVXzwEsBLxA6cMVbyrDS5uxuVPGQaGUEZGNXmRHlPigOFn4gbjuDuAIVAEA4DCBNIZS2JlP56l-P+KEQEQLvQ-sofihQrA21KKcQS4l-CBBCNAjOVsfxTzkHkDiBQRI8WMA0UeCgtZ5D7NXaEhtBjENvrAnICCoRIOAnCVBFR6haBjPrWyOQ+JInYRaTMNJOFd3AlCGQDR9YGlxIqAaEYbgcRUW-fKLQWhiUqqmf2NUQYCCwrhRqakFF3VMvlTWKgozQkxFCDslxR69l1I4P8ypVAyOBjJAQclFLKQhnY1KZx0RWHyoqCeORaGRijOlAxrjVD6lniYv2M0gnzTBjYyAkS5ZyE1H2Noipq62ANHlLsHFdTuRsEVP8gTar+QKUtSAK01obV2mDbam19qHWKaQ04ZT+zaCRL1JpQ9ECOFEfUoMDN4z5UJNkm8QM2kLUKZDHpMM+nBXhojZGQyKjJRISZQm642h5GlJooCIYPoLP1kshmNxVmBONuzc0IyTKSEyGcXEuxnKKlaEkw8gE1iuMxDBeorSg4YVDuHSO0cBCx3jpHDhlZ8aZxwTIL+-Zmi9QZtIYursti2FKBxfI6g64N1sdimB7UFDmCRA9FQ1QkmfyzjGauZdsR+OVHPBel8imMouWkDIUhOyXFODkJ6ZhVRGAaA2XEf0JTyhyMA1wQA */
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

            enqueue.raise({ type: "NEW_SHAPE" });
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
