import { StyleSheet, StatusBar } from "react-native";
const cellStyle = {
  rowGap: 0,
  columnGap: 0,
  width: 20,
  height: 20,
  borderWidth: 1,
  borderColor: "#E0E0E0",
};

export const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "100%",
    height: "100%",
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  innerContainer: {
    width: 300,
    height: 660,
    backgroundColor: "white",
    overflow: "hidden",
  },
  rightSide: {
    backgroundColor: "gray",
    flexGrow: 1,
    paddingLeft: 12,
  },
  cell: {
    ...cellStyle,
    backgroundColor: "white",
  },
  fullCell: {
    ...cellStyle,
    backgroundColor: "black",
  },
  fullStrikeCell: {
    ...cellStyle,
    backgroundColor: "#7CB342",
  },
  gameOverText: {
    color: "red",
    shadowColor: "black",
    elevation: 10,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 40,
  },
});
