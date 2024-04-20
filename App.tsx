import type { Shape } from "./shapes";
import { StatusBar } from "expo-status-bar";
import React, { StrictMode } from "react";
import { View, Button, Text } from "react-native";
import MIcons from "@expo/vector-icons/MaterialIcons";
import CircleButtonWithIcon from "./components/Button";
import NextShapeBoard from "./components/NextShapeBoard";
import { styles } from "./styles";
import Overlay from "./components/Overlay";
import { useMachine, useSelector } from "@xstate/react";
import { boardMachine } from "./machines/board";
import { getActiveShape } from "./machines/shape";

function hasShapeCell(shape: Shape, row: number, col: number) {
  return shape.some(([r, c]) => r === row && c === col);
}

export default function TetrisApp() {
  const [boardState, sendBoardEvent] = useMachine(boardMachine);
  const activeShape = useSelector(boardState.context.shapeRef, (state) =>
    getActiveShape(
      state.context.type,
      state.context.rotation,
      state.context.position
    )
  );
  const nextShapeType = boardState.context.nextShape;

  function reset() {
    sendBoardEvent({ type: "BTN.RESET" });
  }

  const isStrikeState = boardState.matches({
    Running: { BottomCollisionHandling: "HandlingStrike" },
  });

  return (
    <StrictMode>
      <View style={styles.container}>
        <Text>S: {JSON.stringify(boardState.value)}</Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ borderWidth: 2, borderColor: "gray" }}>
            {boardState.matches("Initial") && (
              <Overlay>
                <Button
                  title="Start"
                  onPress={() => {
                    sendBoardEvent({ type: "BTN.START" });
                  }}
                />
              </Overlay>
            )}

            {boardState.matches("Paused") && (
              <Overlay>
                <Button
                  title="Resume"
                  onPress={() => {
                    sendBoardEvent({ type: "BTN.RESUME" });
                  }}
                />
              </Overlay>
            )}

            {boardState.matches("Finished") && (
              <Overlay>
                <View>
                  <Text
                    style={{
                      color: "red",
                      shadowColor: "black",
                      elevation: 10,
                      fontSize: 28,
                      fontWeight: "800",
                      marginBottom: 40,
                    }}
                  >
                    Game Over
                  </Text>
                </View>
                <Button title="Reset" onPress={reset} />
              </Overlay>
            )}

            {boardState.context.grid.map((row, i) => {
              const isStrikeRow =
                isStrikeState && row.every((cell) => cell === 1);
              return (
                <View key={i} style={{ flexDirection: "row" }}>
                  {row.map((cell, j) => {
                    return (
                      <View
                        key={j}
                        style={
                          isStrikeRow
                            ? styles.fullStrikeCell
                            : cell === 1 ||
                              (!boardState.matches("Initial") &&
                                activeShape &&
                                hasShapeCell(activeShape, i, j))
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
          <View style={{ paddingLeft: 20 }}>
            <Text style={{ fontWeight: "600" }}>Score</Text>
            <Text style={{ fontSize: 20 }}>{boardState.context.score}</Text>
            <Text style={{ fontWeight: "600", paddingTop: 20 }}>Lines</Text>
            <Text style={{ fontSize: 20 }}>
              {boardState.context.linesCleared}
            </Text>
            <Text style={{ fontWeight: "600", paddingTop: 20 }}>Next</Text>
            {nextShapeType === null ? null : (
              <NextShapeBoard nextShapeType={nextShapeType} />
            )}
          </View>
        </View>

        {/* Controls */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 30,
            marginTop: 30,
            marginBottom: 30,
          }}
        >
          {/* Move Left Button */}
          <View style={{ paddingTop: 40 }}>
            <CircleButtonWithIcon
              onPressIn={() => sendBoardEvent({ type: "BTN.LEFT.PRESSED" })}
              onLongPress={() =>
                sendBoardEvent({ type: "BTN.LEFT.LONG_PRESSED" })
              }
              onPressOut={() => sendBoardEvent({ type: "BTN.LEFT.RELEASED" })}
            >
              <MIcons name="arrow-back" size={48} color="white" />
            </CircleButtonWithIcon>
          </View>

          {/* MoveDown & Drop buttons */}
          <View>
            <CircleButtonWithIcon
              onPressIn={() => sendBoardEvent({ type: "BTN.DOWN.PRESSED" })}
              onLongPress={() =>
                sendBoardEvent({ type: "BTN.DOWN.LONG_PRESSED" })
              }
              onPressOut={() => sendBoardEvent({ type: "BTN.DOWN.RELEASED" })}
            >
              <MIcons name="arrow-downward" size={48} color="white" />
            </CircleButtonWithIcon>

            <View style={{ marginTop: 40 }}>
              <CircleButtonWithIcon
                onPress={() => {
                  sendBoardEvent({ type: "BTN.DROP" });
                }}
              >
                <MIcons name="vertical-align-bottom" size={48} color="white" />
              </CircleButtonWithIcon>
            </View>
          </View>

          {/* Move Right button */}
          <View style={{ paddingTop: 40 }}>
            <CircleButtonWithIcon
              onPressIn={() => sendBoardEvent({ type: "BTN.RIGHT.PRESSED" })}
              onLongPress={() =>
                sendBoardEvent({ type: "BTN.RIGHT.LONG_PRESSED" })
              }
              onPressOut={() => sendBoardEvent({ type: "BTN.RIGHT.RELEASED" })}
            >
              <MIcons name="arrow-forward" size={48} color="white" />
            </CircleButtonWithIcon>
          </View>

          {/* Drop button */}
          <CircleButtonWithIcon
            onPress={() => sendBoardEvent({ type: "BTN.ROTATE" })}
          >
            <MIcons name="rotate-left" size={48} color="white" />
          </CircleButtonWithIcon>
        </View>

        {/* Reset Button */}
        <View style={{ marginTop: 10, flexDirection: "row" }}>
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
            <View style={{ marginLeft: 20 }}>
              <Button title="reset" onPress={reset} />
            </View>
          )}
        </View>
        <StatusBar style="auto" />
      </View>
    </StrictMode>
  );
}
