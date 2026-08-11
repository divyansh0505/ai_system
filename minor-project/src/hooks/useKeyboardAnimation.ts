import { useEffect, useRef } from "react";

export function useKeyboardAnimation(rotateSpacebar: boolean = false) {
  const spacebarMainRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const spacebarMain = spacebarMainRef.current;
    if (!spacebarMain) return;

    const rect = spacebarMain.getBBox();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    spacebarMain.style.transformOrigin = `${centerX}px ${centerY}px`;
    spacebarMain.style.transform = rotateSpacebar ? "scaleY(-1)" : "scaleY(1)";
    spacebarMain.style.transition = "transform 0.0001s  ease-out";
  }, [rotateSpacebar]);

  return { spacebarMainRef };
}
