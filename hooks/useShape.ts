import { useState } from "react";
import {
  shapes,
  type Angle,
  type BoardT,
  type Shape,
  type ShapeType,
  Postition,
} from "../shapes";

function getActiveShape(
  type: ShapeType,
  rotation: Angle,
  postition: Postition
) {
  return shapes[type][rotation].map(([r, c]) => [
    r + postition[0],
    c + postition[1],
  ]);
}

export function useShape(initialType: ShapeType) {
  const [type, setType] = useState<ShapeType | null>(initialType);
  const [rotation, setRotation] = useState<Angle>(0);
  const [position, setPosition] = useState<Postition>(
    initialType === "O" ? [0, 4] : [0, 3]
  );
  const shape: Shape | null = type
    ? getActiveShape(type, rotation, position)
    : null;

  function rotate(board: BoardT) {
    if (type === null) {
      return;
    }
    const nextAngle = ((rotation + 90) % 360) as Angle;

    let nextShape = shapes[type][nextAngle].map(([r, c]) => [
      r + position[0],
      c + position[1],
    ]);
    let nextPosition: Postition = [...position];
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

  function moveLeft(board: BoardT) {
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

  function moveRight(board: BoardT) {
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

  function setNewShape(newType: ShapeType | null) {
    const newPosition: Postition = newType === "O" ? [0, 4] : [0, 3];
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
    setNewShape,
  } as const;
}
