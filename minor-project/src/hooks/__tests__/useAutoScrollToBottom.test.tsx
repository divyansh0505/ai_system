import { useRef, useLayoutEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import useAutoScrollToBottom from "../useAutoScrollToBottom";

// Globally mock scrollTo for all elements and spy on it
let scrollToSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  scrollToSpy = vi.fn();
  window.HTMLElement.prototype.scrollTo = scrollToSpy;
});

function TestComponentWithPreSetScroll({
  messages,
  currentMessage,
  initialScrollTop = 0,
  scrollHeight = 300,
  clientHeight = 100,
  buffer = 0,
}: {
  messages: string[];
  currentMessage?: string;
  initialScrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
  buffer?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) {
      Object.defineProperty(el, "scrollHeight", {
        value: scrollHeight,
        writable: true,
      });
      Object.defineProperty(el, "clientHeight", {
        value: clientHeight,
        writable: true,
      });
      el.scrollTop = initialScrollTop;
    }
  }, [initialScrollTop, scrollHeight, clientHeight]);
  useAutoScrollToBottom(containerRef, [...messages, currentMessage], buffer);
  return (
    <div
      data-testid="container"
      ref={containerRef}
      style={{ height: 100, overflowY: "auto" }}
    >
      {messages.map((msg, i) => (
        <div key={i} style={{ height: 30 }}>
          {msg}
        </div>
      ))}
      {currentMessage && <div data-testid="typing">{currentMessage}</div>}
    </div>
  );
}

describe("useAutoScrollToBottom", () => {
  it("should call scrollTo when new messages arrive and user is at bottom", () => {
    const { rerender } = render(
      <TestComponentWithPreSetScroll
        messages={["msg1", "msg2"]}
        initialScrollTop={200}
        buffer={0}
      />
    );
    scrollToSpy.mockClear();
    act(() => {
      rerender(
        <TestComponentWithPreSetScroll
          messages={["msg1", "msg2", "msg3"]}
          initialScrollTop={200}
          buffer={0}
        />
      );
    });
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it("should not call scrollTo if user is not at bottom", () => {
    const { rerender } = render(
      <TestComponentWithPreSetScroll
        messages={["msg1", "msg2"]}
        initialScrollTop={0}
        buffer={0}
      />
    );
    scrollToSpy.mockClear();
    act(() => {
      rerender(
        <TestComponentWithPreSetScroll
          messages={["msg1", "msg2", "msg3"]}
          initialScrollTop={0}
          buffer={0}
        />
      );
    });
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("should handle empty messages array", () => {
    render(<TestComponentWithPreSetScroll messages={[]} buffer={0} />);
    scrollToSpy.mockClear();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("should call scrollTo on rapid message arrival if user is at bottom", () => {
    const { rerender } = render(
      <TestComponentWithPreSetScroll
        messages={["msg1"]}
        initialScrollTop={200}
        buffer={0}
      />
    );
    scrollToSpy.mockClear();
    act(() => {
      rerender(
        <TestComponentWithPreSetScroll
          messages={["msg1", "msg2"]}
          initialScrollTop={200}
          buffer={0}
        />
      );
      rerender(
        <TestComponentWithPreSetScroll
          messages={["msg1", "msg2", "msg3"]}
          initialScrollTop={200}
          buffer={0}
        />
      );
    });
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it("should call scrollTo when typing indicator (currentMessage) appears and user is at bottom", () => {
    const { rerender } = render(
      <TestComponentWithPreSetScroll
        messages={["msg1", "msg2"]}
        initialScrollTop={200}
        buffer={0}
      />
    );
    scrollToSpy.mockClear();
    act(() => {
      rerender(
        <TestComponentWithPreSetScroll
          messages={["msg1", "msg2"]}
          currentMessage="typing..."
          initialScrollTop={200}
          buffer={0}
        />
      );
    });
    expect(scrollToSpy).toHaveBeenCalled();
  });
});
