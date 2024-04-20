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
const DROP_DELAY = 1;

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
      | { type: "HANDLE_STRIKE" }
      | { type: "CLEAR_FULL_ROWS" }
      | { type: "DROP_STEP_DOWN" }
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
    stopAutoDown: cancel("autoDown"),
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMJAMwB2SZJkAWZXIYBOBgo3LJAGhABPRADYGDEgA4ArMoYBGB1dU3JDKwF9PhtFggkAJICvFzoADb4xCRUBACCZPTMwhzcfILCYggyiiSmGkpaNnJWGjYaDoYmCA6SJST2GiX55ab5pt6+GNjkAK4CIQJQUaQACnEAqjSMLEggqaEZc1kyNqYNDG62GjK2ciqmVYhNGiTqDDKmMhpNpnKmkp0gfj1k-YPDkwQA8gD6ACLfADqRBmKU4iyEy0QkisVhImyutQcMmcpjhRxqKOkVjkOysq1xDjkJKeLwCbwGXCGJAAsmAeOhAhBwmAcAAJOJEf4AGQovwAwt8eTzAlRAt9Qck5gt0lDQFkHOZLKi1DZUY58spDsZEE4LLI7jZifZijkyd0Ke9qVA6QymSy2V8-oCQWCZRC5ZkzFYHA1lA4bg41vt5HJMQ5EdZSr79u4HriLf4+lSafTGczWUFHSMSHyAGIEPOSgDiv1GlCoNH+7vYnv48tEiDkazy7gY2vjJQUEeUVnWgY8sO12hk1yTr2taftmbA2dZubIgRL7KLPNL5cr1dr83rSwVeoD6wuJIKdyVAZsvfuCLcBUkTSs2j7E6tqdt6YdWdnuddpHXRBlhW1DbtKdZpA23oIC2liwk+D4lNqeK9o41iRk4SgEmUxKvimHx2hmjrzmyhCkP8ZDfKMO6ypB0JYgGbaoroph9pIphXrqNR1HIJCBgUjilOUNw2LhlL4Z+s7EbmBZFsBVYUDWYG7hB+5NggGgsWctQsb6KIPJIygRm4MgIm0lzsbiJLaKJU4fjORE-qR5DLquJByaBszgZCUHaSZazFHIxIeNokiVJxwZKKZVxtDYlnqHINnvgRX5zo50R-m5W4KdRe6NoqbHSIo7iRnI9ibLiEYIbIQVsQU8EeIl4n2d+OZORR8QEBQOUqXlxylGcxrqMoMgduiSiVU01XqLVsIMO4Xg+M8lp4TayWSXgvQ8Dwgg8mAABmPCjJgcCwJA0kUIW5AUHycQeeCPVQRoLh5Nc7gVMoFTXFYEYscedSRvYcKXAtXTJmJq0SURG1bTt+2HcdsCnbgtLfAAahQMScqMGMyd13l0eYJl6ZojilSNNwRvsljmAGji7KsGkdIt5IrdOhFZtD20CGQXBQAAFvDJ1nW1LlFpQN13R6D10bUBkkHY6p1E9bGxTq1QXn9gUdh4BLoo1EPNXOnOCDz-OC4jZ0o+jmNxNjzkrkknnKfjB41Ox6wsaFD7Du04bhVTeTayoFjmM4INLWDtkkMbAj-KgADuAhHULuBORl4sULd2VKTRqlZLipwdhUFzXEqDiGZx2HVaqNgWOqxQaPrNIx3HifJxbyNo-yVBY-yf5416Mu1JYdg7IoCg2LXBKYk+PEKLUahzQ+JdN7aLcJ0nCNIzgVvd73ALAqCDhO7nvVYm0shuO7lzGjcFfVG0pxwvcpPsXoLGryQ-yYKgbBsDaOByKUV+LECgowD5uhzrlHyihLBzQKCiRwThfQzxuGcOEWhcSohUGoT+39f7-yGIAii4DQHgP7sfe6Ls1LYjgSNHITh8jaBcJiDSPE2L2CUJcZBSpP54FQDDAAtgKVA4RwhcG4IIdk6ABAsgNpgKAADOTcj5CAggS4ADSXUoHS1dsSWuJAgz1xOMUTYmISTwkQlcJ69x5CBj4QI7awjRHiMkQIaRsjxE0g8XIoYVAeCYC4AAazZAKG6ZBfj5gmCKX4FEgRUAHrRV2xUTLvTKHiBQY4zGcRbDYawwU7h6HLnoZQDihEiLERIhsPivG2hqTafxgSQk4ESXnGEmxYLqhyHTGuMhWFODOB2TCahhqjjKU4iprjqkyN8baKgDI+BDCIGAeOVA+boDYGyGgBBfhEAoECEBvdWlnyUHLLQtURzmXMZPfJT5CmhVUAZcZqBnGVLcfUmk8yto2mWas9ZmycB7IOT3W23daDHKgqFOavF1RWC9vIB4YV1YdnhA8J6JVy5wiUM815UypEzNqTEBZPyVlrI2WyfMgQiBinZNnE+0C6JFXhKUYk7QumhT9tUZWgy2IWHLiSa4pTmbLVGOgXo282rUAmLSbR9LdFqTHHkjSc1GixhRKsGe6hZCKrDo4CogVcKivFWdZ0ECpRyuoVkCoJAiqKHMGxOFugDCcV9PCFQcJNDz0Ci2XC+ZqQSL5sLaIlZwU6MtTCJwfoLgomREaFs989TKsMaFG4jg9ClVJMK5MfqQiwEDbgEQsBGQ8DnOgA6YBMAAApa4WAAJQ4BZjmgNkAIWMskDc4atR3Xam1PITE7Z1gaTcMUJUZQDJM0WgIVAEA4DCHJFQwertxAGPkIoHB6gtA6ATQgD6JkRp3OcBYEaxpcLBFCBEBdSSaEfV4vcUoiEHxKnbZVEk0YkRFHuHiRuWbJzvkvW0hAtceLEy0Cacm-ZMSxUsE+J8w1sFXDxJ-SGrJ-1n0nnkkDpNRkU3CkqPJqJArKGNIiMoMgkOG2IqhnySoeLDTKHcB4qxnXq2GusFsQUAylweOR9mRtNpc12gdduSMqN0VgzajlwYzJjgeD9UK8t0SBgeOYWwk8eMpWjvxk2vMBbCcgKJvR2o-TolDKYJw8hjRyb9GsX0GleWqZEj+t8+F15ty3vpqW4aEBwr9HoMoegfaRg4tUEoRM1C7H2A8co9inOs1tPgv+NoDM0NqKcQKCE+UBifBoVh-ZDTIIYITZUQrQa-pc44l5kyqn4s8Ulzzi6aEIbbNrK4FgVWYjaG64Kk9LjxscDiqr7yCXyMUUMZLip0R5IeC1kaFgDIz1WGcXYLEiPBhRHYAbLjqvuOG943bUBGnBLAONvUHrrBPS0CZj6xRt39j9PsfspzzAsXNLF8GzcKu4u2x8uZxKlmkv+cd+rV6sihTuA0GtD5VDaCVDPMzS3+xIhGvGMjsWjUieBwB8dCI4O1x1c4TlxxAzy2HuZtQyqEqxabXmjzXkGug6UMoPIRGFBooUH2YLeolPWGRx9K4BJTTeG8EAA */
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
            MOVE_SHAPE_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: [
                  "moveDown",
                  raise(
                    { type: "MOVE_SHAPE_DOWN" },
                    { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeDown" }
                  ),
                ],
              },
            ],
          },
          entry: [
            "stopAutoDown",
            raise({ type: "MOVE_SHAPE_DOWN" }, { id: "moveShapeDown" }),
          ],
          exit: ["rethrowAutoDown"],
        },

        Dropping: {
          on: {
            DROP_STEP_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: [
                  "moveDown",
                  raise({ type: "DROP_STEP_DOWN" }, { delay: DROP_DELAY }),
                ],
              },
            ],
          },
          entry: raise({ type: "DROP_STEP_DOWN" }),
        },

        BottomCollisionHandling: {
          initial: "Merging",
          states: {
            Merging: {
              on: {
                HANDLE_STRIKE: "HandlingStrike",
              },
              entry: [
                assign({
                  grid: ({ context }) => {
                    let newGrid = context.grid.map((row) => [...row]);
                    const { type, position, rotation } =
                      context.shapeRef.getSnapshot().context;
                    const shape = getActiveShape(type, rotation, position);
                    shape.forEach(([r, c]) => (newGrid[r][c] = 1));
                    return newGrid;
                  },
                }),
                ({ context }) => {
                  context.shapeRef.send({ type: "EMPTY" });
                },
                raise({ type: "HANDLE_STRIKE" }),
              ],
            },
            HandlingStrike: {
              on: {
                CLEAR_FULL_ROWS: {
                  target: "SettingNewShape",
                  actions: [
                    assign(({ context }) => {
                      let newGrid = context.grid.map((row) => [...row]);
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
                          strikedRows > 1
                            ? strikedRows * 200
                            : strikedRows * 100;
                      }

                      return {
                        grid: newGrid,
                        score: newScore,
                        linesCleared: context.linesCleared + strikedRows,
                      };
                    }),
                  ],
                },
              },
              always: {
                guard: ({ context }) => getFullRowsCount(context.grid) === 0,
                target: "SettingNewShape",
              },
              entry: [raise({ type: "CLEAR_FULL_ROWS" }, { delay: 300 })],
            },
            SettingNewShape: {
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
              entry: raise({ type: "SET_NEW_SHAPE" }, { delay: 500 }),
            },
          },
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
