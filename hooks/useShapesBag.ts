import { useState } from "react";
import type { ShapeTypeT } from "../shapes";

const shapesTypes: ShapeTypeT[] = ["I", "J", "L", "O", "S", "T", "Z"] as const;
const initialShapeType = "I" as const;
const initialShapesTypes: ShapeTypeT[] = [
  "J",
  "L",
  "O",
  "S",
  "T",
  "Z",
] as const;

export function useShapesBag() {
  const [shapesBag, setShapesBag] = useState(() => [...initialShapesTypes]);
  const [shapeType, setShapeType] = useState<ShapeTypeT>(initialShapeType);

  function pullShapeType() {
    if (shapesBag.length === 1) {
      setShapeType(shapesBag[0]);
      setShapesBag([...shapesTypes]);
    } else {
      const randomIndex = Math.floor(Math.random() * shapesBag.length);
      const shapeType = shapesBag[randomIndex];
      setShapeType(shapeType);
      setShapesBag(shapesBag.filter((type) => type !== shapeType));
    }
  }

  function reset() {
    setShapeType(initialShapeType);
    setShapesBag([...initialShapesTypes]);
  }

  return [shapeType, pullShapeType, reset] as const;
}
