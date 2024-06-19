import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { useHistory } from "react-router-dom";
import _get from "lodash/get";

import UserContext from "./UserContext";
import { makeUser, updateProfile } from "../User/profile";
import {
  initFirebase,
  useDestination,
  makeConfirmEmailVerifiedUrl,
  emailToId,
} from "../utils";
import { getAuthProvider } from "./utils";
import { initRoles } from "../access";
import DatabaseEventManager from "../DatabaseEventManager";
import Loader from "../components/Loader";
import { ThemeColors } from "../constant";

initFirebase();

const makeUsageInfo = (usage) => {
  let usageInfo = usage;

  if (!usageInfo) {
    usageInfo = {
      boards: 0,
      storage: 0,
    };
  }

  return usageInfo;
};

const makeAnonUser = (wbUser) => {
  return {
    ...wbUser,
    usage: makeUsageInfo(),
  };
};

export default function UserProvider({ children }) {
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState();
  const history = useHistory();
  const destination = useDestination();

  useEffect(() => {
    const runner = async () => {
      await initRoles();
      setRolesLoaded(true);
    };
    runner();
  });

  useEffect(() => {
    const dbEventManager = new DatabaseEventManager();

    // Listen authenticated user
    const unsubscriber = firebase
      .auth()
      .onIdTokenChanged(async (currentUser) => {
        dbEventManager.unsubscribe();

        try {
          if (currentUser) {
            // User is signed in.
            let wbUser = await makeUser(currentUser);
            wbUser = makeAnonUser(wbUser);

            if (!wbUser.isAnonymous) {
              const usageRef = firebase
                .database()
                .ref(`metadata/${wbUser.wbid}/usage`);
              const usageSnap = await usageRef.once("value");

              const tutorialRef = firebase
                .database()
                .ref(`users/${wbUser.wbid}/tutorial`);
              const tutorialSnap = await tutorialRef.once("value");

              const newBoardUiAnnouncementRef = firebase
                .database()
                .ref(`users/${wbUser.wbid}/hasSeenNewButtonUiAnnouncement`);
              const newBoardUiAnnouncementSnap = await newBoardUiAnnouncementRef.once(
                "value"
              );

              const brandingPaletteRef = firebase
                .database()
                .ref(`/users/${wbUser.wbid}/branding`);
              const brandingPalleteSnap = await brandingPaletteRef.once(
                "value"
              );

              wbUser = {
                ...wbUser,
                usage: makeUsageInfo(usageSnap.val()),
                tutorialStep: tutorialSnap.val() || 1,
                hasSeenNewButtonUiAnnouncement: !!newBoardUiAnnouncementSnap.val(),
                branding: {
                  boardHeaderColor: ThemeColors.NOCOLOR,
                  boardBodyColor: ThemeColors.NOCOLOR,
                  ...(brandingPalleteSnap.val() || {}),
                },
              };

              const callback = (snapshot) => {
                setUser((prevUser) => {
                  return {
                    ...prevUser,
                    usage: makeUsageInfo(snapshot.val()),
                  };
                });
              };

              const tutorialCb = (snap) => {
                setUser((prevUser) => {
                  return {
                    ...prevUser,
                    tutorialStep: snap.val() || 1,
                  };
                });
              };

              const brandingCb = (snap) => {
                setUser((prevUser) => {
                  return {
                    ...prevUser,
                    branding: {
                      boardHeaderColor: ThemeColors.NOCOLOR,
                      boardBodyColor: ThemeColors.NOCOLOR,
                      ...(snap.val() || {}),
                    },
                  };
                });
              };

              const newBoardUiAnnouncementCb = (snap) => {
                setUser((prevUser) => {
                  return {
                    ...prevUser,
                    hasSeenNewButtonUiAnnouncement: !!snap.val(),
                  };
                });
              };

              dbEventManager.on(usageRef, "value", callback);

              dbEventManager.on(tutorialRef, "value", tutorialCb);

              dbEventManager.on(brandingPaletteRef, "value", brandingCb);

              dbEventManager.on(
                newBoardUiAnnouncementRef,
                "value",
                newBoardUiAnnouncementCb
              );
            }

            setUser(wbUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          // Most probably a connection error. Handle appropriately.
        } finally {
          setLoadingUser(false);
        }
      });

    // Unsubscribe auth listener on unmount
    return () => {
      unsubscriber();
      dbEventManager.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const dbEventManager = new DatabaseEventManager();

    const unsubscriber = firebase
      .auth()
      .onAuthStateChanged(async (currentUser) => {
        // Remove previous listener.
        dbEventManager.unsubscribe();
        // On user login add new listener.
        if (currentUser && !currentUser.isAnonymous) {
          // Check if refresh is required.
          const metadataRef = firebase
            .database()
            .ref(`metadata/${emailToId(currentUser.email)}/refreshTime`);
          const callback = async () => {
            // Force refresh to pick up the latest custom claims changes.
            // Note this is always triggered on first call. Further optimization could be
            // added to avoid the initial trigger when the token is issued and already contains
            // the latest claims.
            await currentUser.getIdToken(true);
          };
          // Subscribe new listener to changes on that node.
          dbEventManager.on(metadataRef, "value", callback);
        }
      });

    // Unsubscribe auth listener on unmount
    return () => {
      unsubscriber();
      dbEventManager.unsubscribe();
    };
  }, []);

  const contextVal = {
    user,
    loadingUser,
    async getCurrentOrAnonymousUser() {
      if (user) {
        return user;
      }

      const result = await firebase.auth().signInAnonymously();
      const anonUser = await makeUser(result.user);

      return makeAnonUser(anonUser);
    },
    async setFromFirebase(fbUser) {
      const wbUser = await makeUser(fbUser);

      setUser((prevUser) => {
        return {
          ...prevUser,
          ...wbUser,
        };
      });
    },
    async updateUserProfile(newProfile) {
      const { currentUser } = firebase.auth();

      if (!currentUser) {
        return;
      }

      const updatedUser = await updateProfile(currentUser, newProfile);

      setUser((prevUser) => {
        return {
          ...prevUser,
          ...updatedUser,
        };
      });
    },
    async reauthenticate(providerId, credential) {
      const { currentUser } = firebase.auth();

      if (!currentUser) {
        return Promise.resolve();
      }

      if (providerId === firebase.auth.PhoneAuthProvider.PROVIDER_ID) {
        return currentUser.reauthenticateWithPhoneNumber(
          credential.phoneNumber,
          credential.applicaionVerifier
        );
      }

      if (credential) {
        return currentUser.reauthenticateWithCredential(credential);
      }

      const authProvider = getAuthProvider(providerId);

      return currentUser.reauthenticateWithPopup(authProvider);
    },
    async updatePassword(currentPassword, newPassword, confirmNewPassword) {
      const { currentUser } = firebase.auth();

      if (currentPassword) {
        if (!currentPassword) {
          throw new Error(
            "Changing your password requires that you enter your current one"
          );
        }

        if (newPassword !== confirmNewPassword) {
          throw new Error(
            'The "New Password" field must match the "Confirm New Password Field"'
          );
        }

        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

        // eslint-disable-next-line react/no-this-in-sfc
        await this.reauthenticate(
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          credential
        );

        if (!currentUser) {
          return Promise.resolve();
        }

        return currentUser.updatePassword(newPassword);
      }

      throw new Error("Please enter your current password");
    },
    async sendEmailVerification(inDestination) {
      const { currentUser } = firebase.auth();
      if (!currentUser) {
        return Promise.resolve();
      }

      const actionCodeSettings = {
        url: makeConfirmEmailVerifiedUrl(history, inDestination || destination),
      };

      return currentUser.sendEmailVerification(actionCodeSettings);
    },
    async updateTutorialStep(step) {
      if (!user) {
        return Promise.resolve();
      }

      const tutorialRef = firebase.database().ref(`users/${user.wbid}`);
      return tutorialRef.update({
        tutorial: step,
        hasSeenNewButtonUiAnnouncement: true,
      });
    },
    async resetTutorial() {
      if (!user) {
        return Promise.resolve();
      }

      const boardsUsed = _get(user, "usage.boards", 0);
      // eslint-disable-next-line react/no-this-in-sfc
      return this.updateTutorialStep(boardsUsed === 0 ? 1 : 2);
    },
    async setHasSeenNewButtonUiAnnouncement() {
      if (!user) {
        return Promise.resolve();
      }

      const userRef = firebase.database().ref(`users/${user.wbid}`);
      return userRef.update({
        hasSeenNewButtonUiAnnouncement: true,
      });
    },
  };

  contextVal.updatePassword = contextVal.updatePassword.bind(contextVal);
  contextVal.resetTutorial = contextVal.resetTutorial.bind(contextVal);

  const loading = <Loader isFullScreen />;

  if (loadingUser) {
    return loading;
  }

  if (!rolesLoaded) {
    return loading;
  }

  return (
    <UserContext.Provider value={contextVal}>{children}</UserContext.Provider>
  );
}
