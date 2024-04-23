import type { Shape } from "./shapes";
import { StatusBar } from "expo-status-bar";
import React, { StrictMode } from "react";
import { View, Button, Text, useWindowDimensions } from "react-native";
import Controls from "./components/Controls";
import { styles } from "./styles";
import Overlay from "./components/Overlay";
import { useMachine, useSelector } from "@xstate/react";
import { boardMachine } from "./machines/board";
import { getActiveShape } from "./machines/shape";
import RightSide from "./components/RightSide";

function hasShapeCell(shape: Shape, row: number, col: number) {
  return shape.some(([r, c]) => r === row && c === col);
}

export default function TetrisApp() {
  const { height, width, scale } = useWindowDimensions();
  const [boardState, sendBoardEvent] = useMachine(boardMachine);
  const activeShape = useSelector(boardState.context.shapeRef, (state) =>
    getActiveShape(
      state.context.type,
      state.context.rotation,
      state.context.position
    )
  );

  const isStrikeState = boardState.matches({
    Running: { BottomCollisionHandling: "HandlingStrike" },
  });

  return (
    <StrictMode>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ borderWidth: 2, borderColor: "gray" }}>
              {boardState.matches("Initial") && (
                <Overlay>
                  <Button
                    title="Start"
                    onPress={() => sendBoardEvent({ type: "BTN.START" })}
                  />
                </Overlay>
              )}

              {boardState.matches("Paused") && (
                <Overlay>
                  <Button
                    title="Resume"
                    onPress={() => sendBoardEvent({ type: "BTN.RESUME" })}
                  />
                </Overlay>
              )}

              {boardState.matches("Finished") && (
                <Overlay>
                  <View>
                    <Text style={styles.gameOverText}>Game Over</Text>
                  </View>
                  <Button
                    title="Reset"
                    onPress={() => sendBoardEvent({ type: "BTN.RESET" })}
                  />
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

            <RightSide
              boardState={boardState}
              sendBoardEvent={sendBoardEvent}
            />
          </View>

          <Controls sendBoardEvent={sendBoardEvent} />

          <StatusBar style="auto" />
        </View>
      </View>
    </StrictMode>
  );
}
