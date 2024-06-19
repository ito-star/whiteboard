<div align="center"></div>

<p align="center">
  <a href='https://whatboard.app'>
    <img width='140' height='140' src='https://whatboard.app/logo.png'>
  </a>
</p>

<h1 align="center">Whatboard</h1>
<p>
A realtime web app to collaborate and share.

Project lead & co-Founder: @dkgitcode

(c) Hired Insight, LLC.

Questions: admin@hiredinsight.co

</p>

# Workflow

1. Clone the repository.
1. Create a branch off of the `dev` branch for your work. The branch name should be descriptive of your work.
   If you are working on an Issue, the branch should be named `WBR-<issue number>`. If a branch named `WBR-<issue number>` already exists, add a unique suffix your branch, e.g. `WBR-<issue number>_A`.
1. When you are ready for your work to be reviewed, create a Pull Request.
1. Once your work has been approved, it will be merged into `dev`. From `dev`, it will then be merged into `master`.

# Local Development Setup

## Initial Setup

1. Ask @aheimlich or @rrggrr for an invite to the Firebase projects. You will recieve invites to two projects: [`whatboard-dev`](https://console.firebase.google.com/project/whatboard-dev) (the development project) and [`armspaces`](https://console.firebase.google.com/project/armspaces) (the production project). You will also recieve an invite our Stripe account.
1. Download and install the [Firebase CLI](https://firebase.google.com/docs/cli?authuser=0).
1. Run the command `firebase login`.

## Firebase Functions Setup

1. Go to https://console.firebase.google.com/project/whatboard-dev/settings/serviceaccounts/adminsdk.
1. Click on the "Generate new private key" button.
1. Name the file `serviceAccountKey.json`, and save it in the `functions` folder.

## Firebase Storage Setup

1. Go to [Storage](https://console.firebase.google.com/project/whatboard-dev/storage) in the [Firebase console](https://console.firebase.google.com/project/whatboard-dev) and add a storage bucket for yourself.
1. Download and install [`gsutil`](https://cloud.google.com/storage/docs/gsutil_install?authuser=0)
1. Run the command
   ```
   gsutil cors set cors.json gs://<bucket_name>
   ```
   Where `<bucket_name>` is the name of the storage bucket you just created.

## `.env` Files Setup

1. Copy `.env.example` to `.env`.
1. Open up `.env` and follow the instructions within to fill out the values.
1. Copy `.env.development.local.example` to `.env.development.local`.
1. Open up `.env.development.local` and set `REACT_APP_FIREBASE_STORAGE_BUCKET` to the name of the storage bucket you created.

## Starting the dev servers

1. Run the command `npm run start-emulators` to start the [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite?authuser=0). You can also use `npm run start-emulators-debug` if you want to enable debugging support.
1. In a different terminal window, run the command `npm start` to start the React dev server.

## Firebase Functions environment configuration

You can add configuration settings to your Firebase Functions as described at https://firebase.google.com/docs/functions/config-env?authuser=0. `npm run get-functions-config` will pull down the configuration that is stored in Firebase and make it available locally. It is automatically called by `npm run start-emulators`. If you need to override configuration locally, create a file named `functions/.runtimeconfig.local.json`. It will be merged with the configuration from Firebase.

You should only ever edit `functions/.runtimeconfig.local.json` by hand. The other `functions/.runtimeconfig.*.json` files are managed by `npm run get-functions-config`. If you make changes to `functions/.runtimeconfig.local.json`, or want to pull down updated Firebase Functions config from Firebase, run `npm run get-functions-config` again, then restart the Firebase Local Emulators.

Remember to set your function configuration in both the production and development projects.

# Deployment

Deploys happen automatically whenever commits are pushed to `dev` or `master`. `dev` deploys to the development project, while `master` deploys to the production project.

# Admin Scripts

The `admin` folder contains a variety of administration scripts, for things like user management and data migrations. To set up the admin scripts, follow these steps:

1. Copy `functions/serviceAccountKey.json` into the `admin` folder. See [Firebase Function Setup](#firebase-functions-setup) if `functions/serviceAccountKey.json` does not exist.
1. Rename `admin/serviceAccountKey.json` to `admin/serviceAccountKey.whatboard-dev.json`.
1. Run `npm install` inside the `admin` folder.

To run admin scripts, use the following command from the root of the repository

```
npm run --silent admin -- <command> <command options> <command arguments>
```

The `--silent` is optional, but it gets rid of some extraneous output that `npm` would otherwise produce.

This specifc form is necessary because otherwise `npm` will confuse the commandline options for the admin script with its own commandline options.
