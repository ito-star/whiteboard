import React, { useState } from "react";
import { Link } from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import { useSnackbar } from "notistack";
import { Input, Button } from "../common";
import SupportForm from "../../User/SupportForm";
import { getCallableFbFunction } from "../../utils";

import logoFooterImage from "../../assets/images/logo-footer.png";
// import FbImage from "../../assets/images/social_media/FB.png";
// import IgImage from "../../assets/images/social_media/IG.png";
// import LiImage from "../../assets/images/social_media/Li.png";
// import RssImage from "../../assets/images/social_media/RSS.png";
// import TwImage from "../../assets/images/social_media/TW.png";

import {
  Wrapper,
  NavList,
  FormTitle,
  FormDescription,
  FormWrapper,
  CopyrightBar,
  // SocialIcons,
  SupportButton,
} from "./Footer.styles";

const Footer = () => {
  const [isSupportFormOpen, setIsSupportFormOpen] = useState();
  const [errMessage, setErrMessage] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isError, setError] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const onEmailAddressChange = (event) => {
    setEmailAddress(event.target.value);
  };

  const onNewsletterFormSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const func = getCallableFbFunction("users-addToMailingList");

      await func({
        email: emailAddress,
        mailingList: "newsletter",
      });

      setEmailAddress("");
      enqueueSnackbar(`${emailAddress} has been added to our mailing list`, {
        variant: "success",
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      enqueueSnackbar(e.message, {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSupportForm = () => {
    setIsSupportFormOpen(true);
  };

  const supportSuccessAction = () => {
    setErrMessage("Your message has been received.");
    setError(false);
    setIsAlertOpen(true);
  };

  const hideSupportForm = () => {
    setIsSupportFormOpen(false);
  };

  const handleCloseAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <Wrapper className="container">
      <SupportForm
        show={isSupportFormOpen}
        onHide={hideSupportForm}
        successAction={supportSuccessAction}
      />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isAlertOpen}
        autoHideDuration={2000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          variant="filled"
          severity={isError ? "error" : "success"}
        >
          {errMessage}
        </Alert>
      </Snackbar>
      <div className="row justify-content-between">
        <div className="col-md-5 col-12 d-flex justify-content-around align-items-center">
          <img src={logoFooterImage} alt="Footer logo" />
          <NavList>
            <li>
              <Link to="/acceptable-use">Acceptable Use</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <SupportButton type="button" onClick={showSupportForm}>
                Support
              </SupportButton>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
          </NavList>
        </div>
        <div className="col-12 col-md-4 pt-md-3 pt-5">
          <FormTitle>NEWSLETTER</FormTitle>
          <FormDescription>Sign up for our newsletter!</FormDescription>
          <FormWrapper onSubmit={onNewsletterFormSubmit}>
            <Input
              placeholder="Email"
              aria-label="Email"
              type="email"
              autoComplete="email"
              required
              value={emailAddress}
              onChange={onEmailAddressChange}
            />
            <Button size="medium" disabled={isSubmitting}>
              JOIN
            </Button>
          </FormWrapper>
        </div>
      </div>
      <CopyrightBar>
        <span className="copyright-text">
          Ⓒ 2021 whatboard.app. All rights reserved.{" "}
          <Link to="/terms">Terms of use</Link> |{" "}
          <Link to="/privacy">Privacy Policy</Link>
        </span>
        {/* <SocialIcons>
          <img src={FbImage} alt="facebook" />
          <img src={LiImage} alt="linkedin" />
          <img src={TwImage} alt="twitter" />
          <img src={IgImage} alt="instagram" />
          <img src={RssImage} alt="rss" />
        </SocialIcons> */}
      </CopyrightBar>
    </Wrapper>
  );
};

export default Footer;
