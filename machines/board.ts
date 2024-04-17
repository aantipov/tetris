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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAdgAsJBuIBsARgBMcgJxKFcleIAcAGhABPREp0KSkgMziFlhjp2zJmgL4uDaLBBIBJAby50ABt8YhIqAgBBMnpmYQ5uPkFhMQRxSwspAFZxLJ0tM0kGSQNjBCzJVRIlPPtVBUlTSqy3DwxscgBXAX8BKFDSAAVIgFUaRhYkEASA5KnUhQUsuRJHLIqdSzlnLKVSxAKLLMslFUlJdeVxVpBPDrJu3v7RggB5AH0AEVeAdSIJ+KcWZCeYHBgZY67HSnVSVU77cqVaq1HT1Ro6Zo3O7eB49Lh9XwQIJgAbhAASkUGFBIABkKAAxAgkQaUKg0T4AqYzJIg0CpBxVJSqOSorIKYXCyTiBFLHIkY6WSQ6MWnaEKLHtHGPfFQQnE0lUClU8g+ADiZKZLOo7M57CBPJSiGOKzs4nUjUVZjkchlWnEq3UGJs0LkDFUGq8XTxBJ8RJJhFIhsp1O+f2ZrJtcS59v4vNEJlMFgxuyFzg0ocsMoY9hIqnsDDk8gbjiVEfu2pjcYNRpTZFeg1t0xzcz5iAuDHlmmseSlDByNRlS39U8q+QcyhFba10d1sf1CfJyfIryiBAog+5ucd5VRJF0W0s6nkkjkeRllkWJDsClkqmsawUHQtyjJ49RJF4PlTf4sztRIr1BBAlSyEg1FsKxdjkSxlX0IxECWMMLAuDFVHEN1dFcdxbk1ECdTAnAL2HPN+RsVZGlUMwSIxGF302CxQzrRpliyVRYWA3FQLwToeB4QQaTAAAzHhBkwOBYEgbsjzpRlyAoOlIkzSZYOBa9Fl0CxNHSEicjyBdcIQJY1GqUN8lySw7HqMSO11STpNkhSlJU2A1NwCCvl+aDDKHOCR3zeytmQ7YVFhc4xWEys7IUeQMhhETwVVZQWko7EaIJHyZIEMguCgAALALVPUg8k2NMgzQtHS9IMwFoqYiQlkyEjvQqLQwyyX0zJFJQGGUYoimsa4iuo8TaLKwRKpquqgvU0KoIY7rr0VZDhXFcURXOYsZV0FZHAbRYxUutRPJ3EgVoET5UAAdwEZT6twRqexIKD2oofSKA5GCouMhDziOMUwzdJK5wUBEdDMqd1kfBhTAKR6JKk8q3s+77NtwXbIdHezGn9BthsVRYzgRVQxWqdIvUUcQptyHHlrxwQCa+wLgpISJ3vQAI+j5mlBCgT4wCCdBDBwJqU3Ckh6R8IgfENUHSYdBDdGQ0jUo4wDtiRuzGekUjQyErQlDc8MFsjJbSp516Pv5n6hZFsXpfdqhqtQTAeBluWFaVgGVbVjWtbByLLxihZZB0czlR-LJq3yN87IFFDcnEO2HERzKuYJT5MFQNg2B1HBPj7QZwjPQZ3gAYVeABZQY6TPWOurJ2LdCUGQ3WVJQXx-dIZSUFjR9RNZ6kZtyS91MuK6rvp6PB+OevszKMjc9Jx6KeQfQy-DaxEkV8gbYobCX57UF8gBbZvUCCIIuG4QQyXQAQiWrogKA-HeErHW8FyZLCFDIQCNRSKbG9CUDKM95RTWUClMMKMgKO3bE9PAD8ZLP1fu-T+Ahv6-3fuvKOmsyTa03oxEyFQJzJXsNsLCU9thVhrKiH8ds1CmDnPNNokZBjoE6MFUkrIRht3PLQvaCEGgXFrPYU4mgiiNj2HZQ4FwThnAuCqARVEhEiLEdtcKoCE54UylUdmllTpuUyifMoFwqhiiDKneQjN1RYO8PSfEH9qoNTCKyWgZjt4nAnCjQClgch2OWOlMoQpk4qCmq+MUmh7DAR8f4WA-jcAiFgDwdAPAwAkHQIpMAmAAAU6dqwAEocDFUyX4yAIT9onBIA0WwugRLpzyKoBERRpBNCKPPE4ypFRuEogIVAEA4DCGxL3XW5MAC0TMKhKjrJNdIYZKgyj-LWawDR8g1HyPUOQwE-ABGCAssB-dB5znsFE9Yf4onOARAc+U3oSIeiXDNJe1zzEICWRCM6GzZDuUqHE3q0hGzWT-NYz5d89xgH+dvMw5g2GvnZg2E4MoLiD3cmKEUzCNCFUEdg3GvkBByUUkTYKKKTKAXMBiaEdsXxmCTr6dY7ToTghFGlSwd8XprVqrSyA9KEJ3VrGoY4pE3JT3FBdGsdZMbsSVGodIpKDHku5pSvmoqIDivJpUaF6csUnHsSRZGmN2l52cFoWJf5BWuz1QLSAXtRZ8HFu7SW4tZby0NbFCog9XyyGrOa9x0pzZFAsNo9I2w3TWAFV4kq3lnXu31e6n2fN-aB2Dn6soRlFmxTThkRwqD1hCjDOw82xw7wVucsKLYQo74r0rjqAN-JoQyFMMseBdtbAOIsUzGwvD04OWEg7Ml24JJ4NQAQt+H9cykL-n0DteEpTSByMWG6LYFWnzaVcfID5hSYU1cVYRoixXZlkeAqJ-ozC9JEtYSaFQETLEHj+awDyDqTU8VO1WvjslXsLTc1IJFzCzRfG5SomUdl2SKIPXQVhNhYV0IXM5EygA */
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
          entry: ({ context }) => {
            context.shapeRef.send({ type: "LEFT", board: context.grid });
          },
        },
        ButtonRightPressed: {
          on: {
            "BTN.SHAPE.RIGHT.RELEASED": "Idle",
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
