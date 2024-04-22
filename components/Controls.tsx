import { View } from "react-native";
import CircleButtonWithIcon from "./Button";
import React from "react";
import MIcons from "@expo/vector-icons/MaterialIcons";
import type { BoardEventT } from "../machines/board";

interface PropsT {
  sendBoardEvent: (event: BoardEventT) => void;
}

export default function Controls({ sendBoardEvent }: PropsT) {
  return (
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
          onLongPress={() => sendBoardEvent({ type: "BTN.LEFT.LONG_PRESSED" })}
          onPressOut={() => sendBoardEvent({ type: "BTN.LEFT.RELEASED" })}
        >
          <MIcons name="arrow-back" size={48} color="white" />
        </CircleButtonWithIcon>
      </View>

      {/* MoveDown & Drop buttons */}
      <View>
        <CircleButtonWithIcon
          onPressIn={() => sendBoardEvent({ type: "BTN.DOWN.PRESSED" })}
          onLongPress={() => sendBoardEvent({ type: "BTN.DOWN.LONG_PRESSED" })}
          onPressOut={() => sendBoardEvent({ type: "BTN.DOWN.RELEASED" })}
        >
          <MIcons name="arrow-downward" size={48} color="white" />
        </CircleButtonWithIcon>

        <View style={{ marginTop: 40 }}>
          <CircleButtonWithIcon
            onPress={() => sendBoardEvent({ type: "BTN.DROP" })}
          >
            <MIcons name="vertical-align-bottom" size={48} color="white" />
          </CircleButtonWithIcon>
        </View>
      </View>

      {/* Move Right button */}
      <View style={{ paddingTop: 40 }}>
        <CircleButtonWithIcon
          onPressIn={() => sendBoardEvent({ type: "BTN.RIGHT.PRESSED" })}
          onLongPress={() => sendBoardEvent({ type: "BTN.RIGHT.LONG_PRESSED" })}
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
  );
}
