import { useState } from "react";
import type { BoardGridT, Shape } from "../shapes";

function createBoard(): BoardGridT {
  const board = [];
  for (let r = 0; r < 20; r++) {
    const row = [];
    for (let c = 0; c < 10; c++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
}

export function useBoard() {
  const [board, setBoard] = useState(createBoard);

  function reset() {
    setBoard(createBoard);
  }

  function merge(activeShape: Shape) {
    const newBoard = board.map((row) => [...row]);
    activeShape.forEach(([r, c]) => {
      newBoard[r][c] = 1;
    });
    setBoard(newBoard);
  }

  function removeFilledRows() {
    const newBoard = board.filter((row) => row.some((cell) => cell === 0));
    newBoard.unshift(new Array(10).fill(0));
    setBoard(newBoard);
  }

  return { board, reset, merge, removeFilledRows } as const;
}
