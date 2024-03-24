import { useState } from "react";

export default function useForceUpdate() {
  const [tick, setTick] = useState(0);
  return [tick, () => setTick((tick) => tick + 1)] as const;
}
