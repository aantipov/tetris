import { useEffect, useState } from "react";
import { BoardT, ShapeType, shapes } from "../shapes";
import { View } from "react-native";
import { styles } from "../styles";

export default function NextShapeBoard({
  nextShapeType,
}: {
  nextShapeType: ShapeType;
}) {
  const [board, setBoard] = useState<BoardT>(createBoard());

  useEffect(() => {
    const board = createBoard();
    const shape = shapes[nextShapeType][0];
    shape.forEach(([r, c]) => {
      board[r][c] = 1;
    });
    setBoard(board);
  }, [nextShapeType]);

  function createBoard(): BoardT {
    return [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  }
  return (
    <View style={{ borderWidth: 2, borderColor: "gray" }}>
      {board.map((row, i) => {
        return (
          <View key={i} style={{ flexDirection: "row" }}>
            {row.map((cell, j) => {
              return (
                <View
                  key={j}
                  style={cell === 1 ? styles.fullCell : styles.cell}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
