import { View } from "react-native";

export default function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          opacity: 1,
          zIndex: 2,
        }}
      >
        {children}
      </View>
      <View
        style={{
          position: "absolute",
          backgroundColor: "black",
          width: "100%",
          height: "100%",
          opacity: 0.3,
          zIndex: 1,
        }}
      ></View>
    </View>
  );
}
