import * as React from "react";

const TYPING_MS = 1200;
const PAUSE_MS = 400;

export type MsgState = "pending" | "typing" | "visible";

interface UseMessageAnimationOptions {
  /** Pause after the message at this index becomes visible. Resume by
   *  setting the `resumed` flag. If not set, plays straight through. */
  pauseAfterIndex?: number;
  /** When true, resumes the animation after a pause. */
  resumed?: boolean;
}

const useMessageAnimation = (
  messageCount: number,
  options?: UseMessageAnimationOptions,
) => {
  const { pauseAfterIndex, resumed = false } = options ?? {};

  const [states, setStates] = React.useState<MsgState[]>(() => [
    "typing",
    ...Array(Math.max(0, messageCount - 1)).fill("pending"),
  ]);
  const [allMessagesDone, setAllMessagesDone] = React.useState(false);

  // Phase 1: animate messages up to (and including) pauseAfterIndex,
  // or all messages if no pause is configured.
  React.useEffect(() => {
    const end =
      pauseAfterIndex !== undefined
        ? Math.min(pauseAfterIndex + 1, messageCount)
        : messageCount;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < end; i++) {
      timeouts.push(
        setTimeout(
          () => {
            setStates((prev) => {
              const next = [...prev];
              next[i] = "visible";
              if (i + 1 < end) next[i + 1] = "typing";
              return next;
            });
          },
          i * (TYPING_MS + PAUSE_MS) + TYPING_MS,
        ),
      );
    }

    // If no pause, mark all done after the last message
    if (pauseAfterIndex === undefined) {
      timeouts.push(
        setTimeout(
          () => setAllMessagesDone(true),
          messageCount * (TYPING_MS + PAUSE_MS),
        ),
      );
    }

    return () => timeouts.forEach(clearTimeout);
  }, [messageCount, pauseAfterIndex]);

  // Phase 2: when resumed, animate the remaining messages after pauseAfterIndex.
  React.useEffect(() => {
    if (!resumed || pauseAfterIndex === undefined) return;

    const start = pauseAfterIndex + 1;
    if (start >= messageCount) {
      setAllMessagesDone(true);
      return;
    }

    // Kick off typing for the first remaining message
    setStates((prev) => {
      const next = [...prev];
      next[start] = "typing";
      return next;
    });

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = start; i < messageCount; i++) {
      const offset = i - start;
      timeouts.push(
        setTimeout(
          () => {
            setStates((prev) => {
              const next = [...prev];
              next[i] = "visible";
              if (i + 1 < messageCount) next[i + 1] = "typing";
              return next;
            });
          },
          offset * (TYPING_MS + PAUSE_MS) + TYPING_MS,
        ),
      );
    }

    const remaining = messageCount - start;
    timeouts.push(
      setTimeout(
        () => setAllMessagesDone(true),
        remaining * (TYPING_MS + PAUSE_MS),
      ),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [resumed, pauseAfterIndex, messageCount]);

  return { states, allMessagesDone };
};

export default useMessageAnimation;
