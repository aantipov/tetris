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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EANgDsADhLiAnACZFAZkWSAjAwAsAVg26ANCACeibTpLyGkqfO3zx08eI0BfN8bRYIJAJICvFzoADb4xCRUBACCZPTMwhzcfILCYgga4gwk+pKK9hqK0tra4iqSxmYZDLqyGnryKtK68rr6KuIeXhjY5ACuAoECUOGkAArRAKo0jCxIIElBqfPpGpKtJGrl4oq62pIqNiqViIVlJAzKtfXShw5dIN69ZANDI1MEAPIA+gAinwB1IizRKcJZCFanaTWTbyeRrDQqFTaQraE4ZFRwkiSfRwpQOA5tB5PXwvQZcYb+CAhMCjEgAGQoADECCQxpQqDRfiD5osUhDQOlCZsNNJ1ooGNJEXpFOjCopxNjmrVlHdpIpiT1Sa8KVAqTS6WQ-ABxAASrPZ1C5PPYYP5aUQ8mhcka6gYKhaUvkcuUipkuiyzgVGnkmp8-XJlL81NphFI-yBbI51oSvLt-AFokQmN02O0TXsuia0mc9TlGi0VikKpD6nE2g1nkeWojb31sYivzInzGNoW6eWgtODElm2UyhR6rUugqpmHSM22mctgYThLyLDzx1UZjhs+MQIFD7fIzDoQbW0VkkkhKTucrUy6McuaK9bF5Rn8lsm+1kb10YND4fgTYFU1tZJT0hBA1xICx1URFQDEQ2cqi0IpNkkS5nADcQZx-VtdXbHBjwHTNVgYStr0RetGjyEoUOHL8cgsVolEafMNybEkCMpPA+h4HhBHpMAADMeDGTA4FgSA6UZFlyAoRlohTOZwPBM8DlkaQbElBR9n2VwfSxXQJQaawmhcfCyTbPiBKE0TxMk2BpNwKhTWiMYKAZZlWSZPwiD8NyKG5MD+wgwcswQCxFXrJxFAMREtFFOUCxIddxwaGcpCs7c9VswSBGEsSJKkmSgL+QFQNUsL1KgnE6hHCiFBDA5vTnDFnXSicWhnSQcr-Eh8sEMguCgAALRzStwONyBNc0FKUlTQXCsjHQONKZGcYp8xDDoUssKR1Gfd0TL6riW2swihoEEbxsm5yZLcjyvKNM1fP8wLTWCkiVrPRE8guLRMJaJ19JSzrbgynrbDO7pw0u3j+IK26JpKh7cHKkCftqodqhkbFNH2TD4JDNF2sRCG1G61pr36mykcEX5UAAdwENGXLpECFooZTvtCk8IvSYp5DSiwR2aeKCVldr4UkF17wMfR8hUOmroZgQmdZ9nHvczySC5vyAqCkLqoF1aMlRORoRMpCGGsGd0TyOWi2RQp6gbJDVcRuyNZZtmnI57H7SgoG5Y6eElGKdQZHRZoRd2CsigbVx4pV874dy-XMFQNg2F1HAux7SJDzGb4AGFPgAWTGRlDxN5accirQPTkBLtNaGpcKfFu7auexheUWHmwzgbfmz3P86DyDcYQxUPQUPIF8caQ5UuRQSAlfJ1HqXCOkbOGtwGvBUDsgBbMvUBCEIuG4QRTXQARqXzogKABb4ns8qfBdON1YXhWoSy6BsMUcsbQxySgVHHREOgvZ5RPoJc+l9r63wEPfR+19hg4ENp9PmptSJ-RkBoC4Up8yNBDF6csygchZA9GsHEuROjp16GMdAfQOYzQ5JMSuR5+b4JDltC4jQU5rlcAxDIm9sSKDFjsOESFQxMN8CwthZVJhfAqkCL+5sJS3CsEI68zQSzN3LLhOQpQAyqBKHsfY+EmQUhvmNGSHDqC0E0X9BErd6jK1yPVdE+ZFR20KAAwohxkRD24rYwIsAHG4BELAHg6AeBgBIOgMSYBMAAAogEjgAJQ4HCXYqJkBXFQThHPQM-oiwBhDOiEyKgN5fluPUf+S4zpNgEKgCAcBhAkgbsHGehQchrHyCiJOpRyjomQrBGwLggFOADA4bQ+EAhBFCL06ekUnB1IUM+eKdsSHSyqA4WQ+RCEuGhHYA4sC1nfwQKEvMBY9DFlLGTKo9ZsjumRCUSUBxMSwPbNc82EcciYmDBRTIpTQG5jUDYG8q4qKlD+ddIq90XIArPHsOpHQ2jSlqWWcm+RsiOCuCWWwzRfkKJ4nldWKMUWQDRSHEMIsKwOBMjoHEooxHQOyBYfI0p27QncBShGVKfaa39lNeluNmhEMxCxewaoxSx0rDbABDY2j2z+WPHOedhiSqbmsS8QD-p21XHCA5jpHCwRMvCLQ+g3aMIPr+Gy8DUCIKvjfDMaCn66rTL9EO7RdFSJBlKFoGhQHZADNYRWuwyX4SUai31jd0gSlXFWVcsyvz1ReT-c4a9rhLjuEoGxBTol6tWKZTYTgQyZAOPoow7UbbYgaXvfY7d5EeCAA */
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
          actions: ["rethrowAutoDown"],
        },
      },
      states: {
        Idle: {
          on: {
            "BTN.LEFT.PRESSED": "ButtonLeftPressed",
            "BTN.RIGHT.PRESSED": "ButtonRightPressed",
            "BTN.DOWN.PRESSED": "ButtonDownPressed",
            "BTN.DROP": "Dropping",
            "BTN.ROTATE": {
              actions: ({ context }) => {
                context.shapeRef.send({ type: "ROTATE", board: context.grid });
              },
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue("rethrowAutoDown");
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
            "BTN.LEFT.RELEASED": "Idle",
            "SHAPE.LEFT.FINISHED": {
              actions: enqueueActions(({ context, enqueue }) => {
                context.shapeRef.send({ type: "LEFT", board: context.grid });
                enqueue.raise(
                  { type: "SHAPE.LEFT.FINISHED" },
                  { delay: 100, id: "leftFinished" }
                );
              }),
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue("rethrowAutoDown");
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
                context.shapeRef.send({ type: "RIGHT", board: context.grid });
                enqueue.raise(
                  { type: "SHAPE.RIGHT.FINISHED" },
                  { delay: 100, id: "rightFinished" }
                );
              }),
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({ type: "DOWN", board: context.grid });
                }
                enqueue("rethrowAutoDown");
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

        ButtonDownPressed: {
          on: {
            "BTN.DOWN.RELEASED": "Idle",
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
