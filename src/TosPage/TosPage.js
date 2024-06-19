import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";

import SimpleNavBar from "../SimpleNavBar";
// eslint-disable-next-line import/no-webpack-loader-syntax
import AcceptableUsePolicy, {
  frontMatter as aupFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/acceptable-use-policy.mdx";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PrivacyPolicy, {
  frontMatter as privacyFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/privacy-policy.mdx";
// eslint-disable-next-line import/no-webpack-loader-syntax
import Terms, {
  frontMatter as termsFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/terms-of-service.mdx";

import "../tos/tos-page.scss";

const pages = {
  terms: {
    ...termsFrontMatter,
    component: Terms,
  },
  "acceptable-use": {
    ...aupFrontMatter,
    component: AcceptableUsePolicy,
  },
  privacy: {
    ...privacyFrontMatter,
    component: PrivacyPolicy,
  },
};

const TosPage = (props) => {
  const { type } = props;

  let page;

  if (type && pages[type]) {
    page = pages[type];
  }

  useEffect(() => {
    if (page) {
      document.title = page.title;
    }
  }, [page]);

  if (!page) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid tos-page">
        <div>
          <br />
          <br />
          <br />
          <div className="margin-middle tos-body">
            <page.component />
          </div>
        </div>
      </div>
    </>
  );
};

TosPage.propTypes = {
  type: PropTypes.oneOf(Object.keys(pages)).isRequired,
};

export default TosPage;
