import { useState } from "react";
import type { ShapeType } from "../shapes";

const shapesTypes: ShapeType[] = ["I", "J", "L", "O", "S", "T", "Z"] as const;

export function useShapesBag() {
  const [shapesBag, setShapesBag] = useState(() => [...shapesTypes]);

  function pullShapeType() {
    if (shapesBag.length === 0) {
      setShapesBag([...shapesTypes]);
    }

    const randomIndex = Math.floor(Math.random() * shapesBag.length);
    const shapeType = shapesBag[randomIndex];
    setShapesBag((prev) => prev.filter((type) => type !== shapeType));
    return shapeType;
  }

  return pullShapeType;
}
