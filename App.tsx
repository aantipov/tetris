import type { BoardT, Shape } from "./shapes";
import { StatusBar } from "expo-status-bar";
import { StrictMode, useEffect, useState } from "react";
import { StyleSheet, View, Button } from "react-native";
import useForceUpdate from "./hooks/useForceUpdate";
import MIcons from "@expo/vector-icons/MaterialIcons";
import CircleButtonWithIcon from "./components/Button";
import { useShapesBag } from "./hooks/useShapesBag";
import { useShape } from "./hooks/useShape";
import { useBoard } from "./hooks/useBoard";

type MoveDownSubAction =
  | "init"
  | "moveDown"
  | "merge"
  | "handleStrike"
  | "newShape";

function hasBoardStrike(board: BoardT) {
  return board.some((row) => row.every((cell) => cell === 1));
}

function hasShapeCell(shape: Shape, row: number, col: number) {
  return shape.some(([r, c]) => r === row && c === col);
}

function canMoveDown(shape: Shape | null, board: BoardT) {
  return !!shape && shape.every(([r, c]) => r < 19 && board[r + 1][c] === 0);
}

const moveFastDelay = 50;
type LongMoveType = "left" | "right" | false;

export default function TetrisApp() {
  const { board, reset, merge, removeFilledRows } = useBoard();
  const [initialShapeType, pullNextShapeType] = useShapesBag();
  const {
    shape: activeShape,
    position,
    rotate,
    moveLeft,
    moveRight,
    moveDown,
    setNewShape,
  } = useShape(initialShapeType);
  const [nextMoveDownSubActionTrigger, triggerNextMoveDownSubaction] =
    useForceUpdate();
  const [lastMoveDownSubAction, setLastMoveDownSubAction] =
    useState<MoveDownSubAction>("init");
  const [longMove, setLongMove] = useState<LongMoveType>(false);
  const [nextLongSubMoveTrigger, triggerNextLongSubMove] = useForceUpdate();

  function manualMoveDown() {
    if (
      (lastMoveDownSubAction === "init" ||
        lastMoveDownSubAction === "moveDown" ||
        lastMoveDownSubAction === "newShape") &&
      canMoveDown(activeShape, board)
    ) {
      moveDown();
      setLastMoveDownSubAction("moveDown");
      triggerNextMoveDownSubaction();
    }
  }

  useEffect(() => {
    if (activeShape && longMove && lastMoveDownSubAction === "moveDown") {
      const intervalId = setInterval(() => {
        if (longMove === "right") moveRight(board);
        if (longMove === "left") moveLeft(board);
        triggerNextLongSubMove();
      }, moveFastDelay);
      return () => clearInterval(intervalId);
    }
  }, [
    longMove,
    lastMoveDownSubAction,
    nextLongSubMoveTrigger,
    position,
    activeShape,
  ]);

  // 1. Move the active shape down every 1 second
  useEffect(() => {
    if (
      (lastMoveDownSubAction === "init" ||
        lastMoveDownSubAction === "moveDown" ||
        lastMoveDownSubAction === "newShape") &&
      canMoveDown(activeShape, board)
    ) {
      const timeoutId = setTimeout(() => {
        moveDown();
        setLastMoveDownSubAction("moveDown");
        triggerNextMoveDownSubaction();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nextMoveDownSubActionTrigger, lastMoveDownSubAction]);

  // 2. Merge the active shape with the board when it hits the bottom
  useEffect(() => {
    if (
      lastMoveDownSubAction === "moveDown" &&
      !!activeShape &&
      !canMoveDown(activeShape, board)
    ) {
      merge(activeShape);
      setNewShape(null);
      setLastMoveDownSubAction("merge");
      triggerNextMoveDownSubaction();
    }
  }, [nextMoveDownSubActionTrigger, lastMoveDownSubAction]);

  // 3. Create a new shape after the active shape has merged with the board
  useEffect(() => {
    if (lastMoveDownSubAction === "merge" && hasBoardStrike(board)) {
      const timeoutId = setTimeout(() => {
        removeFilledRows();
        setLastMoveDownSubAction("handleStrike");
        triggerNextMoveDownSubaction();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nextMoveDownSubActionTrigger, lastMoveDownSubAction]);

  // 4. Create a new shape after the active shape has merged with the board
  useEffect(() => {
    if (
      (lastMoveDownSubAction === "merge" && !hasBoardStrike(board)) ||
      lastMoveDownSubAction === "handleStrike"
    ) {
      const timeoutId = setTimeout(() => {
        setNewShape(pullNextShapeType());
        setLastMoveDownSubAction("newShape");
        triggerNextMoveDownSubaction();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nextMoveDownSubActionTrigger, lastMoveDownSubAction]);

  return (
    <StrictMode>
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
                        cell === 1 ||
                        (activeShape && hasShapeCell(activeShape, i, j))
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

        {/* Controls */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 30,
            marginTop: 20,
            marginBottom: 30,
          }}
        >
          {/* Move Left Button */}
          <CircleButtonWithIcon
            onPressIn={() => setLongMove("left")}
            onPressOut={() => setLongMove(false)}
          >
            <MIcons name="arrow-back" size={48} color="white" />
          </CircleButtonWithIcon>
          {/* Move Down button */}
          <CircleButtonWithIcon onPress={() => manualMoveDown()}>
            <MIcons name="arrow-downward" size={48} color="white" />
          </CircleButtonWithIcon>
          {/* Move Right button */}
          <CircleButtonWithIcon
            onPressIn={() => setLongMove("right")}
            onPressOut={() => setLongMove(false)}
          >
            <MIcons name="arrow-forward" size={48} color="white" />
          </CircleButtonWithIcon>
          {/* Rotate button */}
          <CircleButtonWithIcon onPress={() => rotate(board)}>
            <MIcons name="rotate-left" size={48} color="white" />
          </CircleButtonWithIcon>
        </View>
        {/* Drop button */}
        <View
          style={{
            marginLeft: -85,
          }}
        >
          <CircleButtonWithIcon
            onPress={() => {
              // if (activeShape.canMoveDown()) {
              //   // merge active shape into board and create a new active shape
              //   activeShape.shape.forEach(([r, c]) => {
              //     board[r][c] = 1;
              //   });
              //   setActiveShape(shapesBag.getNextShape());
              //   forceUpdate();
              //   return;
              // }
              // activeShape.drop();
            }}
          >
            <MIcons name="vertical-align-bottom" size={48} color="white" />
          </CircleButtonWithIcon>
        </View>
        {/* Reset Button */}
        <View style={{ marginTop: 48 }}>
          <Button title="Reset" onPress={reset} />
        </View>
        <StatusBar style="auto" />
      </View>
    </StrictMode>
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
