import React from "react";
import { Pressable, StyleSheet, View, Text } from "react-native";

// https://reactnative.dev/docs/pressable

interface PropsT {
  onPress?: () => void;
  text: string;
  disabled?: boolean;
}

const COLOR = "#FFEE58"; // Yellow 50 400: https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors
const COLOR_DISABLED = "#FFF9C4"; // Yellow 50 100: A lighter and desaturated version of the yellow
const COLOR_PRESSED = "#FDD835"; // Yellow 50 600: A deeper yellow

export default function SmallCircleButton({
  text,
  onPress,
  disabled = false,
}: PropsT) {
  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        hitSlop={20}
      ></Pressable>
      <Text>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3, // for Android shadow
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.5,
    margin: 8,
    backgroundColor: COLOR,
    transform: [{ scale: 1 }], // no scale by default
  },
  buttonPressed: {
    backgroundColor: COLOR_PRESSED, // darker when pressed
    transform: [{ scale: 0.96 }], // slight scale down when pressed
    shadowOpacity: 0.3, // less shadow when pressed
  },
  buttonDisabled: {
    backgroundColor: COLOR_DISABLED, // lighter or greyed out background
    opacity: 0.5, // reduced opacity
    shadowOpacity: 0.2, // less shadow
    elevation: 0, // no elevation for Android
  },
});
