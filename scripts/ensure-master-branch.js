const execa = require("execa");

if (process.env.GITHUB_ACTIONS === "true") {
  process.exit(0);
}

let currentProject = process.env.GCLOUD_PROJECT;

if (!currentProject) {
  const output = String(execa.commandSync("firebase use --json").stdout);
  const result = JSON.parse(output);

  if (result.status !== "success") {
    console.error("Error determining project");
    console.error(result);
    process.exit(1);
  }

  currentProject = result.result;
}

let currentBranch = String(
  execa.commandSync("git rev-parse --abbrev-ref HEAD").stdout
);
currentBranch = currentBranch.trim();

const branches = {
  armspaces: "master",
  "whatboard-dev": "dev",
};

const allowedBranch = branches[currentProject];

if (currentBranch === allowedBranch) {
  process.exit(0);
} else {
  console.error(
    `Deploys to project ${currentProject} can only be performed from the ${allowedBranch} branch! You are currently on the ${currentBranch} branch.`
  );
  process.exit(1);
}
