import React, { useMemo } from "react";
import Frame, { FrameContextConsumer } from "react-frame-component";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

type FrameWrapperProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const FrameCacheProvider: React.FC<{
  document: Document;
  children: React.ReactNode;
}> = ({ document, children }) => {
  const cache = useMemo(
    () =>
      createCache({
        key: "humanisys-ai",
        container: document.head,
      }),
    [document],
  );

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};

const FrameWrapper: React.FC<FrameWrapperProps> = ({
  children,
  className = "",
  style = {},
}) => (
  <Frame style={style} className={className} allowFullScreen>
    <FrameContextConsumer>
      {({ document }) =>
        document ? (
          <FrameCacheProvider document={document}>
            {children}
          </FrameCacheProvider>
        ) : null
      }
    </FrameContextConsumer>
  </Frame>
);

export default FrameWrapper;
