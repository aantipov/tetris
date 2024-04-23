import { View, Button, Text } from "react-native";
import { BoardEventT, BoardStateT } from "../machines/board";
import NextShapeBoard from "./NextShapeBoard";
import { styles } from "../styles";

type PropsT = {
  boardState: BoardStateT;
  sendBoardEvent: (event: BoardEventT) => void;
};

export default function RightSide({ boardState, sendBoardEvent }: PropsT) {
  const nextShapeType = boardState.context.nextShape;

  return (
    <View style={styles.rightSide}>
      <Text style={{ fontWeight: "600" }}>Score</Text>
      <Text style={{ fontSize: 20 }}>{boardState.context.score}</Text>
      <Text style={{ fontWeight: "600", paddingTop: 20 }}>Lines</Text>
      <Text style={{ fontSize: 20 }}>{boardState.context.linesCleared}</Text>
      <Text style={{ fontWeight: "600", paddingTop: 20 }}>Next</Text>
      {nextShapeType === null ? null : (
        <NextShapeBoard nextShapeType={nextShapeType} />
      )}
    </View>
  );
}
