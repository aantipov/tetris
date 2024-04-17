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
      | { type: "BTN.SHAPE.LEFT.PRESSED" }
      | { type: "BTN.SHAPE.LEFT.RELEASED" }
      | { type: "BTN.SHAPE.RIGHT.PRESSED" }
      | { type: "BTN.SHAPE.RIGHT.RELEASED" }
      | { type: "BTN.SHAPE.DOWN.PRESSED" }
      | { type: "BTN.SHAPE.DOWN.RELEASED" }
      | { type: "BTN.SHAPE.DROP" }
      | { type: "BTN.SHAPE.ROTATE" }
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
      { delay: 1000, id: "_autoDown" }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EANgAcAFhIB2AIzTJAJgDMATk0BWFQzUAaEAE9EKuWpIaN2tQ2l3V22+IC+ro2iwQSASQG8XOgANvjEJFQEAIJk9MzCHNx8gsJiCAC0DFbaiuIKDBoKCnLi4tIM4kamCPlyWeaFkhrScuoaknLunhjY5ACuAgECUGGkAApRAKo0jCxIIImBKfNpRdriJJIMzspqZQq6VRIqkiTStioqZefaCuZdIF69ZANDI1MEAPIA+gAinwB1IizBKcJZCFaISTibQkdSXOzNaTScTbI4IZwbFT5dQHMoacStB5PHwvQZcYZ+CDBMCjCIACSiYwoJAAMhQAGIEEhjShUGi-EHzRbJCGgNLSbFw0rQlS6OXIuTou4FTbbMpyORNdZNYk9UmvClQKk0ulURnM8i+ADi9O5vOoAqF7DBotSiHaGjhcmUcrUmv9hOVaiUZxRcp1imK0j13n65MpvmptMIpHNTJZ-yBPL5Tviwtd-DFojMBysBSKDBk4k0Ki0yv0WQUzWh2nO4msxVjz0NieTZotmbInzGzoWheW4o9zThdekxTkNgUamkGgbzasksK8O3e27BoTxqTptTDIz5E+0QIFDHIqL7oQUlk0a2zkKWn0Dbl8iKak0DGKbRJBkfd4zeE1aQ+H4s2BfMXSSe9IQxIoSF0KsFDyWwANsdENDqKwEVROVmyUNwPEefUwKNCCcFvCdi1WfQ5HkJF7HWHFzgbGxUO2VoGH41Ftm0UCyXAvA+h4HhBFZMAADMeDGTA4FgSAB3PdkuXICh2SiPM5ng8EH1KSxxD0Jo1mRZclRMRBl1DZEawYH01DlCwRN7Y1xMk6S5IUpTYBU3B00tDTuQ5XwiF8c0KEFODxwQycSwQK5TnVK5zGcDo7GkZUHA2Zp1DUW46juFR3MPEgvKkgQZPkxTlNUqC-kBWD9PiwykP2EgFGhDCYSAjCq1yvZN0K4qAMucqxIk6qyC4KAAAs-Ia3BT2ClkyBtO0tJ0vTQQShjbMuWRURkBU8mM7RlWOkh-WsDQKi1Uz9Cm6iqsEObFuWgLVPWq1bTCiKovpGK6IOh8lC1TY8I7Qkt1KYb8slP9xtK17KXegRPqW+qftwJqYLBjqpxqO4NlRc4ihbIqrpsmo8tGlHigmsryJJKiMZmwRflQAB3ARccCtTLRgnaKF00G4rvRK0lUFQSDyc4Hq2QkCtwvJuqKmwtGhewV3RzyuYEHn+cF37BxIUXwsi6LYra6XDoxfDtmAgNty0HK6c1L1-WXApkWAyVJANyqjZNgX-KFom3SQooN0KEN+NqPZgPRYDYRaGsCUJXRFxD35MFQNg2CNHBfmHMYImvMZvgAYU+ABZMZ2WvO39uJpKimhb0Vx9cx1FMz3qg97r9haAoQzbYO2co0TqILouS+GWipfoiGgOY8olG0ACihrYov3l5sTnWX11hDEO8FQbyAFta9QYJgi4bhBHpdABGpUuiAoAFvnW6PEIk2XASOEeE2yonATCZUBwsiUz0FqFQ5xNDT26HGOeGNr5STvg-J+L8BBvw-k-Ze1tgaS3tmvJCehtBelXAUNs90mLQPjoubYzYHqairKBMY6A+hC1PHySYDcbyr3BrHZEsJlaXAwuUQkKh0SmVOEgy41xnB3E6DPOM3DeGNUmF8ZqQIAEy1sjA7qOJ9DQkkG2QwdMUSWAjNCecW8ioKFAhyCkz8FqqX4dQWghjHb5CcqhOQtxKx2DhpUOmdYsh5CrCUbEio-yuPcbATxuARCwB4OgHgYASDoHkmATAAAKHe-EACUOB2ZuICCkyAfiIb8UsAcSURQri2E1BE6o85okRk1H1WRpR3DkQEKgCAcBhAknbjHEm6RlDZFyPkQoxRSjImVN3VcuhrBbB6jYDooF-CBBCJMwBSUOywI0HWGQqgMLWOqGoSxCsIymT2MofQZFUE9kPEcoxNRCTlkWVWWx5z6x0w7AoTYig9g9WhPiDQIdjxgC+Y7d88hVHIk0JKDskhoE5FHiuFEBVCTLkvkbWq31AqIofCiZizg6zKPMPxIetk7CWFaDIB62JLgEjUMS7yWN5o40jpAClscGgKweruMyipgzbE3DCco2wlZdg0R86avLw5mwgMKkmusSD8VuEBBwLRlxp2RLdGQux6XRnUe8g84EF7FyNFqzudyNg9QsE9UoNYay4RAciWlFQYTbmtRRNBHlKqYNQNgx+z8iwEM-sMJ1qxNSyEQfkDUQE7nGrpmsaJvpiIAXdTGZVPgtHkoLKIoBLlYTUNyMoJoeLGVOy9D1KQLlA0n1ZjakgVSPFCvLR3VYtZNgYVTcBGwLt0TlGbT06w-E+5FvcEAA */
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
            "BTN.SHAPE.LEFT.RELEASED": "Idle",
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
            "BTN.SHAPE.RIGHT.RELEASED": "Idle",
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
            "BTN.SHAPE.DOWN.RELEASED": "Idle",
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
