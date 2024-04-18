import { assign, setup, ActorRefFrom, enqueueActions, raise } from "xstate";
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
      | { type: "BTN.LEFT.RELEASED" }
      | { type: "BTN.RIGHT.PRESSED" }
      | { type: "BTN.RIGHT.RELEASED" }
      | { type: "BTN.DOWN.PRESSED" }
      | { type: "BTN.DOWN.RELEASED" }
      | { type: "BTN.DROP" }
      | { type: "BTN.ROTATE" }
      | { type: "SHAPE.DOWN.FINISHED" }
      | { type: "SHAPE.LEFT.FINISHED" }
      | { type: "SHAPE.RIGHT.FINISHED" }
      | { type: "NEW_SHAPE" }
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
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMkkgBYAzADYAHAEYA7AE5Jy+coCsihsoA0IAJ6JVkhgxKLrm1cs0N9DWZuUBfb2bRYECQAkgK8XOgANvjEJFQEAIJk9MzCHNx8gsJiCPLS9i4ebl6assZmlgjWziTqqvL6qvqS+rKS8tq+-hjY5ACuAmECUDGkAAoJAKo0jCxIIOnhWfM5qpqa8nLKsrLN1i4tihWIuopyTuo2ZUqyPn4gAb1kA0MjUwQA8gD6ACIfAOpEWZpThLIQrKyaFQkAyGTR1WTqW4eY5VfTydQkJSKXZ6BjteQMTRdB49ILPQZcYYkACyYB46GCEEiYBwAAkEkQfgAZChfADCH253OCVGCHyBqXmi0y4NAq30SJINgYeSUcKa8lRqn29gUsjWUMkik0hhJj3JLypUFp9MZzNZ72+f0BwOloNl2UQ6jcysVpraCic8i1FisRLsHlcRVcnnNZP6lOpdIZTJZIQdoxIvIAYgQSGNKFQaD83ewPfw5aITop9FjJK55LtSujFEcw1VEbISF4fRoDep1IZ5PHAonXrbUw6Myys2RggBxNn5wvUEtlhYV5byqzSTFKFzOQlIw-axSSVQkfT+1zKBiqRQh0dPK3Ju1psAz1mEUg-MgfMYNxlSsvSqJo7FuJETVVBxFHUUNKh1Gp5H2bZGihJpn0tJMbRTe10w-OcPkSAgKCArcq1WEMINvWscVxBxtRDTY6nUE1PCMZRlFrLDx2tSd8M-PA+h4HhBG5MAADMeDGTA4FgSAs1zfNKF5BJ1ylcsMhAiEEC8TZayHZRjVrdYGHUM8LyvG9jHvR8R3uC0+LfKd02E0TxKkmS5NgBTcCoDkxgobMKDzEgc2CIhRTZChS00zdtO3asEDbTZjURLjdAbbZVG1JFL08QcdXaR8214ikJzwj8SHcsSBDILgoAAC28+TFJ-chF2XcgKDUjS5i0sFQNUWRzx7JCHHMlRmgQqxr27bRCVUWytH0AxytfXD32nWrBAa5rWt8xSAoSILOqXfMIqigLYvIxLKKsc9lB7LQMVGhtJBPPKDXOdRlD+y59HWIGNpwmqRLqn5UAAdwEWS2twDqXVIVSKHU274uApKchcTRalrWwjHhNi3FRQc7EaBFdDUFo6lBiddoEKHYfho7-MC4LkfCyLooxgaEqG3T6gaORDEVfLPGkWaUrYuRVVG+ovGkFp6f4xnmbhny-JwO7BZ3KoQzxg01EVYdTX0VE72e5bmh2bj70JO5ujHCr+J+TBUDYNhrRwP8ALiUixgFD4aTGXlSLi-msYevToTqJsdncA54NRbRu24hoWyyhRVepd3Pe94YdcxijhpDM4GhNS4q6hUwO2W-IbA+hFayUSRc5tPBUA8gBbflUEiSIuG4QQ2XQARmR9ogKH+L4TqC3XPSFwqry0Yw1vPBxZG1NxNmW2Mmx9S4HOdl8wa73v+8H4fKzHieh6Lq7ecjkF7uG4mYS8IlPEJWw68Q3UOImyGk3qaRQvExjoD6NrDqRZJg0jIiXN+QsvBnBcAYYwOIhytAth2LBypnC2GNC4FQTYIFQO1k6X4AJJRR1LrpaQ94sTwUMIOVwjRayohxJeZwishzngfDnRyCYcxUmHk1dqsQiy0EXjpfW0gfpNB0MAlCbEdjai8HWbQ-1zwhkMAYcBwixyiLCLACRuARCwAZDwT86BpJgEwAACncLYAAlDgJyJjxGQFkdjRAJVLz4lYTiIkDdUQ2D0PYKauxbhcSBk7UkLtNoCWqoRJGNCCxFn6q-PWyUDDPXWD6NwcFLh3nbIhMoZx4QXn+kEh8SJfD3AEKgCAcBhAWhyUvfW4gfRyAPBobRehDC5Q7O4Aq8tESlDvE4duRjeihHCFETpcjkojTxhoBoGUnrwlNNqGpJA1i2ERA0BRpQO7LL8QgVhyosGZTyF4A0qI1oFPljiNQxVFQdxSQ6C5McHB1nSn9Li9ycp7KYaxIcDAjAqEwnM7ClVtoER+e6ZB+sdRwT6WAti7RmjagUGcIcGgPCKwfLM0+8L+JVR2hDTy0lWZ+V+aBO83ZpAaCaKlcukhLKXn0WsTe69rxfKpW5Gl9VGotXpZARlQtGh2DWISa8wLjQjTPESK8n1rAeAUX9WQXz1Yw01gjaVaL0XWT0NCowF4uUdmxQck014ZoHAfF8-OXtrTGtWfUZ64t2immMjM61lR1hnF2A2VUfqv6GPJc5Tu3cxJ9wHkPEeAg76T2GB61YksexNg6BsFQBptCWyhMqS4axSVQjaCfRJvRIHQKlSi3JOQrXdgaP9DhHhLijTJj9bif07LLTVGS6tQQvFmPrYNLpyULxNjkMtHYB4+wWXriVA5g52gDk8CNfQjTvBAA */
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
      initial: "MetaIdle",
      on: {
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
                  enqueue.raise({ type: "HANDLE_COLLISION" }, { delay: 500 });
                }
                enqueue("rethrowAutoDown");
              }),
            },
          },
          states: {
            Idle: {
              on: {
                "BTN.LEFT.PRESSED": "ButtonLeftPressed",
                "BTN.RIGHT.PRESSED": "ButtonRightPressed",
                "BTN.DROP": "#board.Running.Dropping",

                "BTN.ROTATE": {
                  actions: ({ context }) => {
                    context.shapeRef.send({
                      type: "ROTATE",
                      board: context.grid,
                    });
                  },
                },

                "BTN.DOWN.PRESSED": "#board.Running.ButtonDownPressed",
              },
              // always: {
              //   guard: "cantMoveDown",
              //   target: "#board.Running.BottomCollisionHandling",
              // },
            },
            ButtonLeftPressed: {
              on: {
                "BTN.LEFT.RELEASED": "Idle",
                "SHAPE.LEFT.FINISHED": {
                  actions: enqueueActions(({ context, enqueue }) => {
                    context.shapeRef.send({
                      type: "LEFT",
                      board: context.grid,
                    });
                    enqueue.raise(
                      { type: "SHAPE.LEFT.FINISHED" },
                      { delay: 100, id: "leftFinished" }
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
                "BTN.RIGHT.RELEASED": "Idle",
                "SHAPE.RIGHT.FINISHED": {
                  actions: enqueueActions(({ context, enqueue }) => {
                    context.shapeRef.send({
                      type: "RIGHT",
                      board: context.grid,
                    });
                    enqueue.raise(
                      { type: "SHAPE.RIGHT.FINISHED" },
                      { delay: 100, id: "rightFinished" }
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
          },
        },

        ButtonDownPressed: {
          on: {
            "BTN.DOWN.RELEASED": "#board.Running.MetaIdle",
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
            NEW_SHAPE: "#board.Running.MetaIdle",
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
