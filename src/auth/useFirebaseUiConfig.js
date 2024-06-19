import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import * as firebaseui from "firebaseui";
import { createPath } from "history";
import { useHistory } from "react-router-dom";
import { useLocalStorage } from "react-use";
import { updateProfileInDb, updateProfileInFirebase } from "../User/profile";
import {
  initFirebase,
  useDestination,
  makeConfirmEmailVerifiedUrl,
  makeDbUpdateObj,
} from "../utils";
import { fbUiSignInOptions } from "./utils";

initFirebase();

export const doSignInSuccess = async (
  authResult,
  redirectUrl,
  history,
  destination,
  setFromFirebase
) => {
  const { user } = authResult;
  const promises = [];

  if (
    authResult.additionalUserInfo.isNewUser ||
    authResult.operationType === "link"
  ) {
    if (!user.emailVerified) {
      promises.push(
        user.sendEmailVerification({
          url: makeConfirmEmailVerifiedUrl(history, destination),
        })
      );
    }

    const profileFromProvider = authResult.additionalUserInfo.profile || {};
    const profile = {
      displayName: user.displayName || profileFromProvider.name,
      photoURL: user.photoURL || profileFromProvider.picture,
    };

    promises.push(updateProfileInDb(user, profile));

    if (authResult.operationType === "link") {
      promises.push(
        updateProfileInFirebase(user, profile).then(() => {
          setFromFirebase(user);
        })
      );
    }
  }

  await Promise.all(promises);
};

export default function useFirebaseUiConfig() {
  const history = useHistory();
  const destination = useDestination();
  const [, setAuthResult] = useLocalStorage("whatboard-auth-result");

  const destPath = createPath(destination);
  const searchParams = new URLSearchParams();
  searchParams.set("destination", destPath);

  // See https://github.com/firebase/firebaseui-web/#configuration
  const uiConfig = {
    autoUpgradeAnonymousUsers: true,
    signInFlow: "redirect",
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: fbUiSignInOptions,
    signInSuccessUrl: history.createHref({
      pathname: "/sign-in-success",
      search: `?${searchParams}`,
    }),
    callbacks: {
      signInSuccessWithAuthResult: (authResult) => {
        const { additionalUserInfo, operationType } = authResult;

        setAuthResult({
          additionalUserInfo,
          operationType,
        });

        return true;
      },
      signInFailure: async (error) => {
        // See https://github.com/firebase/firebaseui-web#handling-anonymous-user-upgrade-merge-conflicts
        if (error.code !== "firebaseui/anonymous-upgrade-merge-conflict") {
          // eslint-disable-next-line no-console
          return;
        }

        // The credential the user tried to sign in with.
        const cred = error.credential;
        const anonUser = firebase.auth().currentUser;
        const readOnlyAccessRef = firebase
          .database()
          .ref(`/readonly-access/${anonUser.uid}`);
        const readOnlyAccessSnap = await readOnlyAccessRef.once("value");
        const readOnlyAccess = readOnlyAccessSnap.val();
        await readOnlyAccessRef.remove();
        const authResult = await firebase.auth().signInWithCredential(cred);
        const updates = makeDbUpdateObj(
          readOnlyAccess,
          `/readonly-access/${authResult.user.uid}`
        );

        await firebase.database().ref().update(updates);
        await anonUser.delete();
      },
    },
    tosUrl: history.createHref({
      pathname: "/terms",
    }),
    privacyPolicyUrl: history.createHref({
      pathname: "/privacy",
    }),
  };

  return uiConfig;
}
