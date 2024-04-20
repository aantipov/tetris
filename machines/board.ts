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
      | { type: "HANDLE_STRIKE" }
      | { type: "CLEAR_FULL_ROWS" }
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMJAMwB2SZJkAWZXIYBOBgo3LJAGhABPRADYGDEgA4ArMoYBGB1dU3JDKwF9PhtFggkAJICvFzoADb4xCRUBACCZPTMwhzcfILCYggyiiSmGkpaNnJWGjYaDoYmCA6SJST2GiX55ab5pt6+GNjkAK4CIQJQUaQACnEAqjSMLEggqaEZc1kyNqYNDG62GjK2ciqmVYhNGiTqDDKmMhpNpnKmkp0gfj1k-YPDkwQA8gD6ACLfADqRBmKU4iyEy0QkisVhImyutQcMmcpjhRxqKOkVjkOysq1xDjkJKeLwCbwGXCGJAAsmAeOhAhBwmAcAAJOJEf4AGQovwAwt8eTzAlRAt9Qck5gt0lDQFkHMUZAjJMpbO41PYGIdjIgnI5rA58jIdQdLjYyd0Ke9qVA6QymSy2V8-oCQWCZRC5ZkzFYHA1lA4bkq7jJ5HJMQ5EdZSv79u4Hrirf4+lSafTGczWUFnSMSHyAGIEAuSgDiv1GlCoNH+nvY3v48tEiDkazy7gYygeOpKCij6vWwY8sO72nDGhTr1tGcd2bAudZ+bIgTL7JLPPLlertfr80bSwV+qD6wuJIKd2NQZsA-uCLcBUkTSs2nVU5t6ftmadOfn+fdpCbkQFZVtQu7Sg2aRNr6CBtpYsIvk+JTdniA6Gv6ji1Ls1w2MS75ph8DpZs6i5soQpD-GQ3yjHusrQdCWJBh2qK6KY6qSKYN56jUdRyCQwYFI4pTlDclo+M81oEXaRE-guf7kQWFDFiQoE1hQdYQfuUGHi2CAaGxZy1Gx-oog8apRm4Ko6lcbQ2LiJLaPhlKEd+86kcuq7ripO7qbRB7NoqHEqmsxRyMSHjaJIlTcUqSgIm0lycfZ6hyE5M5fnOJHydEAHeWBvmaXROmBQ8JCKO40ZyNqdmRjFSGyOFHEFIhHhpZ+MludlpBUfEBAUH52kBccpRnLh6jKKa3ZWEoUb1ai6hNbCDDuF44nklJs7ETmeC9DwPCCDyYAAGY8KMmBwLAkD5kWJaUHycTgbMkGQjBGguHk1zuBUygVNcVhRmxp51NG9hwpcq1dKmznSa5JE7XtB3Had52wJduC0t8ABqFAxJyow4zdA0vQx5gqqZmiOFVpo3FG+yWOYQaONhrQdGtknQ5tskkPD+0CGQXBQAAFsjF1XQpK5rrdFD3Y94KDTBtRqiQdg2DkeLTUlurVFeQNhV2HgEuibUuZl227bz-NCyLqNXRj2O43E+PkJ5SRPVpxNHjUnHrGxUVPqO7S1drdN5PrKgWOYzgQxJUPpdz5uCP8qAAO4CGdou4ApuV3RQD0FW7RVDQgcI4nCDgTTYy0ogSmJvdIxJhWs7hKMUxvSTzicp2nKNozgdv8lQeP8gBRM+iTKJnFFDz7ChtgyJiVXKEaJS4einFvcobc0h3AhJ6n6c27go-0Z70a4iQBTPhxuG6NomK4pYWqJfsVgPKzkPTu1-yYKgbBsHaOBKLURiH1UYgpvi0lGHyPqGkC7+QVhxSw0ZVa2HMC4XYUYux8Sqs4H6LgXy1E3mzWOX8f5-wAcfYq+pUTSDpvpYoNhK7KDWLXXCeR7gVCqkiTYYkP4fkIngVACMAC2ApUDhHCFwbggh2ToAECyGGYBMBQAAZybkfJfixBXAAaX6oVeBDFjSlQbpqEuphiRa1bCNPQsJK4vnkIw6O60Ob2kESIsREipFNlkfIyRNIfEKKGFQHgmAuAAGs2QCnumQX4hYJgil+FRIEVBKFF2DJIGw-EI4cVxKrEkygF5tEDNPAk6oNaPGIZ-ARQj9qiPEZI6RAgAl+PtM0u0wTQkRJwKkhW+kAwTTjFoS46Sg7HFyCoNUP17DGgqBUvhG1XE1NQHUzxjS2k0ioAyPgQwiBgGTlQQW6A2BshoAQX4RAKBAk0UPHpDFFCXARGDK4lc7jaC4tUe46xVAlJUGYuZMcqntyWSshp3i5GBPtJsvadpdn7MOccnAFyrmD0dgPWgtzPadiXgSco1lBwuEsXpeocFrgjnGnoLeiz3H1K8TI8FLSYhbJhXsg5Ry2SFkCEQMU7J85yw9rpKKL4ERNBJHYuwZQCncWfKNC4Whprkv+etUY6Bei93FtQCYtI9FwPlgxcMmT9LLUaPGFEqx77qFkPqqOjhOEOHwsq1VV1XQAmBFKHV-KsgVDKuVRBOSnx6Hvs4WQZTNAKGJMSXhAKAiFmpFIwWYtojVnRfo3Vp8tDrCaJcMK00LxKijPQjsJJp7AyaPhGNIRYDxtwCIWAjIeALnQCdJRAAKSuFgACUOB1rlrjZADFAqLiZLUCiAozC6gEgMNxZu2KdjlDbBG2ErNxICFQBAOAwhyR8rHp7cQldZAKCUKodQWgdCSuqJXFUrFyq4nXjsIh8zgihAiFuk+uly6nAsaUZCT5jQZNmiSWMSIij3DxJOSp-C7QvqoQgSufFyZaGJBNTQr9MTlH6d2NUigQP7EpR1Z0UGi6MMyfBymSGaYxWNJk1E+RdCrHUF+3DsNfz4a9Kmt9xo+ITTKHcB4qxJ3awmused40R2-sY6bBcO9DonQPmjAjMEXxL0UOGtYVxwwPABlFZW6Jgxvw8ER8TW1JMJz5gLYWsnIDycMd2AM6J9jDJRPOzTAY1j+n0og2wjDcM7z3t3DOVnPbTSHTx00ypMLvMQASAMCgBnaH9LsXD39f7-yGAF9jT5DKhbgv6XCEW9L2DOOqVQ8gnD6VKN54FHjQV0t8ZB1jHr9R2HhC+cwbZ3CmjCpiO48Ir2k1qKB9+UaFnc0qzStZ9LFHKLq89bdb7WjWB1G89r2horVAJfu9EjDVAZODDICr1LVlgtq-4ibQSQnhLAGlxUeJpAeGYW2EkL4uyEtxNIeQ6IVDWrqPt2pVXaVNNO5CplOyWXwsu-V2bWR3D1GefkUp73Ljmre-cXE9gGFaEVZJB1cmIevqh92BEE1VgXFWE4XEtdgzK1qJhFQeJWtltjZWyzuPoMVSslcH6qI3AMMJbUNwyschIk+9fCp3ggA */
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
