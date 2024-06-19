const admin = require("firebase-admin");
const functions = require("firebase-functions");
const pAll = require("p-all");
const Dayjs = require("dayjs");
const _ = require("lodash");
const { getMailgunClient, getWhatboardUrl, idToEmail } = require("./utils");
const { access, makeUserFromWbId } = require("./access");
const { getCache } = require("./utils");

const cache = getCache();

// Dev/Prod mode, it will be executed at 1am (UTC +0) everyday.
exports.resetRateLimit = functions.pubsub
  .schedule("0 1 * * *")
  .onRun(async () => {
    const boardsRef = admin.database().ref("/whiteboards");
    const boardsSnap = await boardsRef.once("value");
    const promises = [];

    boardsSnap.forEach((boardSnap) => {
      const boardRef = admin.database().ref(`whiteboards/${boardSnap.key}`);

      const promise = async () => {
        const board = boardSnap.val();

        let user;

        if (Array.isArray(board.board_members)) {
          const boardOwner = board.board_members[0];
          // return undefined if not found from the cache.
          user = cache.get(boardOwner);
          if (!user) {
            try {
              user = await makeUserFromWbId(boardOwner);
              cache.set(boardOwner, user);
            } catch (e) {
              if (
                !["auth/user-not-found", "auth/invalid-email"].includes(e.code)
              ) {
                throw e;
              }
            }
          }
        }

        const maxBoardLoads = user ? await access.getMaxBoardLoads(user) : 200;
        await boardRef.update({
          loadLimit: maxBoardLoads,
          isReportSent: false,
        });
      };

      promises.push(promise);
    });

    await pAll(promises, { concurrency: 5 });
    cache.clear();

    console.log("Update complete");
    return null;
  });

exports.sendDailyDigest = functions.pubsub
  .schedule("0 1 * * *")
  .onRun(async () => {
    const usersRef = admin.database().ref("/users");
    const usersSnap = await usersRef.once("value");
    const promises = [];

    // When developing a template, you can set this to the version tag you are working on.
    // Once you're done, set that version tag to "active", so that it becomes the default
    // version.
    const templateVersion = "v2";

    usersSnap.forEach((userSnap) => {
      const promise = async () => {
        let user;
        try {
          user = await admin.auth().getUserByEmail(idToEmail(userSnap.key));
        } catch (e) {
          if (!["auth/user-not-found", "auth/invalid-email"].includes(e.code)) {
            throw e;
          }
        }

        if (!user) return;

        const boardsRef = admin
          .database()
          .ref(`/users/${userSnap.key}/whiteboards`);
        const boardsSnap = await boardsRef.once("value");
        const userBoardDigest = [];

        const boardArr = [];
        const whatboardDomain = getWhatboardUrl();
        const whatboardUrl = `${whatboardDomain}/daily-digest`;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        boardsSnap.forEach((boardSnap) => {
          boardArr.push(boardSnap);
        });
        for (const boardSnap of boardArr) {
          const board = boardSnap.val();
          if (
            board.shouldTrackVisits &&
            board.board_members[0] === userSnap.key
          ) {
            const dateKey = Dayjs(yesterday).format("YYYY-MM-DD");
            // eslint-disable-next-line no-await-in-loop
            const dailyVisitsSnap = await admin
              .database()
              .ref(`/digest-logs/${boardSnap.key}/${dateKey}`)
              .once("value");
            const dailyVisitsNum = dailyVisitsSnap.numChildren();

            userBoardDigest.push({
              boardName: board.board_name,
              visitsNum: dailyVisitsNum,
              boardUrl: `${whatboardDomain}/board/${boardSnap.key}`,
            });
          }
        }

        if (userBoardDigest.length) {
          const sortedUserBoardDigest = _.orderBy(
            userBoardDigest,
            ["visitsNum"],
            ["desc"]
          );

          const templateVariables = {
            // eslint-disable-next-line camelcase
            display_name: user.displayName,
            // eslint-disable-next-line camelcase
            whatboard_url: whatboardUrl,
            // eslint-disable-next-line camelcase
            whatboard_date: Dayjs(yesterday).format("DD/MM/YYYY"),
            // eslint-disable-next-line camelcase
            whatboard_total_visits: sortedUserBoardDigest,
            // This variable is necessary because Mailgun's UI crashes when I
            // try to use {{whatboard_total_visits.length}} after {{#each whatboard_total_visits}}
            // eslint-disable-next-line camelcase
            digest_enabled_boards: sortedUserBoardDigest.length,
          };

          const params = {
            from: "Whatboard LLC <noreply@mg.whatboard.app>",
            to: [`${user.displayName}  <${user.email}>`],
            subject: "Whatboard Daily Digest",
            template: "board-daily-digest",
            "t:version": templateVersion,
            "t:text": "yes",
            "o:tag": ["board-daily-digest"],
            "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
          };
          const mg = getMailgunClient();

          await mg.messages.create(functions.config().mailgun.domain, params);
        }
      };
      promises.push(promise);
    });

    await pAll(promises, { concurrency: 5 });

    console.log("Update complete");
    return null;
  });
