import firebase from "firebase/compat/app";
import "firebase/compat/database";

import { initFirebase, emailToId } from "../utils";

initFirebase();

export const makeUser = async (fbUser) => {
  const user = {
    wbid: fbUser.email && emailToId(fbUser.email),
    uid: fbUser.uid,
    isAnonymous: !!fbUser.isAnonymous,
    email: fbUser.email,
    emailVerified: fbUser.emailVerified,
    displayName: fbUser.displayName || fbUser.email || "Guest",
    photoURL: fbUser.photoURL,
    providerData: fbUser.providerData,
    token: await fbUser.getIdTokenResult(),
  };

  return user;
};

export const updateProfileInFirebase = async (fbUser, newProfile) => {
  await fbUser.updateProfile(newProfile);
  await fbUser.getIdToken(true);
};

export const updateProfileInDb = async (fbUser, newProfile) => {
  const userId = emailToId(fbUser.email);

  const update = {};

  if (newProfile.displayName) {
    update.display_name = newProfile.displayName;
  }

  return firebase.database().ref(`users/${userId}`).update(update);
};

export const updateProfile = async (fbUser, newProfile) => {
  await updateProfileInFirebase(fbUser, newProfile);
  await updateProfileInDb(fbUser, newProfile);

  return makeUser(fbUser);
};
