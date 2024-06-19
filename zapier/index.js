const resources = require("./resources");
const triggers = require("./triggers");
const creates = require("./creates");

const {
  config: authentication,
  befores = [],
  afters = [],
} = require("./authentication");

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  // eslint-disable-next-line global-require
  version: require("./package.json").version,
  // eslint-disable-next-line global-require
  platformVersion: require("zapier-platform-core").version,
  authentication,
  beforeRequest: [...befores],

  afterResponse: [...afters],

  resources,

  // If you want your trigger to show up, you better include it here!
  triggers,

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates,
};

// Finally, export the app.
module.exports = App;
