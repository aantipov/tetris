import { useState } from "react";
import {
  shapes,
  type Angle,
  type BoardGridT,
  type Shape,
  type ShapeTypeT,
  type PositionT,
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

export function useShape(initialType: ShapeTypeT | null) {
  const [type, setType] = useState<ShapeTypeT | null>(initialType);
  const [rotation, setRotation] = useState<Angle>(0);
  const [position, setPosition] = useState<PositionT>(
    initialType === "O" ? [0, 4] : [0, 3]
  );
  const shape: Shape | null = type
    ? getActiveShape(type, rotation, position)
    : null;

  function rotate(board: BoardGridT) {
    if (type === null) {
      return;
    }
    const nextAngle = ((rotation + 90) % 360) as Angle;

    let nextShape = shapes[type][nextAngle].map(([r, c]) => [
      r + position[0],
      c + position[1],
    ]);
    let nextPosition: PositionT = [...position];
    // Move shape to the right if it's out of the left border of the board
    if (nextShape.some(([r, c]) => c === -1)) {
      nextShape = nextShape.map(([r, c]) => [r, c + 1]);
      nextPosition = [nextPosition[0], nextPosition[1] + 1];
      if (nextShape.some(([r, c]) => c === -1)) {
        nextShape = nextShape.map(([r, c]) => [r, c + 1]);
        nextPosition = [nextPosition[0], nextPosition[1] + 1];
        if (nextShape.some(([r, c]) => c === -1)) {
          return;
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
          return;
        }
      }
    }

    // Check if the shape is colliding with the bottom of the board
    if (nextShape.some(([r, c]) => r === 20)) {
      return;
    }

    // Check if the shape is colliding with a filled cell
    if (nextShape.some(([r, c]) => board[r][c] === 1)) {
      return;
    }

    setPosition(nextPosition);
    setRotation(nextAngle);
  }

  function moveLeft(board: BoardGridT) {
    if (shape === null) {
      return;
    }
    if (shape.some(([, c]) => c === 0)) {
      return;
    }
    // Check if one of the cells has a filled board cell to the left of it
    if (shape.some(([r, c]) => board[r][c - 1] === 1)) {
      return;
    }
    setPosition([position[0], position[1] - 1]);
  }

  function moveRight(board: BoardGridT) {
    if (shape === null) {
      return;
    }
    if (shape.some(([, c]) => c === 9)) {
      return;
    }
    // Check if one of the cells has a filled board cell to the right of it
    if (shape.some(([r, c]) => board[r][c + 1] === 1)) {
      return;
    }
    setPosition([position[0], position[1] + 1]);
  }

  function moveDown() {
    type && setPosition((prev) => [prev[0] + 1, prev[1]]);
  }

  function drop(board: BoardGridT) {
    if (shape === null || type === null) {
      return;
    }
    let nextPosition = position;
    let activeShape = getActiveShape(type, rotation, nextPosition);
    while (activeShape.every(([r, c]) => r < 19 && board[r + 1][c] === 0)) {
      nextPosition = [nextPosition[0] + 1, nextPosition[1]];
      activeShape = getActiveShape(type, rotation, nextPosition);
    }
    setPosition(nextPosition);
  }

  function setNewShape(newType: ShapeTypeT | null) {
    const newPosition: PositionT = newType === "O" ? [0, 4] : [0, 3];
    setType(newType);
    setRotation(0);
    setPosition(newPosition);
  }

  return {
    shape,
    position,
    rotate,
    moveLeft,
    moveRight,
    moveDown,
    drop,
    setNewShape,
  } as const;
}
