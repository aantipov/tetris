import {
  assign,
  setup,
  ActorRefFrom,
  enqueueActions,
  raise,
  cancel,
} from "xstate";
import { shapesTypes, type BoardGridT, type ShapeTypeT } from "../shapes";
import { getActiveShape, shapeMachine } from "./shape";

const initialShapeType = shapesTypes[0];
const initialShapesTypes = shapesTypes.slice(1);
const BOARD_GRID_ROWS = 20;
const BOARD_GRID_COLS = 10;
const LONG_PRESS_MOVE_DELAY = 50;
const AUTO_DOWN_DELAY = 500;
const DROP_DELAY = 1;

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
      | { type: "BTN.LEFT.PRESSED" }
      | { type: "BTN.LEFT.LONG_PRESSED" }
      | { type: "BTN.LEFT.PRESSED" }
      | { type: "BTN.LEFT.RELEASED" }
      | { type: "BTN.RIGHT.PRESSED" }
      | { type: "BTN.RIGHT.LONG_PRESSED" }
      | { type: "BTN.RIGHT.RELEASED" }
      | { type: "BTN.DOWN.PRESSED" }
      | { type: "BTN.DOWN.LONG_PRESSED" }
      | { type: "BTN.DOWN.RELEASED" }
      | { type: "BTN.DROP" }
      | { type: "BTN.ROTATE" }
      | { type: "MOVE.SHAPE.LEFT" }
      | { type: "MOVE.SHAPE.RIGHT" }
      | { type: "MOVE_SHAPE_DOWN" }
      | { type: "SET_NEW_SHAPE" }
      | { type: "NEW_SHAPE_SET" }
      | { type: "HANDLE_COLLISION" }
      | { type: "HANDLE_STRIKE" }
      | { type: "CLEAR_FULL_ROWS" }
      | { type: "AUTO_DOWN" };
  },
  actors: {
    shapeM: shapeMachine,
  },
  guards: {
    cantMoveDown: ({ context }) => !canMoveDown(context),
    hasCompletedRows: ({ context }) => getFullRowsCount(context.grid) > 0,
  },
  actions: {
    rethrowAutoDown: enqueueActions(({ enqueue }) => {
      enqueue.cancel("autoDown");
      enqueue.raise(
        { type: "AUTO_DOWN" },
        { delay: AUTO_DOWN_DELAY, id: "autoDown" }
      );
    }),
    stopAutoDown: cancel("autoDown"),
    moveLeft: ({ context }) => {
      context.shapeRef.send({ type: "LEFT", board: context.grid });
    },
    moveRight: ({ context }) => {
      context.shapeRef.send({ type: "RIGHT", board: context.grid });
    },
    moveDown: ({ context }) => {
      if (canMoveDown(context)) {
        context.shapeRef.send({ type: "DOWN", board: context.grid });
      }
    },
    rotate: ({ context }) => {
      context.shapeRef.send({ type: "ROTATE", board: context.grid });
    },
    setNewShape: ({ context }) => {
      context.shapeRef.send({ type: "RESET", shape: context.nextShape });
    },
    setNextShape: assign(pullNextShape),
    raiseNewShapeSet: raise({ type: "NEW_SHAPE_SET" }, { delay: 300 }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMD2BDAThAxAIQBUA5AOgCUBRAZQoIG0AGAXUVAAdVYBLAFy9QB2rEAA9EAWgBMJAMwB2SZJkAWZXIYBOBgo3LJAGhABPRADYGDEgA4ArMoYBGB1dU3JDKwF9PhtFggkAJICvFzoADb4xCRUBACCZPTMwhzcfILCYggyDsokyja5NjKSpg52VoYmCA6Sclb5mnLKGjZyKnVy3r4Y2OQArgIhAlBRpAAKcQCqNIwsSCCpoRkLWTIMpiSmtopWGrpqDKVViBpWciQO6vt1kjZuBd0gfn1kg8Oj0wQA8gD6ACLfADqRDmKU4yyEq0QkmUMhIDD0BURphKpkUyhONVqNnypmUThydhU9SeLwCbyGXBGJAAsmAeOhAhBwmAcAAJOJEf4AGQovwAwt8eTzAlRAt9QckFkt0lDQFkruUEWdEXoZCUCaYsU4nCQbK1yjYXKZ8Woyb0Ke9qVA6QymSy2V8-oCQWCZRC5ZkzFYHPkCftyqZ2vI5DqGDZNlY9r72u50ecLf4BlSafTGczWUFHWMSHyAGIEPOSgDiv3GlCoNH+7vYnv48tEiDkka27hR8fqCh1yismwcWiskhN2g1GiTr2taftmbA2dZubIgRL7KLPNL5cr1dri3rKwViFyDk2DFDGlKcmPBJsPbkJ7c58kGnq2l7E6tqdt6YdWdnuddpDrkQZYVtQ27SnWaQNt6CAtpYw5WEcz4mnIGg9o41gOI4tQyFYMiGl0PjPJaKYfHaGaOvObKEKQ-xkN84w7rK0HQtiBJtjkuj4kOpg3sYh6dJcNyOHsBr7DY76kTa5E-nOf40XmFCFiQoFVhQNYQbuUH7k2CAaPiJCXqUvaEuisI6m48IbKiprGnI9naJJlJkd+s5UYuy6ripW7qUxe6NoqpTwpGbSXuoiEKA4FlKAipoyLZ5wOYRPTJs50muZR8nRAB3lgb5mnMTpgXoiQijuFhzQWHZOpPhcOTqKU56Ie4XhEeSUnThRv45gp9HxAQFB+dpAWnHshmFOocIokOMg1c+shXEcphNUcHhOVOX4zpReD9DwPCCDyYAAGY8OMmBwLAkC5gWRaUHycTgfMkGQjBZx5Ki56aLkGgOPhlT8TU+InnUWH2NG8WtSlk6fjJbk7XtB3Had52wJduC0t8ABqFAxJy4w4zdQ0vaxkYXHU9zns+diKFFAPHrxJAHOehS5C49zrTDGVZvD+0CGQXBQAAFsjF1Xb1nm3RQ92PeCw0wbUsL6gUJSoTxxranTQMIiDiIeHh2wcy5W3c7tvP80LIuo1dGPY7jcT4+QEtE16rGLfCJkWLxP34gYmsGvqnvfb2yhlIb0k84I-yoAA7gIZ2i7gCk5XdFAPflT1acTB4IOcDS4fF8jrM0uS+9U+l5PU5ysy4w74mHNIRwIUex-HVvo1j-JUHj-IAc7LHZ1htiM20GzuO0ej1Fivq4no+mtKeexOMo9e2o3zdxyjaM4DbnfdwCwKgg4GeFSNNRfZcvG2PcX2OJiAOmnkIcPnCQX2OObUkWlNL-JgqBsGwNpt4d1+F3e2PcD59yKoeEkpUWxtGVrZY4ANzzwjOL6eKShiTJWIqlDaJAf5-wASMIB2MQF717kfWWWddK-UKPkOoRx8KKHkHYLE+wNClUkL9ZaOI7x6BXiQPAqAEYAFsBSoHCOELg3BBDsnQAIFk6UwCYCgIAzk3I+QgIIEuAA0oNAq-l5Y-VQTINo+IGq3zDADeofoIz3DqHoYcbRIY4OhmRIRojxGSOkQ2ORCipHThUWorkvJO7aMCHouglCPRy1YooDQ8J1jRhslhO4fFqg2IRPcex8TAwyAER4-aYiJFSJkQIPxiiaQVICVAKgPBMBcAANZsgFPdMgvx8xTBFL8eiQIqCQNPjTd6BQhywlsMGO+1Q+x5GKE+Q48VnwagKcIopXjSm+PkZU20VAGR8BGEQMA0cqCC3QGwNkNACC-CIBQIEZCwEDJgo1Wx+k+zBjsHedJiA+y4icKUPCkYCR3HyR-XBMNCmoGKd4sp1TpI7L2jaA5RyTlnJwNc25oD8YgNoA8uJBIGhcMps4FwiI0J03WH6XCqJyhIV9C4ZZniSk+NkZsmpMRdkIsOcc05bI0V3MxRcqJx9DFxIjNIUezgShXzKLNMlGFKVEhpc4ZeIK+jjHQP0LevVqBTFpPooVsTs5EkZuqZapMhy5DYVw0qcVyi1FqCSySaqNVXWdPvN0BiDW6R+pwsq5g-lzNLl85wsheyIWfFwsKEkVUBHzNSaRgsxbRErNij11CsjDgwgOTQ8g7UEh1FoXEVLNCImcJTYFUMY1xtgAm3AIhYCMh4HOdAJ1lEAAobAWAYAAShwO1WNIRq2QBxYaxw0g1CmIjFcRenyahz0uHcX5qhUItGBURAQqAIBwGEOSKhLts7iA7bIBQSgl3Fp0JMxAvYOFPyLn2XIIlsHtWCKECIu7+40JaJcO8ex6iz2PHcGq9lrB9k4hGO8qF34Vo6lAN9UCEBqD9OTA0tVqZcKxGYxmvE6jRlJsUBwAiuZgFg6fQoHCkOUxbI42m1QnAM3qkcVQt7HLRug7DTKjpiPy2PBcOErRgzolMYGmocJNgtkWgSfC-6CPGznI3Q6J1W5o046xRCeQaaXkjKiDU6IdToj9JGX0+lSgeGydJrqsnTaCHNsLRTkBlMDxDn6bYIYyi-TE7pq1BmBzonMFfKNUGv6r0s03GOG8E72d0ua+hrRHEmiwjO+o8JcjtHOBgg0A4BEEP-jaCLipagcMvOsOoP1RIzq0JYUNxb8RaByC49qgXBErIhWspl5SWU5ZiWmw8LYLg11jIiMqtgsTLWCtkpwrQVZHHpasxl0L2uBNUSMXLh5EK4j6+JwbM68INAsBN+M-7cjTea7NjZ-jpIwpGHUhpzTlsIHKu9U8tRKpnFREJ6ZCJNAtCVG-ZwR3IXrOZWdmkcK9lQERVys5t3YTesvE1J8Ha2hbYMrtr7l4ft1ZIk6pTnW926XKozSKOHoy-X2FYsuVrShUsKFw9wLRJL9vjXZnH761ie1KrqSnuQfYaxo+S2QIHqVPlpcq7wQA */
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
            enqueue("rethrowAutoDown");
          }),
        },
      },
      entry: [
        assign({
          grid: () => createBoard(),
          nextShape: initialShapeType,
          shapesBag: () => [...initialShapesTypes],
          score: 0,
          linesCleared: 0,
        }),
      ],
    },

    Running: {
      initial: "MetaIdle",
      on: {
        // TODO: Do not interrupt Collision Hanlding process with Pausing
        "BTN.PAUSE": "Paused",
        AUTO_DOWN: {
          actions: ["rethrowAutoDown"],
        },
      },
      states: {
        MetaIdle: {
          initial: "Idle",
          description:
            "Either no buttons actively pressed, or left/right pressed",
          on: {
            HANDLE_COLLISION: {
              target: "#board.Running.BottomCollisionHandling",
            },
            AUTO_DOWN: {
              actions: enqueueActions(({ context, enqueue }) => {
                if (canMoveDown(context)) {
                  context.shapeRef.send({
                    type: "DOWN",
                    board: context.grid,
                  });
                } else {
                  // Delay collision handling to allow the shape to move left/right
                  enqueue.raise({ type: "HANDLE_COLLISION" });
                }
                enqueue("rethrowAutoDown");
              }),
            },
          },
          states: {
            Idle: {
              on: {
                "BTN.LEFT.LONG_PRESSED": "ButtonLeftPressed",
                "BTN.RIGHT.LONG_PRESSED": "ButtonRightPressed",
                "BTN.DOWN.LONG_PRESSED": "#board.Running.ButtonDownPressed",
                "BTN.DROP": "#board.Running.Dropping",
                "BTN.LEFT.PRESSED": {
                  actions: ["moveLeft"],
                },
                "BTN.RIGHT.PRESSED": {
                  actions: ["moveRight"],
                },
                "BTN.DOWN.PRESSED": {
                  actions: ["moveDown"],
                },
                "BTN.ROTATE": {
                  actions: ["rotate"],
                },
              },
            },
            ButtonLeftPressed: {
              on: {
                "BTN.LEFT.RELEASED": "Idle",
                "MOVE.SHAPE.LEFT": {
                  actions: [
                    "moveLeft",
                    raise(
                      { type: "MOVE.SHAPE.LEFT" },
                      { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeLeft" }
                    ),
                  ],
                },
              },
              entry: raise(
                { type: "MOVE.SHAPE.LEFT" },
                { id: "moveShapeLeft" }
              ),
              exit: cancel("moveShapeLeft"),
            },
            ButtonRightPressed: {
              on: {
                "BTN.RIGHT.RELEASED": "Idle",
                "MOVE.SHAPE.RIGHT": {
                  actions: [
                    "moveRight",
                    raise(
                      { type: "MOVE.SHAPE.RIGHT" },
                      { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeRight" }
                    ),
                  ],
                },
              },
              entry: raise(
                { type: "MOVE.SHAPE.RIGHT" },
                { id: "moveShapeRight" }
              ),
              exit: cancel("moveShapeRight"),
            },
          },
        },

        ButtonDownPressed: {
          on: {
            "BTN.DOWN.RELEASED": "#board.Running.MetaIdle",
            MOVE_SHAPE_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: [
                  "moveDown",
                  raise(
                    { type: "MOVE_SHAPE_DOWN" },
                    { delay: LONG_PRESS_MOVE_DELAY, id: "moveShapeDown" }
                  ),
                ],
              },
            ],
          },
          entry: [
            "stopAutoDown",
            raise({ type: "MOVE_SHAPE_DOWN" }, { id: "moveShapeDown" }),
          ],
          exit: ["rethrowAutoDown"],
        },

        Dropping: {
          on: {
            MOVE_SHAPE_DOWN: [
              {
                guard: "cantMoveDown",
                target: "#board.Running.BottomCollisionHandling",
              },
              {
                actions: [
                  "moveDown",
                  raise({ type: "MOVE_SHAPE_DOWN" }, { delay: DROP_DELAY }),
                ],
              },
            ],
          },
          entry: raise({ type: "MOVE_SHAPE_DOWN" }),
        },

        BottomCollisionHandling: {
          initial: "Merging",
          states: {
            Merging: {
              on: {
                HANDLE_STRIKE: [
                  { guard: "hasCompletedRows", target: "HandlingStrike" },
                  { target: "SettingNewShape" },
                ],
              },
              entry: [
                assign({
                  grid: ({ context }) => {
                    let newGrid = context.grid.map((row) => [...row]);
                    const { type, position, rotation } =
                      context.shapeRef.getSnapshot().context;
                    const shape = getActiveShape(type, rotation, position);
                    shape.forEach(([r, c]) => (newGrid[r][c] = 1));
                    return newGrid;
                  },
                }),
                ({ context }) => {
                  context.shapeRef.send({ type: "EMPTY" });
                },
                raise({ type: "HANDLE_STRIKE" }),
              ],
            },
            HandlingStrike: {
              on: {
                CLEAR_FULL_ROWS: {
                  target: "SettingNewShape",
                  actions: [
                    assign(({ context }) => {
                      let newGrid = context.grid.map((row) => [...row]);
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
                          strikedRows > 1
                            ? strikedRows * 200
                            : strikedRows * 100;
                      }

                      return {
                        grid: newGrid,
                        score: newScore,
                        linesCleared: context.linesCleared + strikedRows,
                      };
                    }),
                  ],
                },
              },
              entry: [raise({ type: "CLEAR_FULL_ROWS" }, { delay: 300 })],
            },
            SettingNewShape: {
              on: {
                SET_NEW_SHAPE: {
                  actions: ["setNewShape", "setNextShape", "raiseNewShapeSet"],
                },
                NEW_SHAPE_SET: [
                  {
                    guard: "cantMoveDown",
                    target: "#board.Finished",
                  },
                  {
                    target: "#board.Running.MetaIdle",
                  },
                ],
              },
              entry: raise({ type: "SET_NEW_SHAPE" }, { delay: 300 }),
            },
          },
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
