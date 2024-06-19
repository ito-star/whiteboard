const getFirebaseFunctionsUrl = () => {
  let ffUrl;

  if (process.env.REACT_APP_FIREBASE_FUNCTIONS_URL) {
    ffUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL;
  } else {
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    const region = "us-central1";

    if (window.location.hostname === "localhost") {
      ffUrl = `http://localhost:5001/${projectId}/${region}`;
    } else {
      ffUrl = `https://${region}-${projectId}.cloudfunctions.net`;
    }
  }

  return ffUrl;
};

export default getFirebaseFunctionsUrl;
