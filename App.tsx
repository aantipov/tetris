import type { BoardT } from "./shapes";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View, Button } from "react-native";
import useForceUpdate from "./hooks/useForceUpdate";
import { BasicShape, ShapeI } from "./shapes";
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
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 30,
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        <CircleButtonWithIcon onPress={() => activeShape.moveLeft()}>
          <MIcons name="arrow-back" size={48} color="white" />
        </CircleButtonWithIcon>
        <CircleButtonWithIcon
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
        >
          <MIcons name="arrow-downward" size={48} color="white" />
        </CircleButtonWithIcon>
        <CircleButtonWithIcon onPress={() => activeShape.moveRight()}>
          <MIcons name="arrow-forward" size={48} color="white" />
        </CircleButtonWithIcon>
        <CircleButtonWithIcon onPress={() => activeShape.rotate()}>
          <MIcons name="rotate-left" size={48} color="white" />
        </CircleButtonWithIcon>
      </View>
      <View>
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
