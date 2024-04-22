import { StyleSheet } from "react-native";
const cellStyle = {
  rowGap: 0,
  columnGap: 0,
  width: 20,
  height: 20,
  borderWidth: 2,
  borderColor: "#E0E0E0",
};

export const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "100%",
    height: "100%",
    paddingTop: 80,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
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
