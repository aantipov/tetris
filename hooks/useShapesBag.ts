import { useState } from "react";
import type { ShapeType } from "../shapes";

const shapesTypes: ShapeType[] = ["I", "J", "L", "O", "S", "T", "Z"] as const;
const initialShapeType = "I" as const;
const initialShapesTypes: ShapeType[] = ["J", "L", "O", "S", "T", "Z"] as const;

export function useShapesBag() {
  const [shapesBag, setShapesBag] = useState(() => [...initialShapesTypes]);

  function pullShapeType() {
    if (shapesBag.length === 1) {
      setShapesBag([...shapesTypes]);
      return shapesBag[0];
    }
    const randomIndex = Math.floor(Math.random() * shapesBag.length);
    const shapeType = shapesBag[randomIndex];
    setShapesBag(shapesBag.filter((type) => type !== shapeType));
    return shapeType;
  }

  return [initialShapeType, pullShapeType] as const;
}
