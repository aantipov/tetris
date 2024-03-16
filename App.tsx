import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import useForceUpdate from "./hooks/useForceUpdate";

type Board = number[][]; // 20x10 grid
type Shape = number[][]; // Each shape represents on of 19 Fixed tetromino shapes https://en.wikipedia.org/wiki/Tetromino
type ShapeGroup = Shape[]; // A group of shapes - a fixed tetromino shape plus its rotations
type ShapeType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

class BasicShape {
  name: string;
  position: [number, number];
  board: Board;
  shape: number[][];
  shapeIndex: number;
  forceUpdateFn: () => void;
  constructor(
    name: string,
    shape: Shape,
    board: Board,
    forceUpdateFn: () => void
  ) {
    this.name = name;
    this.board = board;
    this.shapeIndex = 0;
    this.position = shape.length === 4 ? [0, 3] : [0, 4];
    this.shape = shape.map(([r, c]) => [
      r + this.position[0],
      c + this.position[1],
    ]);
    this.forceUpdateFn = forceUpdateFn;
  }
  hasCell(row: number, col: number) {
    return this.shape.some(([r, c]) => r === row && c === col);
  }
  hasBottomCollision() {
    if (this.shape.some(([r, c]) => r === 19)) {
      // One of the cells is at the bottom of the board
      return true;
    }
    // Check if one of the cells has a filled board cell below it
    return this.shape.some(([r, c]) => this.board[r + 1][c] === 1);
  }
  moveRight() {
    if (this.shape.some(([, c]) => c === 9)) {
      return this;
    }
    this.position = [this.position[0], this.position[1] + 1];
    this.shape = this.shape.map(([r, c]) => [r, c + 1]);
    this.forceUpdateFn();
    return this;
  }
  moveLeft() {
    if (this.shape.some(([, c]) => c === 0)) {
      return this;
    }
    this.position = [this.position[0], this.position[1] - 1];
    this.shape = this.shape.map(([r, c]) => [r, c - 1]);
    this.forceUpdateFn();
    return this;
  }
  moveDown() {
    this.position = [this.position[0] + 1, this.position[1]];
    this.shape = this.shape.map(([r, c]) => [r + 1, c]);
    this.forceUpdateFn();
    return this;
  }
  rotate() {}
}

const IShapes: Record<Angle, Shape> = {
  0: [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
  ],
  90: [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
  180: [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],
  270: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
};
// Define Tetrimino shapes
type Angle = 0 | 90 | 180 | 270;
class ShapeI extends BasicShape {
  angle: Angle = 0;
  constructor(board: Board, forceUpdateFn: () => void) {
    super("ShapeIV", IShapes[0], board, forceUpdateFn);
  }
  rotate() {
    this.angle = ((this.angle + 90) % 360) as Angle;
    this.shape = IShapes[this.angle].map(([r, c]) => [
      r + this.position[0],
      c + this.position[1],
    ]);
    this.forceUpdateFn();
    return this;
  }
}

function createBoard(): number[][] {
  const board = [];
  for (let i = 0; i < 20; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
}

export default function TetrisApp() {
  const forceUpdate = useForceUpdate();
  const [board, setBoard] = useState<number[][]>(createBoard());
  const [activeShape, setActiveShape] = useState<BasicShape>(
    new ShapeI(board, forceUpdate)
  );
  useEffect(() => {
    activeShape.moveRight().moveRight().moveDown().moveDown();
    forceUpdate();
  }, []);

  const reset = () => {
    setBoard(createBoard());
    setActiveShape(new ShapeI(board, forceUpdate));
    activeShape.moveRight().moveRight().moveDown().moveDown();
    forceUpdate();
  };

  return (
    <View style={styles.container}>
      <View style={{ borderWidth: 2, borderColor: "gray" }}>
        {board.map((row, i) => {
          return (
            <View key={i} style={{ flexDirection: "row" }}>
              {row.map((cell, j) => {
                return (
                  <View
                    key={j}
                    style={
                      cell === 1 || activeShape.hasCell(i, j)
                        ? styles.fullCell
                        : styles.cell
                    }
                  />
                );
              })}
            </View>
          );
        })}
      </View>
      <View style={{ flex: 1, gap: 15, marginTop: 20 }}>
        <Button title="Move Left" onPress={() => activeShape.moveLeft()} />
        <Button title="Move Right" onPress={() => activeShape.moveRight()} />
        <Button
          title="Move Down"
          onPress={() => {
            if (activeShape.hasBottomCollision()) {
              // merge active shape into board and create a new active shape
              activeShape.shape.forEach(([r, c]) => {
                board[r][c] = 1;
              });
              setActiveShape(new ShapeI(board, forceUpdate));
              forceUpdate();
              return;
            }
            activeShape.moveDown();
          }}
        />
        <Button title="Rotate" onPress={() => activeShape.rotate()} />
        <Button title="Reset" onPress={reset} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "100%",
    height: "100%",
    paddingTop: 80,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  cell: {
    rowGap: 0,
    columnGap: 0,
    width: 25,
    height: 25,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  fullCell: {
    rowGap: 0,
    columnGap: 0,
    width: 25,
    height: 25,
    backgroundColor: "black",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
});
