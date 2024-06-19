import { useMemo, useEffect } from "react";
import _debounce from "lodash/debounce";

const useDebouncedCallback = (callback, deps, wait, options) => {
  const debouncedCallback = useMemo(() => {
    return _debounce(callback, wait, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, wait, options]);

  useEffect(() => {
    return debouncedCallback.cancel;
  }, [debouncedCallback]);

  return debouncedCallback;
};

export default useDebouncedCallback;
