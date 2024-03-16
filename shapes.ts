export type BoardT = number[][]; // 20x10 grij
type Shape = number[][]; // Each shape represents on of 19 Fixed tetromino shapes https://en.wikipedia.org/wiki/Tetromino
type ShapeGroup = Shape[]; // A group of shapes - a fixed tetromino shape plus its rotations
type ShapeType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type Angle = 0 | 90 | 180 | 270;

export class BasicShape {
  name: string;
  position: [number, number];
  board: BoardT;
  shape: number[][];
  shapeIndex: number;
  forceUpdateFn: () => void;
  constructor(
    name: string,
    shape: Shape,
    board: BoardT,
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
export class ShapeI extends BasicShape {
  angle: Angle = 0;
  constructor(board: BoardT, forceUpdateFn: () => void) {
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