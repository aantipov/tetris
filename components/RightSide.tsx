import { View, Button, Text } from "react-native";
import { BoardEventT, BoardStateT } from "../machines/board";
import NextShapeBoard from "./NextShapeBoard";

type PropsT = {
  boardState: BoardStateT;
  sendBoardEvent: (event: BoardEventT) => void;
};

export default function RightSide({ boardState, sendBoardEvent }: PropsT) {
  const nextShapeType = boardState.context.nextShape;

  return (
    <View style={{ paddingLeft: 20 }}>
      <Text style={{ fontWeight: "600" }}>Score</Text>
      <Text style={{ fontSize: 20 }}>{boardState.context.score}</Text>
      <Text style={{ fontWeight: "600", paddingTop: 20 }}>Lines</Text>
      <Text style={{ fontSize: 20 }}>{boardState.context.linesCleared}</Text>
      <Text style={{ fontWeight: "600", paddingTop: 20 }}>Next</Text>
      {nextShapeType === null ? null : (
        <NextShapeBoard nextShapeType={nextShapeType} />
      )}

      {/* Pause & Reset Buttons */}
      <View style={{ marginTop: 10, flexDirection: "column", gap: 20 }}>
        {(boardState.matches("Running") || boardState.matches("Paused")) && (
          <View>
            <Button
              title={boardState.matches("Paused") ? "resume" : "pause"}
              onPress={() => {
                sendBoardEvent({
                  type: boardState.matches("Paused")
                    ? "BTN.RESUME"
                    : "BTN.PAUSE",
                });
              }}
            />
          </View>
        )}
        {!boardState.matches("Initial") && (
          <View>
            <Button
              title="reset"
              onPress={() => sendBoardEvent({ type: "BTN.RESET" })}
            />
          </View>
        )}
      </View>
    </View>
  );
}
