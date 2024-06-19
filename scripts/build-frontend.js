const execa = require("execa");

if (process.env.GITHUB_ACTIONS === "true") {
  console.log(
    "Skipping frontend build. It should have already happened in an earlier step"
  );
  process.exit(0);
}

const child = execa("npm", ["run", "build"], {
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exit(code);
});
