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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAVgAcJAJwA2KQHYAjAGZJygEyqZigCwAaEAE9EqvYpJy5mmRvHrNeyXIC+ro2iwQSASQG8XOgANvjEJFQEAIJk9MzCHNx8gsJiCIqqJBZ64opSNhp6DIYmEnoyJJpSDJIyynqakuXi7p4Y2OQArgIBAlBhpAAKUQCqNIwsSCCJgSlTaTJVVnI6FuKaNlKSRqYINnJWRXkyuvKa9a0gXh1k3b1QfhDBYAMRABJRgxQkADIUAGIEEiDShUGgAEQmCU4syE80QelUmhIklUchUeQY50kDkUO0QynEdkqkgYig09UU1jsl2uPluPS4fUez1eVA+X3IvgA4m8gSDqBCoVMZsk4aA0tZZIoNjYTuI5CcyfiEMpFAwKhr1Sp1poGFplLT2vS7kyHr4ni9CKR2Z9vuCAPIAdSGoKF8RFMLFqUQmkaWSaupkegNcgYqhVygYNVkNQY6LDclJziN3i6jOZFtZ1vedpI4LIDsGwvYXv44tECPEDBI4mUKzyTXVuSqkcJlnr5jsSY0G0kqZupszlrZHO+heiBAoJemZbmEsQAFodBU9BYtOpo8oXJHVESrOdCXJO0n0QOTRnzSPRgQHQB9R0umei8s+hDL-SVFa6xGSWqo8RIzDaQNnJGR1mcNFz3Te4WReZ85wrSUY00PJFFOEM1W0SNxGcEg0RxOQchxPdDQ8K5jRgs0SDwToeB4QQfjAAAzHhBkwOBYEgUc8z+QFyAoP4ondSZSySV94QQbQazRcwagcRUowsIDckqBV0JWJooyxaCGVg2j6MEMguCgAALNiONgLjcBzW1OTIHk+QEoSROhcT50rBAGlrNV1SIxZCR0ORI2TSoimUbdUOKKk3HIukqOZAyGIEcFUAAdwEdjOO42yx3zZ1SEoFyKEhD0xNhN81yycQ6y1RZFQYOsVUkckSE7GqdCxFxGl0ocHiSwRUoyrKrO4hD3KQgkGkseMbHDTCNhKXZwOUSoMg0aw1X1PJesvGi6OSobMss6ySCiNL0ECPojp+QQoHBMBgnQYwcDs+0CpIf5fCIXx2RK8aKsk8lxBIRQ8kJDQ6hcEMVXAvRQapRqFBsbQdF2-SDsG9LjuynxzsuvhruxqhTNQTAeAep6Xre-KXU+77fref6ytnCa3yjVqQxxKNqxqBRtlKBA-wqdEW3UUk6zVdHqPBTBUDYNgzRwAsiwiKdBjvABhB0AFlBj+KdStE1nAYXdJJGRMk7Ag48yQjQWtBUML-0aupwNUVRpeZWX5cVvocAB71JIijJ8NUDIOaOaw22rWQTh7RNorIto0z06i8FQQyAFtNdQYJgi4bhBDedABCeJWiAoJ07zewOJLNwlbBIfULdyck0SIyMnGkasIqcHINRa-s4sotPEszhic7zgui4EEuy4L-2vp+v6jbc03PMJIpZDXPnf1QzuHejaRaijbRFUaRrFGgwZ0E6azXlBEYdenFmXw8tItA1Zvww2dY4YxCqfYhwyRg3OOpQk0F-hMkLqZHK4RQS0Drh-MweoUQqEDGoGoXYVTmGRB7BoOQFSKhRlAmBsA4G4BELAHg6AeBgBIOgViYBMAAApeYMAAJQ4HitAgIFDIDIMmggD2yJ6hqDAuBRqtQVRrnhosLSGDciqH1O4ciAhUAQDgMIOk68g5m0XM0LI65tCkhbsFQWVR4aommtkEiDRPYjzTP4QIIQ9H108jKZuu8wFolyOsAWuwQwVAUUUGqhIThwy9lAdxKD3xrksAkjcZjtwWN2CoeGotyR+kRAoXI0S4KxOERDfCeoPakjDOhJqDtdRWG3OsOM4Z0KaAKQNAQTFWIjWskUyqLUsiNBUeqWoNUpAqWkFGCKzRcLh3DK0zGAhjJmQsrjHpwdoxhWPOHdEaIqjKBkCFBUtYFQbFmns3IycKKpz6vtQyKVsZdMgKss25RMnVnVL-NUio8SC1JGItCDh4x6lRNfJxg49ptKOg8vGF0rr3Wxrda6j1npPM8rhZECgyTRiRJ83QsNt6Ij9BkIi6Fw6OJTmCjGtzIUnUgGdGFhM4UZRJmTCmSLdjlX0ZvRqmRSRaCIbYDUh9loOFBjVE5tQVhygKT7BWZoUVpD-JbRoxCiLaDUGkgkhJVoqAvr3BURIZCtInqgKe+dC7lnnuXPo8qpqflyIGeM25ih7LbEiNqqEXCyXkN+G+d9umejZms9Ush1hqD0GGGqDRAkSHUGFZwnrapIliuSnwfDYGPIDRvT+xQKhRiaEjFQW5AKCzXH8-NDg-zxjqCC9wQA */
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
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                  enqueue.raise(
                    { type: "AUTO_DOWN" },
                    { delay: 1000, id: "autoDown" }
                  );
                }
              }),
            },
          },
          entry: enqueueActions(({ enqueue }) => {
            enqueue.cancel("autoDown");
            enqueue.raise(
              { type: "AUTO_DOWN" },
              { delay: 1000, id: "autoDown" }
            );
          }),
          always: {
            guard: "cantMoveDown",
            target: "#board.Running.BottomCollisionHandling",
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
