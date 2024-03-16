import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface PropsT {
  onPress: () => void;
  backgroundColor?: string;
  children: React.ReactNode;
}

export default function CircleButtonWithIcon({
  onPress,
  backgroundColor = "#007bff",
  children,
}: PropsT) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.circle, { backgroundColor }]}
      android_ripple={{ color: "#005BBE", radius: 30 }}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 60, // Diameter of the circle
    height: 60, // Diameter of the circle
    borderRadius: 30, // Half of the width/height to make it a perfect circle
    justifyContent: "center", // Centers the icon vertically
    alignItems: "center", // Centers the icon horizontally
  },
});
