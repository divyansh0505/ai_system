import { useEffect } from "react";

export const ThrowError = () => {
  useEffect(() => {
    throw new Error("Test error");
  }, []);

  return <div>This should not be visible</div>;
};
