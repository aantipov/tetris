import React from "react";
import { Pressable, StyleSheet } from "react-native";

// https://reactnative.dev/docs/pressable

interface PropsT {
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const COLOR = "#FFA726"; // Orange 50 400: https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors
const COLOR_DISABLED = "#FFE0B2"; // Yellow 50 100: A lighter and desaturated version of the orange
const COLOR_PRESSED = "#FF9800"; // Yellow 50 500: A deeper orange

export default function CircleButtonWithIcon({
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  children,
}: PropsT) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      delayLongPress={150}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      hitSlop={10}
      android_ripple={{ color: "rgba(255, 255, 255, 0.3)", radius: 30 }}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 60, // Diameter of the circle
    height: 60, // Diameter of the circle
    borderRadius: 30, // Half of the width/height to make it a perfect circle
    justifyContent: "center", // Centers the icon vertically
    alignItems: "center", // Centers the icon horizontally
    elevation: 3,
    // shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.5,
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
