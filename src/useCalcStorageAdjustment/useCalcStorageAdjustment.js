import { usePrevious, useAsync, useGetSet } from "react-use";
import useUser from "../auth/useUser";
import {
  shouldUpdateStorageAdjustment,
  calcStorageAdjustment,
} from "./calcStorageAdjustment";

// Not quite ready for use, yet
const useCalcStorageAdjustment = (block) => {
  const { user, loadingUser } = useUser();
  const [getStorageAdjustment, setStorageAdjustment] = useGetSet(0);
  const prevBlock = usePrevious(block);
  const updateStorageAdjustment = shouldUpdateStorageAdjustment(
    block,
    prevBlock
  );

  const state = useAsync(async () => {
    let storageAdjustment = getStorageAdjustment();

    if (!user || loadingUser) {
      storageAdjustment = 0;
    } else {
      storageAdjustment += await calcStorageAdjustment(block, prevBlock, user);
    }

    setStorageAdjustment(storageAdjustment);
    return storageAdjustment;
  }, [updateStorageAdjustment, user, loadingUser]);

  return state;
};

export default useCalcStorageAdjustment;
