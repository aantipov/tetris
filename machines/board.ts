import { assign, setup, ActorRefFrom, raise, cancel, StateFrom } from "xstate";
import { shapesTypes, type BoardGridT, type ShapeTypeT } from "../shapes";
import { shapeMachine } from "./shape";
import * as Haptics from "expo-haptics";

const initialShapeType = shapesTypes[0];
const initialShapesTypes = shapesTypes.slice(1);
const BOARD_GRID_ROWS = 20;
const BOARD_GRID_COLS = 10;
const LONG_PRESS_MOVE_DELAY = 20;
const AUTO_DOWN_DELAY = 500;
const DROP_DELAY = 0;

interface BoardContextT {
  grid: BoardGridT;
  shapeRef: ActorRefFrom<typeof shapeMachine>;
  nextShape: ShapeTypeT;
  shapesBag: ShapeTypeT[];
  score: number;
  linesCleared: number;
}

export type BoardEventT =
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
  const { activeShape } = context.shapeRef.getSnapshot().context;
  return activeShape.every(([r, c]) => r < 19 && context.grid[r + 1][c] === 0);
}
function canMoveLeft(context: BoardContextT) {
  const { activeShape } = context.shapeRef.getSnapshot().context;
  return activeShape.every(([r, c]) => c > 0 && context.grid[r][c - 1] === 0);
}
function canMoveRight(context: BoardContextT) {
  const { activeShape } = context.shapeRef.getSnapshot().context;
  return activeShape.every(([r, c]) => c < 9 && context.grid[r][c + 1] === 0);
}

function getFullRowsCount(grid: BoardGridT) {
  return grid.filter((row) => row.every((cell) => cell === 1)).length;
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
    events: BoardEventT;
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
      if (canMoveLeft(context)) {
        context.shapeRef.send({ type: "LEFT", board: context.grid });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    moveRight: ({ context }) => {
      if (canMoveRight(context)) {
        context.shapeRef.send({ type: "RIGHT", board: context.grid });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    moveDown: ({ context }) => {
      if (canMoveDown(context)) {
        context.shapeRef.send({ type: "DOWN", board: context.grid });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    rotate: ({ context }) => {
      context.shapeRef.send({ type: "ROTATE", board: context.grid });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    setNewShape: ({ context }) => {
      context.shapeRef.send({ type: "RESET", shape: context.nextShape });
    },
    setNextShape: assign(pullNextShape),
    raiseNewShapeSet: raise({ type: "NEW_SHAPE_SET" }, { delay: 300 }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EARgAcAFhIA2AMwB2AKxK5kgEwKpagDQgAnohWa5JBkoUBOcXKW3l0lQF8XBtFggkAkgN5c6AA2+MQkVAQAgmT0zMIc3HyCwmIICtJKJMpKDJpKdioM4toGxgjFViSS1pKSShlKWgwybh4Y2CQACugArrCQoaSUVACqALIUjCxIIAkByTOpCmok1so6Sppq1mripYhy4iokmrlyDNLSDLlFrSCeHQBiXP6wABYDhEPUtFPxnPMhItEHlLCQrAoFHlCtdTnJ9uVrOd5NVTGY5KdlncHt5nq8PrgRLAeOgeGASOgAGZkzAAChhDAAlDgcSQ8Vx3pA-jM5kkgaBUppJAoGCcLvk8ppxMtJPCjBJrNZZNsNJYFIdZZpse1vGQegJ-AIoIMupERjRuewAXyUoh1crtFsodVLuJrAjVMdCjVhZopVdZdqvOR9YaoCQxmAST4IEEwDgzQQAPIAfQAIkmAOpES2za38fmiCT5cSrSQqRVS2VI6UI8TXL07ZY5ORyNb2IMdPUGl7hyPR2PxxOpjPZujiaZWxIF20IU4XCyWa46YqOhR15qinbl5RmcT77Sd3Wh3sRqPoGNx3yDk0AGQojwIJFvSaIAHEU51hjQ07neTPgQQVRzAxa5JAYaxNCVYppDraRywsLYhQYDEVDkNEjxDHsjTPAcr0veMvnIHw3wACSfF930-b8KF-OIeXzBYBQkaQ7AsaQ8mUdDWJyTQ4IQ3JTHA1D0L9TDuzDXCL0Ha84xNUdSEoj8v2oH8-0YwtUlUUUhXAqDGmkex3XlcorlLSR6wPBRhR2cQlHEk8cP7aT8JvIi0zIJNOnU6cmKLcpxFY+RtGldRLgguo6yg44MnLexhREyQHOwvtzwI2TCLCe9Hy6Gi6MnPNfM0xAkVkCVWzWTZ0LrFR6xON1AvqDIVBsLV3HuHUsMk5z0oIk0yBI8jctU2ifMBWcYMyOoWo4wLnBUGq6qlWwMkuVQbGS7q0pkvr3KzUgVKoNT6KncbAJg8wWqOSCIVqFRYJM6URROdCLLdRp0PQzbTx6na3LCTyogISYTsKs7mPKWEskOFRwKaOE60hHTXv3awPrQ1x2tZCSfu2q88B4ARbzAalb0EKBOkwOB+lwIjsqfSh70iY6Cv-PzUhqBRwRWo4LMgjY60UTQSEMi4tlh6wLkg76nLx8kCaJkmeDJo1KepgYxiTAA1ChwlIyJOl1+mxptQCNRIWG3TUdC1msh6yjsqVwSOdH4OkJU2raYMcdlvD5cJsguCgN5lfJtXYBp-rBoZigmZZ-4iomv0ubsJFtF2e7rMFqERfOaQRS0Yo2xl1K-ZIBXA+D0PVapiONe13WqH1w3iLI2JWY0ia5GcKpJdi9tSrrTZS3yNQoTbNQZExr2u0c8MFbTVAAHcBHDyO9uzchY4oZnRtBtnioQVULDqZpGocWq9hMpR8nkBgdD5lrlmlrHOp9+fCcXle1-rnWUybg2FB0z7RNgBCGFRRQOA4oZKQEFFBKARN3WQ5Z2xbHqBcDIJdy6f2XqvWukdNZ-wAYbYBY4JwJ3Bv5aUtURYcUVIcOyapJAejdBYNCqhfTVG3FgtMmBUBsDYL2HAhCgHEKAQpUB7MJDpEyFBIomhWKHAcPfBE1RMiBUKNZVU+c0I8L4QIoRIj-7N3ESA8hDFE7nWWKWS4UEYEtVeuuEySJrAkECn6I4UIdDiywXgVAPAeCoAALYAGFUBBCCByAspF0ACFjEIoinQzQWn3p3c6jQuaQQrM4XIUFZROLKBkHSyxWKnGtq2NQvj-GBNCeEyJ3BBAxLiZE2WmAoBCP1kQNM95-4EAGgAaRBh3Sx4DHBuLsk4bcw8FomSUWKEsihDLzQUFUgJwSwkRKiY02J8TWntKNDgTp3TRF9J8IM8cwzKGCigsLd24otFtkOHKMoczTj5FYp42G1RVk1I2fU6JOyWnhiabsqAVAeCYC4AAa3jCEpmZAUyPBGLeW8KZPKZioJIw+VZLocXeTfdCmwEGzIcKsOBktDjaCcD89ZdStkCBBUC8IUY+BGiIGAJeVA3joDYPGGgBAUxEAoJmYxgCsWzkdMLDQ5x6igQhDMso6hZF1CeaxD5KEaW1M2Q0hlgLTxUBZb2dlnLuW8pwEKkVYj-6-FSSM-y2g0Yi3rBxO2KgKymERkULI+Sji5BqFIaQmq-n0sZfqw1bKOVcp5fGC1oqSH8ouRQ02EMynCxQlWZ0brDgFOkV6rROhCh5IDW4dqAhUAQDgMIHESawFULyBbWUUDJSwMhAiaKJwSnSiuLNDar9gx+ACMEGtUjyiqAbUZPFVZ745vKEKcw5ZTjSg0ddOQmFuh9EgMO7FOx5CtnRJZPI9hEEyCyBBHRpxtDd09h1YM7JOQQC3RKiy87orOCRNZdUnrSz5t9UWlofbZ4pUfYBNEDarbqArJCGQCJrLCysPdCoIolS5Cwb9OMwGIZqFFJbHYEHbbQcetKSQL1J6mCVQlVDcsMoYaoXYTI+cdj2AxMsPij187mFUIw1iNg7DXuxnPKS6UFbE1JmHfBm6LFXMQOoYjp9Cj53doShVEh3WrDzvWDELjmiUbLhXIOIcVYU3Ew+yTyaqHOFkFbeCbqb7duJQ7VTSILhIK0Fce+vicHf2MzR1I+5rgonYTWVOV9FWsOuIqCCUEdjOHEHo-hgijQ+YkMUVx+QRR5FsKiZTCBJainguBCldyH5BrpTq0NiXTO1t86oTIuRbGbBqGsFqCJTCpcsPWSe6oiMle1QC5puM2m9iS+UcCxw6uTsa8sGd9hLMMNODUUwUhrA9f+ds-rOFytgohdCsAw3F1cwMlYdQFT7PSf83YeswkuLVBWQB48KVy7VNpb1tboLmUBKNZG01u3KsjoUZLMlzQ1hvKFHYD053DibngRoNYJaXBAA */
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
                "BTN.LEFT.LONG_PRESSED": "BtnLeftLongPressed",
                "BTN.RIGHT.LONG_PRESSED": "BtnRightLongPressed",
                "BTN.DOWN.LONG_PRESSED": "#board.Running.BtnDownPressed",
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
            BtnLeftLongPressed: {
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
            BtnRightLongPressed: {
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

        BtnDownPressed: {
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
          on: {
            "BTN.PAUSE": {
              // Ignore pause button during collision handling
            },
          },
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
                    const { activeShape } =
                      context.shapeRef.getSnapshot().context;
                    activeShape.forEach(([r, c]) => (newGrid[r][c] = 1));
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
                    () => {
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );
                    },
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

export type BoardStateT = StateFrom<typeof boardMachine>;
