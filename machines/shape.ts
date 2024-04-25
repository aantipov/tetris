import { assign, enqueueActions, setup } from "xstate";
import {
  Angle,
  BoardGridT,
  PositionT,
  shapes,
  type ShapeTypeT,
  type Shape,
} from "../shapes";

function getActiveShape(
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
      activeShape: Shape;
    };
    events:
      | { type: "RESET"; shape: ShapeTypeT }
      | { type: "EMPTY" }
      | { type: "LEFT"; board: BoardGridT }
      | { type: "RIGHT"; board: BoardGridT }
      | { type: "DOWN"; board: BoardGridT }
      | { type: "ROTATE"; board: BoardGridT };
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYEMAOYDEAlAogMr4AqA2gAwC6ioGA9rAJYAuT9AdrSAB6IC0ARgCswgHQAmAGwSKEgBwBmACwBOVQHZNEgDQgAnokGr5Y5fOHnla5RMGLVEgL5O9qTGDEBJDqyZoAG2wAGXwAMXJqbgZmNk5uPgRFKSkxVTVheQ0taQplQT1DBAl8sXllRWENexEpQWqNFzd0LG9fNkC8LwBxAAlImiQQGL94ocSJRQ0yimFFe1mNTIdCgQoxCk2KQQoTSuFHW2E6wUFlJpB3Vp8-ToARAHkAdQA5SkG6RlGucaMpZTSCh2KnqUjygl0BkQiimYhUdgo-2q8ikDQuV08Nw6QVwDxIAEESPh3tEvnEfqBEhRVggKC5XCAOPQIHBuBjSbF2BTeAJZIpJDI5Eo1JptDT+FkxMItrt5lJFBINBZ0S1Me1-AEOd8EkY5mIwbU5nKUjIaRJzWINBRFIilBZHKpUfSnEA */
  id: "shape",
  context: ({ input }) => {
    const type = input.type;
    const position: PositionT = type === "O" ? [0, 4] : [0, 3];
    return {
      type,
      rotation: 0,
      position,
      activeShape: getActiveShape(type, 0, position),
    };
  },
  on: {
    RESET: {
      actions: assign(({ event }) => {
        const type = event.shape;
        const position: PositionT = type === "O" ? [0, 4] : [0, 3];
        return {
          type,
          rotation: 0,
          position,
          activeShape: getActiveShape(type, 0, position),
        };
      }),
    },
    EMPTY: {
      // put Shape into a temporary "emtpy" state to hide it from the board
      actions: assign({
        type: "_",
        rotation: 0,
        position: [0, 0],
        activeShape: [],
      }),
    },
    LEFT: {
      actions: [
        assign(({ context: { type, position, rotation }, event }) => {
          const newPosition: PositionT = [position[0], position[1] - 1];
          return {
            position: newPosition,
            activeShape: getActiveShape(type, rotation, newPosition),
          };
        }),
      ],
    },
    RIGHT: {
      actions: [
        assign(({ context: { type, position, rotation }, event }) => {
          const newPosition: PositionT = [position[0], position[1] + 1];
          return {
            position: newPosition,
            activeShape: getActiveShape(type, rotation, newPosition),
          };
        }),
      ],
    },
    DOWN: {
      actions: [
        assign(({ context: { type, position, rotation }, event }) => {
          const newPosition: PositionT = [position[0] + 1, position[1]];
          return {
            position: newPosition,
            activeShape: getActiveShape(type, rotation, newPosition),
          };
        }),
      ],
    },
    ROTATE: {
      actions: [
        assign(({ context: { type, position, rotation }, event }) => {
          const nextRotation: Angle = ((rotation + 90) % 360) as Angle;
          let nextShape = getActiveShape(type, nextRotation, position);
          let nextPosition: PositionT = [...position];

          // Move shape to the right if it's out of the left border of the board
          if (nextShape.some(([r, c]) => c === -1)) {
            nextPosition[1] += 1;
            nextShape = getActiveShape(type, nextRotation, nextPosition);
            if (nextShape.some(([r, c]) => c === -1)) {
              nextPosition[1] += 1;
              nextShape = getActiveShape(type, nextRotation, nextPosition);
              if (nextShape.some(([r, c]) => c === -1)) {
                return {};
              }
            }
          }

          // Move shape to the left if it's out of the right border of the board
          if (nextShape.some(([r, c]) => c === 10)) {
            nextPosition[1] -= 1;
            nextShape = getActiveShape(type, nextRotation, nextPosition);
            if (nextShape.some(([r, c]) => c === 10)) {
              nextPosition[1] -= 1;
              nextShape = getActiveShape(type, nextRotation, nextPosition);
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
            activeShape: nextShape,
          };
        }),
      ],
    },
  },
});
