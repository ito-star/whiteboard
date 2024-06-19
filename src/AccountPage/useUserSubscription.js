import { useEffect } from "react";
import { getUserSubscription } from "../stripe";

const useUserSubscription = (user, setRole, setLoaded) => {
  useEffect(() => {
    const loadSubscription = async () => {
      const doc = await getUserSubscription(user);
      if (doc) {
        setRole(doc.data().role);
      }
      setLoaded(true);
    };
    loadSubscription();
  }, [user, setRole, setLoaded]);
};

export default useUserSubscription;
