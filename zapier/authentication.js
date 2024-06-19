/* eslint-disable camelcase */
const config = require("./config");

const tokenUrl = `${config.WHATBOARD_OIDC_URL}/token`;

// const getAccessToken = async (z, bundle) => {
//   const response = await z.request({
//     url: `${config.WHATBOARD_OIDC_URL}/token`,
//     method: "POST",
//     body: {
//       client_id: process.env.CLIENT_ID,
//       client_secret: process.env.CLIENT_SECRET,
//       grant_type: "authorization_code",
//       code: bundle.inputData.code,

//       // Extra data can be pulled from the querystring. For instance:
//       // 'accountDomain': bundle.cleanedRequest.querystring.accountDomain
//     },
//     headers: { "content-type": "application/x-www-form-urlencoded" },
//   });

//   // If you're using core v9.x or older, you should call response.throwForStatus()
//   // or verify response.status === 200 before you continue.

//   // This function should return `access_token`.
//   // If your app does an app refresh, then `refresh_token` should be returned here
//   // as well
//   return {
//     access_token: response.data.access_token,
//     refresh_token: response.data.refresh_token,
//   };
// };

const refreshAccessToken = async (z, bundle) => {
  try {
    const response = await z.request({
      url: tokenUrl,
      method: "POST",
      body: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: bundle.authData.refresh_token,
      },
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // This function should return `access_token`.
    // If the refresh token stays constant, no need to return it.
    // If the refresh token does change, return it here to update the stored value in
    // Zapier
    return response.data;
  } catch (e) {
    if (e.name === "ResponseError") {
      throw new z.errors.ExpiredAuthError(
        "Your session has expired. Please re-authenticate."
      );
    }

    throw e;
  }
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeBearerToken = (request, z, bundle) => {
  if (request.headers.Authorization) {
    return request;
  }

  if (request.url === tokenUrl) {
    return request;
  }

  if (bundle.authData && bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }

  return request;
};

// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
// eslint-disable-next-line no-unused-vars
// const test = (z, bundle) =>
//   z.request({ url: `${config.WHATBOARD_OIDC_URL}/me` });

module.exports = {
  config: {
    // OAuth2 is a web authentication standard. There are a lot of configuration
    // options that will fit most any situation.
    type: "oauth2",
    oauth2Config: {
      authorizeUrl: {
        method: "GET",
        url: `${config.WHATBOARD_OIDC_URL}/auth`,
        params: {
          client_id: "{{process.env.CLIENT_ID}}",
          scope: "openid offline_access",
          state: "{{bundle.inputData.state}}",
          redirect_uri: "{{bundle.inputData.redirect_uri}}",
          response_type: "code",
          prompt: "consent",
        },
      },
      getAccessToken: {
        method: "POST",
        url: tokenUrl,
        body: {
          client_id: "{{process.env.CLIENT_ID}}",
          client_secret: "{{process.env.CLIENT_SECRET}}",
          code: "{{bundle.inputData.code}}",
          grant_type: "authorization_code",
          redirect_uri: "{{bundle.inputData.redirect_uri}}",
          // Extra data can be pulled from the querystring. For instance:
          // 'accountDomain': bundle.cleanedRequest.querystring.accountDomain
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      refreshAccessToken,
      autoRefresh: true,
    },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [],

    // The test method allows Zapier to verify that the credentials a user provides
    // are valid. We'll execute this method whenever a user connects their account for
    // the first time.
    test: {
      method: "GET",
      url: `${config.WHATBOARD_API_URL}/me`,
    },

    // This template string can access all the data returned from the auth test. If
    // you return the test object, you'll access the returned data with a label like
    // `{{json.X}}`. If you return `response.data` from your test, then your label can
    // be `{{X}}`. This can also be a function that returns a label. That function has
    // the standard args `(z, bundle)` and data returned from the test can be accessed
    // in `bundle.inputData.X`.
    connectionLabel: "{{email}}",
  },
  befores: [includeBearerToken],
  afters: [],
};
