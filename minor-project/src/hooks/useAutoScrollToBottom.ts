import { useEffect, useCallback, RefObject } from "react";

/**
 * Custom hook to auto-scroll a container to the bottom when dependencies change,
 * but only if the user is already at/near the bottom.
 * @param containerRef - Ref to the scrollable container
 * @param deps - Dependency array (e.g., [...messages, currentMessage])
 * @param buffer - Optional buffer in px for 'at bottom' detection (default 150)
 */
function useAutoScrollToBottom(
  containerRef: RefObject<HTMLElement>,
  deps: unknown[],
  buffer: number = 150,
) {
  const isAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      buffer
    );
  }, [containerRef, buffer]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [containerRef]);

  useEffect(() => {
    if (isAtBottom()) {
      scrollToBottom();
    }
  }, deps);
}

export default useAutoScrollToBottom;
