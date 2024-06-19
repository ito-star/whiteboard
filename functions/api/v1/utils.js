const _ = require("lodash");
const { BadRequest } = require("http-errors");

exports.getObjectList = async (req, path, normalizer) => {
  const { orderBy, pageToken, equalTo } = req.query;
  let dir = String(req.query.dir || "asc").toLowerCase();
  let limit = parseInt(req.query.limit, 10) || 10;
  limit += 1;

  if (!["asc", "desc"].includes(dir)) {
    throw new BadRequest('"dir" parameter can only be "asc" or "desc"');
  }

  let ref = req.firebase.database().ref(path);

  if (orderBy) {
    ref = ref.orderByChild(orderBy);
  } else {
    ref = ref.orderByKey();
  }

  if (pageToken) {
    let method = "startAt";
    const tokenParts = pageToken.split(":::", 2);
    let value = tokenParts[0];
    const key = tokenParts[1];

    switch (value) {
      case "true":
        value = true;
        break;
      case "false":
        value = false;
        break;
      case "null":
        value = null;
        break;
      default:
        break;
    }

    if (dir === "desc") {
      method = "endAt";
    }

    ref = ref[method](value, key);
  }

  if (equalTo) {
    // Sorting direction is irrelevent here, so reset it back to ascending
    dir = "asc";

    if (pageToken) {
      ref = ref.endAt(equalTo);
    } else {
      ref = ref.equalTo(equalTo);
    }
  }

  if (dir === "desc") {
    ref = ref.limitToLast(limit);
  } else {
    ref = ref.limitToFirst(limit);
  }

  const snap = await ref.once("value");

  const objects = [];
  const keys = [];

  snap.forEach((objectSnap) => {
    let object;

    if (_.isFunction(normalizer)) {
      object = normalizer(objectSnap.key, objectSnap.val());
    } else {
      object = objectSnap.val();
    }

    objects.push(object);
    keys.push(objectSnap.key);
  });

  if (dir === "desc") {
    objects.reverse();
    keys.reverse();
  }

  let nextPageToken;

  if (objects.length === limit) {
    const nextPageObject = objects[objects.length - 1];
    nextPageToken = keys[keys.length - 1];

    if (orderBy) {
      const dotPath = orderBy.replace("/", ".");
      nextPageToken = `${_.get(
        nextPageObject,
        dotPath,
        "null"
      )}:::${nextPageToken}`;
    }
  }

  if (objects.length === limit) {
    objects.pop();
  }

  const response = {
    result: objects,
    prevPageToken: pageToken || undefined,
    nextPageToken,
  };

  return response;
};
