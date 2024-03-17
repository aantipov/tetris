export type BoardT = number[][]; // 20x10 grij
type Shape = number[][]; // Each shape represents on of 19 Fixed tetromino shapes https://en.wikipedia.org/wiki/Tetromino
type ShapeGroup = Record<Angle, Shape>; // A group of shapes - a fixed tetromino shape plus its rotations
type ShapeType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type Angle = 0 | 90 | 180 | 270;
type Postition = [number, number];

export class BasicShape {
  angle: Angle = 0;
  position: Postition;
  board: BoardT;
  shape: Shape;
  shapes: ShapeGroup;
  shapeIndex: number;
  forceUpdateFn: () => void;
  constructor(
    shapes: ShapeGroup, // A group of shapes - a fixed tetromino shape plus its rotations
    board: BoardT,
    startPostition: Postition,
    forceUpdateFn: () => void
  ) {
    const shape = shapes[0];
    this.board = board;
    this.shapes = shapes;
    this.shapeIndex = 0;
    this.position = startPostition;
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
    // Check if one of the cells is at the bottom of the board
    if (this.shape.some(([r, c]) => r === 19)) {
      return true;
    }
    // Check if one of the cells has a filled board cell below it
    return this.shape.some(([r, c]) => this.board[r + 1][c] === 1);
  }
  moveRight() {
    if (this.shape.some(([, c]) => c === 9)) {
      return this;
    }
    // Check if one of the cells has a filled board cell to the right of it
    if (this.shape.some(([r, c]) => this.board[r][c + 1] === 1)) {
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
    // Check if one of the cells has a filled board cell to the left of it
    if (this.shape.some(([r, c]) => this.board[r][c - 1] === 1)) {
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
  drop() {
    while (!this.hasBottomCollision()) {
      this.moveDown();
    }
  }

  rotate() {
    const nextAngle = ((this.angle + 90) % 360) as Angle;
    let nextShape = this.shapes[nextAngle].map(([r, c]) => [
      r + this.position[0],
      c + this.position[1],
    ]);
    let nextPosition: Postition = [...this.position];
    // Move shape to the right if it's out of the left border of the board
    if (nextShape.some(([r, c]) => c === -1)) {
      nextShape = nextShape.map(([r, c]) => [r, c + 1]);
      nextPosition = [nextPosition[0], nextPosition[1] + 1];
      if (nextShape.some(([r, c]) => c === -1)) {
        nextShape = nextShape.map(([r, c]) => [r, c + 1]);
        nextPosition = [nextPosition[0], nextPosition[1] + 1];
        if (nextShape.some(([r, c]) => c === -1)) {
          return this;
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
          return this;
        }
      }
    }

    // Check if the shape is colliding with the bottom of the board
    if (nextShape.some(([r, c]) => r === 20)) {
      return this;
    }

    // Check if the shape is colliding with a filled cell
    if (nextShape.some(([r, c]) => this.board[r][c] === 1)) {
      return this;
    }

    this.position = nextPosition;
    this.angle = nextAngle;
    this.shape = nextShape;
    this.forceUpdateFn();
    return this;
  }
}

const IShapes: ShapeGroup = {
  0: [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
  ],
  90: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  180: [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],
  270: [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
};

const JShapes: ShapeGroup = {
  0: [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  90: [
    [0, 1],
    [1, 1],
    [2, 0],
    [2, 1],
  ],
  180: [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  270: [
    [0, 1],
    [0, 2],
    [1, 1],
    [2, 1],
  ],
};

const LShapes: ShapeGroup = {
  0: [
    [1, 0],
    [1, 1],
    [1, 2],
    [0, 2],
  ],
  90: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  180: [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
  ],
  270: [
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
};

const OShapes: ShapeGroup = {
  0: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  90: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  180: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  270: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
};

const SShapes: ShapeGroup = {
  0: [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ],
  90: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  180: [
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
  ],
  270: [
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
};

const TShapes: ShapeGroup = {
  0: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  90: [
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 0],
  ],
  180: [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
  ],
  270: [
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
};

const ZSHapes: ShapeGroup = {
  0: [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  90: [
    [0, 1],
    [1, 0],
    [1, 1],
    [2, 0],
  ],
  180: [
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  270: [
    [0, 2],
    [1, 1],
    [1, 2],
    [2, 1],
  ],
};

// Define Tetrimino shapes
class ShapeI extends BasicShape {
  name = "ShapeI";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(IShapes, board, [0, 3], forceUpdateFn);
  }
}

class ShapeJ extends BasicShape {
  name = "ShapeJ";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(JShapes, board, [0, 3], forceUpdateFn);
  }
}

class ShapeL extends BasicShape {
  name = "ShapeL";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(LShapes, board, [0, 3], forceUpdateFn);
  }
}
class ShapeO extends BasicShape {
  name = "ShapeO";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(OShapes, board, [0, 4], forceUpdateFn);
  }
}
class ShapeS extends BasicShape {
  name = "ShapeS";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(SShapes, board, [0, 3], forceUpdateFn);
  }
}
class ShapeT extends BasicShape {
  name = "ShapeT";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(TShapes, board, [0, 3], forceUpdateFn);
  }
}
class ShapeZ extends BasicShape {
  name = "ShapeZ";
  constructor(board: BoardT, forceUpdateFn: () => void) {
    super(ZSHapes, board, [0, 3], forceUpdateFn);
  }
}

export const shapesConstructors = [
  ShapeI,
  ShapeJ,
  ShapeL,
  ShapeO,
  ShapeS,
  ShapeT,
  ShapeZ,
];

export class ShapesBag {
  shapes: any[];
  board: BoardT;
  forceUpdateFn: () => void;

  constructor(board: BoardT, forceUpdateFn: () => void) {
    this.shapes = [...shapesConstructors];
    this.board = board;
    this.forceUpdateFn = forceUpdateFn;
  }

  getNextShape() {
    if (this.shapes.length === 0) {
      this.shapes = [...shapesConstructors];
    }
    const nextRandomIndex = Math.floor(Math.random() * this.shapes.length);
    const Shape = this.shapes.splice(nextRandomIndex, 1)[0];
    return new Shape(this.board, this.forceUpdateFn);
  }
}
