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
      | { type: "MOVE.SHAPE.LEFT" }
      | { type: "MOVE.SHAPE.RIGHT" }
      | { type: "MOVE_SHAPE_DOWN" }
      | { type: "SET_NEW_SHAPE" }
      | { type: "NEW_SHAPE_SET" }
      | { type: "HANDLE_STRIKE" }
      | { type: "CLEAR_FULL_ROWS" }
      | { type: "AUTO_DOWN" };
  },
  actors: {
    shapeM: shapeMachine,
  },
  guards: {
    cantMoveDown: ({ context }) => !canMoveDown(context),
    hasCompletedRows: ({ context }) => getFullRowsCount(context.grid) > 0,
  },
  actions: {
    raiseAutoDown: raise(
      { type: "AUTO_DOWN" },
      { delay: AUTO_DOWN_DELAY, id: "autoDown" }
    ),
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
    setNewShape: ({ context }) => {
      context.shapeRef.send({ type: "RESET", shape: context.nextShape });
    },
    setNextShape: assign(pullNextShape),
    raiseNewShapeSet: raise({ type: "NEW_SHAPE_SET" }, { delay: 300 }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAZgCMDEpOnjxAdgbiAbACYAHKoA0IAJ6IArOsUlNR8QE4jDI6o3j16gL4u9aLBBIBJAby50ABt8YhIqAgBBMnpmYQ5uPkFhMQQAFkUjEgz1eytVBklxNLTNNL1DBElTcVlNJQVFNMlFbTcPDGwSAAV0AFdYSFDSSioAVQBZCkYWJBAEgOS51LSrGSardQYVI1b1SV0DRALNEltWq2bVJUzxdpBPLoAxLn9YAAshwhHqWhn4ziLITLRBaVRmaotEqaerNBjlI5VfIycFWRSXRRyNKmTT3R7eF5vT64ESwHjoHhgEjoABmlMwAApbNsAJQ4fEkQlcD6Qf5zBZJYGgVLiQqnDJ2IyafKSTSYiqg7aqbLqUVqewWVSSKx4zreMh9AT+ARQYY9SJjGh89iAwUpRCrMwKIxFa7S0WqNKHSpNU6aSQuxTqKxlENaXVeciG41QEgTMDknwQIJgHAWggAeQA+gARDMAdSI1vmtv4QtEiBachIIaMVk2stUMvECqq2yydcsuwYDisakUEa6BqNr1j8cTydT6ezecLdEksxtiTL9oQW3hJG2yhUcmcThbiOkmhkNgsSnUWt3d3cDz1UZHJrjCfQSZTvknZoAMhQngQSJ+MyIABxLNulGGgc2LAUVxBBBMmVDRti9LZwTldRW0kUplW1BhNC0L0GEUBQdRvDlhxjJ8JzfV9U2+cgfCAgAJP8AOA0DwIoSC4n5UslmFSsrk3G5NnBA5miMDCMmVOxg2cNFj19Qd9WjUdKJfSd3xTM1Z1IViQLA6gIKg3jy1STIZC0Y9g1aL10UkwpzGkK96hsFolPvCjx3U6iPzonMyAzbpjOXPiKyqTDJBIRxtS9UoLwkw9TAhestllGx6xsdzyNUryaM02iwm-X8eg4rjFxLELTMQfI0hITEL1KOQ1GcBFKgDVVNwcNRVClRQ+sIrKVMfXKNJos0yAY5iSsMzjgqBVdqmuM4er6lpcMI-YMJMWoe2uBxev6gdSLvbLhufPKxr8gtSAMqgjO4pd5tgxb1BIZxUsItJ2zlDDrJIKRlAvTYrNwwaHzHc7Rt8sIAqiAhpgeiqnv4hAQysOrA3hUUvTwg82r+gGGCBrQidB47I1OiGqKpPA+h4HhBE-MA6W6TA4EGXA6KKv9KG-SJ7vK6DQtSENauuTYGCsTCpesTQMM9aTTGkL6YTUXFyaHIaqe8mm6YZgQmZZtnYA5nAJgzAA1ChwkYyJumt7m5rtWD8mVKRsXbbZCNUOXDyI167C99E+39NIwc8yG31p+nBDILgoHeHhWfZr4YcmnmKD5gWAUqhaWrONJLFMMMeu0eWvU3JX4Vw+offDnLI91mOBDjhOk+N03zatm27etiamNiQWTIW5RakapU6zE9DDx69HmS1VZSi9SR68faP9ZzVAAHcBGTk3U9IHTyEzih+dmxGhaqhBtFexxNlyCX0TxxALFOTtA+1V1MlX2N18ETed5707pbCgWYqC23trma6TsYIoyPKcUUthsSYRdClVsDhTh9VsOCQo6UyYdAplrEgf8BAAN3h3IYXdQHgN7lAucC4c7IzCrudG1hLBKFWAGbQ3pEBBlqoRJUKt1A4x-iQHMmBUBsDYKOM2ICwEQNATpGBwtKzFDMMGQowiDgtDWM-a+aJZCFxUNoY8aRxD2FEeIyR0iTSyKtvI2hSiGE8Vzs9cxkUSjBmXpYUuej8jo0ws4AM+5qhGCMKIvAqAY4AFsADCqAghBG5GWRi6ABDJgbpgKAMjbZEBzN+MBBAJoAGkEZD1cXAmWNZbDaAUE2LUdh0Ewn+tUYisoYpBgiVEhmcSElJO4IIVJ6SklnSyTkyIeSCkRBKdMZxj1nYozkrUfc+RnB9QsD2JpCDWni2lOtI6BDNbg2Id01AvTEnJMGWkjJj4hk3KgFQHgmAuAAGtUyxL5mQLMTwxifk-FmAK+YqDKKvkEsWBQGzBNMK2VadVpSZDlMiDQqgukxPiRcgZAg7kjNjFQBMfATREDAFvKg7x0BsFTDQAgWYiAUHzA4+2ILVwXm0P9K4pRrAOEyDCsJb0fbVAsIXcQ9QV4a2UscyJaK+mXKxdcnF4R8WjiJSSslFKcC0vpTQyBVKmWwS0acfYmwpYwi+qsDCopIrCuuAGImIZZRhzFR5VSkqenov6SkuVqk8X0yVcS0l5LUwaoZdQv4cykYLLClsEwnV9j1C0GErUeiigOStVIWwwZ-RlDcDeAQqAIBwGEPiRhEbUi5B2p2dhwimxYlbNiLI-pVQoNaZhFFjq-ABGCMW2BYULWbgrQoKtUtMK-VZa6WpeFuElHcr0AYkAu0qPSFobIrRpapQitPSo4IzALz4fkOswqHWHIJK8bkxJ51X1FD2N6chFoL09Bec1Kbak2ozfan+57VwOBROuZCPZWhBlbC6ZZrS1GrTKK4R1lM1I0Q-bBZQpxELwkQqhADh5pBZABuhrlXZ1ZHqdWdam+VYNwIOGYMxNhwSOBMJJNQGM1rNGsAcCDeGoMjSjnrRmzN24pwgMRsKrQEJmNKJ2dEQN5aSzOKYARrSWqiLY03fWrdE5ALnS4phqQW2RR9kRNQTVMiSHlvsZa-pVknDCeEyDRCSFkJU7xtTJaX5GfIzakwihkUGcROCWoTQpD5GlNcYooqWNEKsVI0cfGNPVHRpiUUxc0phNbGsGQpRjxrE9Lo2UqLXXSsxdi8L9nu0acyGYCw6IAzKDDGY9B2xHKqlwjp4M+QstnLdTKvLozskmgi5WY89bdhS27JVvRTQsgXmuGYvChFpAHNvIQiVpzznuqucM1S7WHlPNeWAbra5Chi1lM4AofVC5WBhZiPl1wVAZCkA25ri22uesfN6glUBlX+opdt4RUs6rFGFdo-0ygeFwTO2NtUV32kQbcEAA */
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
          actions: ["setNewShape", "setNextShape"],
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

    Running: {
      initial: "MetaIdle",
      on: {
        // TODO: Do not interrupt Collision Hanlding process with Pausing
        "BTN.PAUSE": "Paused",
      },
      states: {
        MetaIdle: {
          initial: "Idle",
          description:
            "Either no buttons actively pressed, or left/right pressed",
          entry: ["raiseAutoDown"],
          exit: ["stopAutoDown"],
          on: {
            AUTO_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: ["moveDown", "raiseAutoDown"],
              },
            ],
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
        },

        Dropping: {
          on: {
            MOVE_SHAPE_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: [
                  "moveDown",
                  raise({ type: "MOVE_SHAPE_DOWN" }, { delay: DROP_DELAY }),
                ],
              },
            ],
          },
          entry: raise({ type: "MOVE_SHAPE_DOWN" }),
        },

        BottomCollisionHandling: {
          initial: "Merging",
          states: {
            Merging: {
              on: {
                HANDLE_STRIKE: [
                  { guard: "hasCompletedRows", target: "HandlingStrike" },
                  { target: "SettingNewShape" },
                ],
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
              entry: [raise({ type: "CLEAR_FULL_ROWS" }, { delay: 300 })],
            },
            SettingNewShape: {
              on: {
                SET_NEW_SHAPE: {
                  actions: ["setNewShape", "setNextShape", "raiseNewShapeSet"],
                },
                NEW_SHAPE_SET: [
                  {
                    guard: "cantMoveDown",
                    target: "#board.Finished",
                  },
                  {
                    target: "#board.Running.MetaIdle",
                  },
                ],
              },
              entry: raise({ type: "SET_NEW_SHAPE" }, { delay: 300 }),
            },
          },
        },
      },
    },
  },
});
