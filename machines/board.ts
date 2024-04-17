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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAVgAcJAJwA2KQHYAjAGZJygEyqZigCwAaEAE9EqvYpJy5mmRvHrNeyXIC+ro2iwQSASQG8XOgANvjEJFQEAIJk9MzCHNx8gsJiCIqqJBZ64opSNhp6DIYmEnoyJJpSDJIyynqakuXi7p4Y2OQArgIBAlBhpAAKUQCqNIwsSCCJgSlTaZKqyrJL4lUMippOjUamCAC0yooVNcpyRcUKS3KKrSBeHWTdvf2jBADyAPoAIu8A6kQJglOLMhPNEPtNAw5CQVJo5Es9Dk5PVJJpdhJobIUbUbgxVPjzG4PPd2j4nj0uH0-BBgmABhEABJRQYUEgAGQoADECCRBpQqDRvkCpjNkmDQGk9KpNCRFjcjuIGJplJIHIoMQhlOI7JVJBsNPVFNY7HcHuTnlSoDS6QyqMzWeRfABxRm8-nUIUi9gg8WpRDWWSbay2GTiOQyGQbTVHBgnXQbbVbBhaZRmsldSnU3y0+mEUj2lls34AvkCr3xUW+-gS0SILbSZw5LYyPSpuT4mMMGqyGrQ43Q-XOdPeTMvG158KFx3fMjvQbe6bVuaSxA5BgkcRnVR5JqKBi5Kox7WWbflFySDTwyQjx6W7O5u0Otlz6IECiLsU1-0HHQVJFwuo3aqnIMaqDqVgqtqKIInILi3CS5pjlaE44G8XwloClY+kk37gr++iVAiaxOOotSLOIMYdtI8KKLUazOKoxJtKOFLjjmtqfsutZpNRlR5Mcxxtkc2gxuIzgkExarnFIDhbreFpZtaeCdDwPCCOyYAAGY8IMmBwLAkBPkWHLcrylCclEFaTDhoI-toG5MeYNQOBGyjFBqpRagolhVDc8jqG23aaApyHUipakadpun6bAhm4OhPz-FhNlLrhK51ggDCagwoVsShEXqQIZBcFAAAWMUGUZ+ZMiZZAum65AUJZ1nAulPFrrKW6KPu5wyCqDjyDGQ6VEUyiqpo+4WNYeX3spqlFSV5WVXFRmJZhXHtT+2VebliEZvl4ULYI3yoAA7gIelVbgNXTsWyVNS1FDCthaV2fhSJZOIW5xsc8JRlumqSHRJDbt9OjKi4jSzUpJCFSd52XbF8U4Jt72rlqDSWNCNj4sJ8IlHsYbLJN6hnCi+6KjD47wwIp0XVdq0+FEZ3oIEfT0wI7KCFA3xgME6DGDgd0kJhJBcr4RC+Paz1o36+F0eIsJ5NqGh1C4baamGejKx24bhlsqg6NTBXHXTiOM-FJAs2zfAc4jVBlagmA8HzAtCyLYsS1LMsvalX4ZWk7kg22aruUqNQKJIQO1FYAnaJeB7jQhLF3rD3yYKgbBsFaOCzvOETvoMnwAMLvAAsoMnLvn7bXo5ldGyhsdgMSiGyqDGk0k84dgHnUYZGyb1IZ1nOd9Kjr0Bx1WpHJkRsZMHRTGqBXnjUqsiRnBLjQh5ab7axc1w6gkUALYl6gwTBFw3CCIy6ACLSudEBQfyfHdct4RjSYnBNuR0Ux5xO4SSVONJw647B0SHspY+6kz4XyvjfAQd8H5X3Ht7aWjJZaT24j+bURRZBIkjtKNExpCaIHcj2Wo7ltARkaAeFOpJRyDHQJ0FGNUBQjHLh+bBW18JqDgpuc4W8bhFBDJqQ4NxKi2FcpNLYSJB77w6FyKk18yrVXCAKWgH9A5mChHKFQTQtwEkWOUTU5hZRGwaDkcMEYbAhUUT4ZRARYBqNwCIWAPB0A8DACQdAOkwCYAABQRwYAAShwEhJxqjIDaOnkbWU9Q1B0UjEqKQMhNRIh1v1JoRxVS5AJHvEkAhUAQDgMIc0dd5YY32M0LIFgtBARTC4cRRsNz4jDPCOCKglRIlCv4QIIRKmfwbk3QhPUaG5DWNHLybYKjZKKN9bUkZtZQKGTog4AE6mAX1E0leex9jAyyMstEVRnCbD0MxRhad2K5jWdPVWkkoRG31B2Y4gNV4kSsHkqEOydz9SgXDM2mkdKW0gHcn8ZysiNAJPuei31pl7DOFIUGKZ6hhnEjufEALaZLQqqCiA4K+HdlGiiHcNwmJVGUOk1e0lNwGw7NYKluQ96p0UjTM2nN8WEoxuUHWCgNjdhlEcCMnk9j6gSQJNsNhww6BZVctlptIrmwZsjSA1tWbs15ojbmHN+aC25ZlcSsp+X7nxCqY0ugtb4OlFsDI5xjg7lUNijlFtVXMw1XbLVF1HbO1dnqvYtkqmZXDpkfUWhrG2DjIAryA9YTfXhDUAKNgZAApHtnK0BqFhohIJDGx5xtD8OPFuWEZx+ogP1pGbFMDUBwMvtfGsyDH59EzeQ7Im46LrhxMUKlx4ZSg0mi4Jy8hiKhWYawsFVZeFfycBuGQTEjiXm0IrMhBxtibh0OJeRtr9ROoceLFRLiJ2BuGUHYoFR3JNAPAqYClEZkNFBh2g8ZFoR1AQu4IAA */
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
