import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A lot of this is taken from the `react-router-hash-link`
 * package
 *
 * See: https://github.com/rafgraph/react-router-hash-link/blob/1739e734c9d158b80d7c85c02f70db9bd869b0f5/src/index.js#L5
 */

let hashFragment = "";
let observer = null;
let asyncTimerId = null;
const scrollFunction = (el) => {
  el.scrollIntoView();
};

function reset() {
  hashFragment = "";

  if (observer !== null) {
    observer.disconnect();
  }

  if (asyncTimerId !== null) {
    window.clearTimeout(asyncTimerId);
    asyncTimerId = null;
  }
}

function getElAndScroll() {
  const element = document.getElementById(hashFragment);

  if (element !== null) {
    scrollFunction(element);
    reset();
    return true;
  }

  return false;
}

function hashLinkScroll(timeout) {
  // Push onto callback queue so it runs after the DOM is updated
  window.setTimeout(() => {
    if (getElAndScroll() === false) {
      if (observer === null) {
        observer = new MutationObserver(getElAndScroll);
      }

      observer.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      // if the element doesn't show up in specified timeout or 10 seconds, stop checking
      asyncTimerId = window.setTimeout(() => {
        reset();
      }, timeout || 10000);
    }
  }, 0);
}

const ScrollToElement = () => {
  const location = useLocation();

  useEffect(() => {
    const locationHash = location.hash.replace("#", "");
    const hasHash = locationHash !== "";

    if (hasHash && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    reset();

    if (hasHash) {
      hashFragment = locationHash;

      hashLinkScroll();
    }
  });

  return null;
};

export default ScrollToElement;
