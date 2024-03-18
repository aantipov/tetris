import type { BoardT } from "./shapes";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View, Button } from "react-native";
import useForceUpdate from "./hooks/useForceUpdate";
import { BasicShape, ShapesBag } from "./shapes";
import MIcons from "@expo/vector-icons/MaterialIcons";
import CircleButtonWithIcon from "./components/Button";

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
  const [board, setBoard] = useState<BoardT>(createBoard());
  const [shapeBag] = useState<ShapesBag>(new ShapesBag(board, forceUpdate));
  const [activeShape, setActiveShape] = useState<BasicShape>(
    shapeBag.getNextShape()
  );

  const reset = () => {
    setBoard(createBoard());
    setActiveShape(shapeBag.getNextShape());
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
        <CircleButtonWithIcon onPress={() => activeShape.moveLeft()}>
          <MIcons name="arrow-back" size={48} color="white" />
        </CircleButtonWithIcon>
        {/* Move Down button */}
        <CircleButtonWithIcon
          onPress={() => {
            if (activeShape.hasBottomCollision()) {
              // merge active shape into board and create a new active shape
              activeShape.shape.forEach(([r, c]) => {
                board[r][c] = 1;
              });
              // remove full lines
              for (let i = 0; i < 20; i++) {
                if (board[i].every((cell) => cell === 1)) {
                  board.splice(i, 1);
                  board.unshift(new Array(10).fill(0));
                }
              }
              setActiveShape(shapeBag.getNextShape());
              forceUpdate();
              return;
            }
            activeShape.moveDown();
          }}
        >
          <MIcons name="arrow-downward" size={48} color="white" />
        </CircleButtonWithIcon>
        {/* Move Right button */}
        <CircleButtonWithIcon onPress={() => activeShape.moveRight()}>
          <MIcons name="arrow-forward" size={48} color="white" />
        </CircleButtonWithIcon>
        {/* Rotate button */}
        <CircleButtonWithIcon onPress={() => activeShape.rotate()}>
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
            if (activeShape.hasBottomCollision()) {
              // merge active shape into board and create a new active shape
              activeShape.shape.forEach(([r, c]) => {
                board[r][c] = 1;
              });
              setActiveShape(shapeBag.getNextShape());
              forceUpdate();
              return;
            }
            activeShape.drop();
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
