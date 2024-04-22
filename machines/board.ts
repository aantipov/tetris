import { assign, setup, ActorRefFrom, raise, cancel, StateFrom } from "xstate";
import { shapesTypes, type BoardGridT, type ShapeTypeT } from "../shapes";
import { getActiveShape, shapeMachine } from "./shape";

const initialShapeType = shapesTypes[0];
const initialShapesTypes = shapesTypes.slice(1);
const BOARD_GRID_ROWS = 20;
const BOARD_GRID_COLS = 10;
const LONG_PRESS_MOVE_DELAY = 50;
const AUTO_DOWN_DELAY = 500;
const DROP_DELAY = 1;

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
  const { type, position, rotation } = context.shapeRef.getSnapshot().context;
  const shape = getActiveShape(type, rotation, position);
  return shape.every(([r, c]) => r < 19 && context.grid[r + 1][c] === 0);
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAZgCMDEpOnjxAdgbiAbACYAHKoA0IAJ6IArOsUlNR8QE4jDI6o3j16gL4u9aLBBIBJAby50ABt8YhIqAgBBMnpmYQ5uPkFhMQQAFkUjEgz1eytVBklxNLTNNL1DBElTcVlNJQVFNMlFbTcPDGwSAAV0AFdYSFDSSioAVQBZCkYWJBAEgOS51LSrGSardQYVI1b1SV0DRALNEltWq2bVJUzxdpBPLoAxLn9YAAshwhHqWhn4ziLITLRCmBhmRQKJyZbYMLaHSqSfIyVSaGzOBxbcRGe6PbwvN6fXAiWA8dA8MAkdAAMwpmAAFLZtgBKHB4kgErgfSD-OYLJLA0CpLTiGRbDLVRT7bHaCqIJGXM6KfKacFqSTaVzuB6dbxkPoCfwCKDDHqRMY0XnsQEClKIVZmBRGIrXNGi1RpBGIJqnTSSZ1SqxlINaXG68gGo1QEgTMBknwQIJgHDmggAeQA+gARNMAdSIVvmNv4gtE8sUchIQaMVk2GtU+SKcqq2yyNcsuwYDisakUYa8EcNr2jsfjieTqczOfzdEks2tiRLdoQWwYaRI22UKjkzic4mb0lVVaMFiU6lUcmqd217P1Q+NMbj6ATSd849NABkKE8CCQP2miAAcQzbpRhoLNC35JcQQQTJVBIDRtk9eFWilA9SngpEGE0LRPTVax+y6O8o0fMdXxfZNvnIHxAIACV-f8gJAsCKAguI+WLJYhXlK4NxuTZVArD1-XQxR4LsdRNkk1pwVKQi9UjYdSOfcc3yTU1p1IRjgNA6hwMgzjS1SGESC0VVpLKQSrHQwpzGkHdxHqGwWnkwcSNHFTyPfKiszINNugMxcuLLKpJGaBD1CkS4PRw1QjAPUwzAVLYNRsWsbFc4ilI8ii1MosIvx-HoWLY+ciyCozEHydcK3PUo5DUZxyiOKoTFqLtrgcE9FB68FMsUh8ctUijTTIGj6OKvTWMCoFl2qa4zjinqWmw8F9gPNqNwcNQ4s0HrlD7G9wyywan1ykafLzUhdKofT2IXWaYPm9RTOcQpZNbPaEqsR0VvPTZzOw-r7xHM7hu8sI-KiAhpnu8rHu4hAgysEhMhWtJRU9HD9xa6ofpIKRlH+rQ4SBo6BxO0GyMpPA+h4HhBA-MBaW6TA4EGXAqMK39KC-SI7rKqDgtSIN12uTYGCsMKpesTQDw9cTTGkNJsPqVFgfcsHX1p+nGeZnhWfZoYJjTAA1ChwloyJugt7mZttGD8ngqQ0lXJlwVRA9IReuxYWVHs-TSDXsq1mm6YZgQyC4KB3gNtnYA50bxp5ig+YFgEKrmpqzjSSxTBDXavSqBWNyVtdVbUTRg9O6mSB1iOo5juOjdwE3zct62LbGujYkFwy5uUWp6u2OKpY9dR5ZrM4R+l0pPUkavo3rwQs1QAB3ARDYTr4wk08hU4ofnprhoXKoQTUIusZway2ZUccqCxTnbX2kRdTJF7r8OV-Xzf48TtuKAZioFbG22Yrr22gojaQPYzjSTXBoXYuRmwehRmjVEUgay1lDOTIiA0l5fwEKvDeW9-5m0AcAzuYCZxzgzgjEKO5JCyG2LfNYOE0TNkhCjSKJ5qhdlyKeD+WZMCoDYGwYcOAAFAJAYAzSEDhbymKGYSShR1BXBaGse+iA0RJVziobQqoMb2EEcI0R4jJEUNAbImhHFM5PWxIwkokl56WF2popGDZZCu32HnKQuQcQ4IUiDOuqBdYAFsADCqAghBC5CWWi6ABCJnEVRbo5pLQn37k9VotRNg1l0c4IM1xmwZDFNiZoWxdgOCWh-PAISGYRKiTE7ggh4mJJiadTAUBxFWyIFmL8QCCBjQANKwz7rYqBMtZAtCUKsbq3jkEtFMuCOQ1xPS50sDUupqAGnRNiS0hJSSOldONDgHpfTyGDJ8CM2cYy6HCkki9VYa5ITaAbBeIuF4lHLOaP6GUaJNlhMibs5pAhWmHOjGC9pUAqA8EwFwAA1smcJfMyAZieGMD8H4Mx+VzFQORZ9nAHD4gGAOeELDIIcATLspQFCXB+tcAF9SgVNLiQcqF4Q4x8GNEQMAa8qDvHQGwZMNACAZiIBQXMUjO74uXJFZwCFtCyUQpCbEHDBKmT2u85oPyuyMu2cyvZoK2VKSoJy4cPK+UCqFTgcVkqLHkL+Bk8ZIVIr42aGuSKZQjDtgnrjUUjDHLXH9HCIMGog4BLckpWpgLGmGshSas13LeX8sFcmW1UrQEipubQh2iMKk+w0BqJwFh7BNj9bZQNGCQ1+jKG4bUAhUAQDgMIPEObIEussBudslgnCeilmFZskksjcMco5ewCgtQdAHH4AIwQ23yIQP6rtNge2qIbHIZqiItCYUrq6bdHpw1Tq6L0AYkB51n1dqcDIgcJYbuqMgnqCEwpSlWKPRyh6dQDk5NyCA57ZV+ngjhGwud8ijqLkUCt2gq2SRrR+28eC-0wQcCiVcyEuyoV9ZURyL1ISWB+jYBstZrxHsCZramiHEbKFOIheBKE9qYflNILIhMkIewcD1D+Q0vJJgo-Qg4ZgMYEbEtwhjVQMbwTRsoZo1gDiTs-bgoJXGw66wEEzFmf8z02Lud6bQCEMalHbMqf68tJawIOiopwqjOOh0-ipxuscSGaYerm+h88FUqovEUNG8t9iLT9Pkc82FvX+JI5Gh8y9CE-0c7+rTLnUj+dkNYOKUJthFFE9cR0J5zhOBsM84xIixHGl46kHcqCIP51St65sawZClFVGsFB24q4RspsEmNwLWVtOHMV8suxS6OMDG6SwzYTCoOWXYAoJ5JYhfk6RqNWydksv2V1o53XYvtpK6qLIcIBswZ7MNlqgl1wHB3JLCw+x-ktbwW1plsaQXxofA96FsKEVgB6yuQotRWgZCUFU3YHDtiyAvKtDLqIex6sW3G41D5TX03Ncmq1b31sLtUWsKs2w3S3y0AcAHMgTsg9+26OtLggA */
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

export type BoardStateT = StateFrom<typeof boardMachine>;
