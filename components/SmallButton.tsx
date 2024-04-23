import React from "react";
import { Pressable, StyleSheet, View, Text } from "react-native";

// https://reactnative.dev/docs/pressable

interface PropsT {
  onPress?: () => void;
  text: string;
  disabled?: boolean;
}

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
          disabled && styles.buttonDisabled,
          {
            backgroundColor: pressed ? "#FFEB3B" : "#FFEE58", // darker when pressed
            transform: [{ scale: pressed ? 0.96 : 1 }], // slight scale down when pressed
            shadowOpacity: pressed ? 0.3 : 0.5, // less shadow when pressed
          },
        ]}
        android_ripple={{ color: "#005BBE", radius: 30 }}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.5,
    margin: 8,
    backgroundColor: "#FFEE58", // initial color
  },
  buttonDisabled: {
    backgroundColor: "#cccccc", // lighter or greyed out background
    opacity: 0.5, // reduced opacity
    shadowOpacity: 0.2, // less shadow
    elevation: 0, // no elevation for Android
  },
});
