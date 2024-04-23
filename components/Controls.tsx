import { View, Text } from "react-native";
import CircleButtonWithIcon from "./Button";
import React from "react";
import MIcons from "@expo/vector-icons/MaterialIcons";
import type { BoardEventT, BoardStateT } from "../machines/board";
import SmallButton from "./SmallButton";

interface PropsT {
  boardState: BoardStateT;
  sendBoardEvent: (event: BoardEventT) => void;
}

export default function Controls({ boardState, sendBoardEvent }: PropsT) {
  const btnProps = (() => {
    if (boardState.matches("Initial")) {
      return {
        text: "Start",
        onPress: () => sendBoardEvent({ type: "BTN.START" }),
        disabled: false,
      };
    } else if (boardState.matches("Running")) {
      return {
        text: "Pause",
        onPress: () => sendBoardEvent({ type: "BTN.PAUSE" }),
        disabled: false,
      };
    } else if (boardState.matches("Paused")) {
      return {
        text: "Resume",
        onPress: () => sendBoardEvent({ type: "BTN.RESUME" }),
        disabled: false,
      };
    } else {
      // finished state
      return {
        text: "Pause",
        onPress: () => {},
        disabled: true,
      };
    }
  })();
  return (
    <View style={{ paddingTop: 10, backgroundColor: "#78909C" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <SmallButton
          text={btnProps.text}
          onPress={btnProps.onPress}
          disabled={btnProps.disabled}
        />
        <SmallButton
          text="Reset"
          disabled={boardState.matches("Initial")}
          onPress={() => sendBoardEvent({ type: "BTN.RESET" })}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
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
              onPressIn={() => sendBoardEvent({ type: "BTN.DROP" })}
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

        {/* Rotate button */}
        <View style={{ marginLeft: 20, marginTop: 60 }}>
          <CircleButtonWithIcon
            onPress={() => sendBoardEvent({ type: "BTN.ROTATE" })}
          >
            <MIcons name="rotate-left" size={48} color="white" />
          </CircleButtonWithIcon>
        </View>
      </View>
    </View>
  );
}
