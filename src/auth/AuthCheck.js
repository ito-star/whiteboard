import PropTypes from "prop-types";
import useUser from "./useUser";

const AuthCheck = (props) => {
  const {
    requireVerifiedEmail,
    emailFallback = null,
    accessCheck,
    accessFallback = null,
    fallback = null,
    loading = null,
    allowAnonymous,
    children,
  } = props;

  const { user, loadingUser } = useUser();

  if (loadingUser) {
    return loading || fallback;
  }

  if (user) {
    if (user.email && requireVerifiedEmail && !user.emailVerified) {
      return emailFallback || fallback;
    }

    if (accessCheck && !accessCheck(user)) {
      return accessFallback || fallback;
    }

    if (user.isAnonymous && !allowAnonymous) {
      return fallback;
    }

    return children;
  }
  if (allowAnonymous) {
    return children;
  }

  return fallback;
};

AuthCheck.propTypes = {
  /**
   * Require that the currently logged in user have a verified email address.
   */
  requireVerifiedEmail: PropTypes.bool,

  /**
   * Content to display if the currently logged in user does not have a
   * verified email address.
   */
  emailFallback: PropTypes.node,

  /**
   * Function to call to determine whether the currently logged in user
   * has access to the children of this component.
   *
   * This function will be called with a single argument: The currently
   * logged in user. It should return a boolean value indicating whether
   * or not access has been granted.
   */
  accessCheck: PropTypes.func,

  /**
   * Content to display if accessCheck returns false
   */
  accessFallback: PropTypes.node,

  /**
   * Content to display if there is no currently logged in user.
   *
   * This also serves as the content that will be displayed if
   * emailFallback, accessFallback, or loading are not specified.
   */
  fallback: PropTypes.node,

  /**
   * Content to display while the currently logged in user is being loaded
   */
  loading: PropTypes.node,

  /**
   * Content to display if the user is logged in and has passed all additional
   * checks.
   */
  children: PropTypes.node,
};

export default AuthCheck;
