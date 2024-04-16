import { assign, enqueueActions, setup } from "xstate";
import {
  Angle,
  BoardGridT,
  PositionT,
  shapes,
  type ShapeTypeT,
  type Shape,
} from "../shapes";

export function getActiveShape(
  type: ShapeTypeT,
  rotation: Angle,
  postition: PositionT
) {
  return shapes[type][rotation].map(([r, c]) => [
    r + postition[0],
    c + postition[1],
  ]);
}
export const shapeMachine = setup({
  types: {} as {
    input: {
      type: ShapeTypeT;
    };
    context: {
      type: ShapeTypeT;
      rotation: Angle;
      position: PositionT;
    };
    events:
      | { type: "RESET"; shape: ShapeTypeT }
      | { type: "RUN" }
      | { type: "ROTATE"; board: BoardGridT }
      | { type: "LEFT"; board: BoardGridT }
      | { type: "RIGHT"; board: BoardGridT }
      | { type: "DOWN"; board: BoardGridT }
      | { type: "DROP" };
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYEMAOYDEAlAogMr4AqA2gAwC6ioGA9rAJYAuT9AdrSAB6IAsAJgA0IAJ6IAjAE5pAOkGCAbAFYlkgMzT+-Df0kBfA6NSYwcgJIdWTNABtsAGXwAxctW4NmbTtz4INJSU5bWkVAA4AdkjpZQp9UQkEQX05cN0VSM1JNUksyKMTdCxLazZ7PAsAcQAJdxokEC8bX0b-SSV+EMFwyQo9PKV4yRFxRDU0pUVI8JVpPopo7UKQUxKrGwqAEQB5AHUAOUoGukYWrjapTu7e-v1Iof1RpI0NSLk9QT7OrPClfKMxhAHHoEDg3DWYE8Zx8F1A-gAtEpEogERoKHIlG9Il9+BRwrJFBQlCtIaVNnZod52HDeFIVBpMRQcqpXh0glMUclFHJIv1ieENLNYtJ-oCDEA */
  id: "shape",
  initial: "Initial",
  context: ({ input }) => ({
    type: input.type,
    rotation: 0,
    position: input.type === "O" ? [0, 4] : [0, 3],
  }),
  // entry: [() => console.log("shape entry")],
  on: {
    RESET: {
      target: ".Initial",
      actions: assign(({ event }) => {
        return {
          type: event.shape,
          rotation: 0,
          position: event.shape === "O" ? [0, 4] : [0, 3],
        };
      }),
    },
  },
  states: {
    Initial: {
      on: {
        LEFT: {
          actions: [
            assign(({ context: { type, position, rotation }, event }) => {
              const shape = getActiveShape(type, rotation, position);
              if (shape.some(([, c]) => c === 0)) {
                return {};
              }
              // Check if one of the cells has a filled board cell to the left of it
              if (shape.some(([r, c]) => event.board[r][c - 1] === 1)) {
                return {};
              }
              return {
                position: [position[0], position[1] - 1],
              };
            }),
          ],
        },
        RIGHT: {
          actions: [
            assign(({ context: { type, position, rotation }, event }) => {
              const shape = getActiveShape(type, rotation, position);
              if (shape.some(([, c]) => c === 9)) {
                return {};
              }
              // Check if one of the cells has a filled board cell to the right of it
              if (shape.some(([r, c]) => event.board[r][c + 1] === 1)) {
                return {};
              }
              return {
                position: [position[0], position[1] + 1],
              };
            }),
          ],

          target: "Initial",
        },
        DOWN: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign(({ context: { position } }) => ({
              position: [position[0] + 1, position[1]],
            }));
          }),
        },
        ROTATE: {
          actions: [
            assign(({ context: { type, position, rotation }, event }) => {
              const nextRotation: Angle = ((rotation + 90) % 360) as Angle;
              let nextShape: Shape = shapes[type][nextRotation].map(
                ([r, c]) => [r + position[0], c + position[1]]
              );
              let nextPosition: PositionT = [...position];

              // Move shape to the right if it's out of the left border of the board
              if (nextShape.some(([r, c]) => c === -1)) {
                nextShape = nextShape.map(([r, c]) => [r, c + 1]);
                nextPosition = [nextPosition[0], nextPosition[1] + 1];
                if (nextShape.some(([r, c]) => c === -1)) {
                  nextShape = nextShape.map(([r, c]) => [r, c + 1]);
                  nextPosition = [nextPosition[0], nextPosition[1] + 1];
                  if (nextShape.some(([r, c]) => c === -1)) {
                    return {};
                  }
                }
              }

              // Move shape to the left if it's out of the right border of the board
              if (nextShape.some(([r, c]) => c === 10)) {
                nextShape = nextShape.map(([r, c]) => [r, c - 1]);
                nextPosition = [nextPosition[0], nextPosition[1] - 1];
                if (nextShape.some(([r, c]) => c === 10)) {
                  nextShape = nextShape.map(([r, c]) => [r, c - 1]);
                  nextPosition = [nextPosition[0], nextPosition[1] - 1];
                  if (nextShape.some(([r, c]) => c === 10)) {
                    return {};
                  }
                }
              }

              // Check if the shape is colliding with the bottom of the board
              if (nextShape.some(([r, c]) => r === 20)) {
                return {};
              }

              // Check if the shape is colliding with a filled cell
              if (nextShape.some(([r, c]) => event.board[r][c] === 1)) {
                return {};
              }

              return {
                rotation: nextRotation,
                position: nextPosition,
              };
            }),
          ],
        },
      },
    },
  },
});
