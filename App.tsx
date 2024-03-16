import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import useForceUpdate from "./hooks/useForceUpdate";
import { BasicShape, ShapeI } from "./shapes";
import type { BoardT } from "./shapes";

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
