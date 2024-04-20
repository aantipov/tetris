export type BoardGridT = number[][]; // 20x10 grij
export type Shape = number[][]; // Each shape represents on of 19 Fixed tetromino shapes https://en.wikipedia.org/wiki/Tetromino
export type ShapeGroup = Record<Angle, Shape>; // A group of shapes - a fixed tetromino shape plus its rotations
export const shapesTypes = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type ShapeTypeT = (typeof shapesTypes)[number] | "_"; // '_' is a special type used to indicate that the shape is not yet known
export type Angle = 0 | 90 | 180 | 270;
export type PositionT = [number, number];

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

export const EmptySHapes: ShapeGroup = {
  0: [],
  90: [],
  180: [],
  270: [],
};

export const shapes = {
  I: IShapes,
  J: JShapes,
  L: LShapes,
  O: OShapes,
  S: SShapes,
  T: TShapes,
  Z: ZSHapes,
  _: EmptySHapes,
} as const;
