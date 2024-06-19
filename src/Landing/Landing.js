import React from "react";
import "./Landing.scss";
import ArrowForwardIcon from "@material-ui/icons/ArrowForwardOutlined";
import ButtonLink from "../ButtonLink";
import Nav from "../Nav";
import Footer from "../Footer";

export default function Landing() {
  return (
    <>
      <Nav />
      <div className="landing-container">
        <div className="center header-div top-margin">
          <h1>Close sales fast & keep it simple with Whatboard</h1>
          <br />
          <p>
            Your clients are overwhelmed. Control the sales cycle in one board
            and protect your sale from competing emails, versions, threads and
            clutter that costs you business.
          </p>
          <br />
          <ButtonLink className="confirm-button" route="/login">
            Create Your First Board
          </ButtonLink>
        </div>
        <div className="split-demo">
          <div className="demo-container">
            {/* eslint-disable react/jsx-no-target-blank */}
            <a target="_blank" href="https://whatboard.app/b/readme">
              <img
                alt="example"
                className="example-board"
                src="/sample-board-1.png"
              />
            </a>
            {/* eslint-enable react/jsx-no-target-blank */}
            {/* eslint-disable react/jsx-no-target-blank */}
            {/* <a
          // eslint-disable-next-line react/jsx-no-target-blank
          target="_blank"
          href="https://whatboard.app/b/readme"
          className="to-demo-button"
        >
          Try Demo <ArrowForwardIcon />
        </a> */}
            {/* eslint-enable react/jsx-no-target-blank */}
          </div>
          <div className="split-text">
            <p>Combine your content in one view.</p>
            <br />
            <p>Share privately or publically</p>
            <br />
            <p>Track interaction & interest.</p>
            <br />
            <p>Integrate with 1000+ apps via Zapier (coming soon!).</p>
            <br />
          </div>
        </div>

        <div
          className="sub-section-2"
          style={{ backgroundColor: "rgba(0,0,0,.06)" }}
        >
          <br />
          <br />
          <div className="grid-view-container">
            <div className="grid-view-2">
              <div className="grid-item-2 blue-grid-item">
                <img
                  alt="control panel"
                  src="https://img.icons8.com/color/344/control-panel.png"
                />
                <h2>Fast.</h2>
                <p>
                  Quickly create deal rooms, dashboards, presentations, webpages
                  & more.
                </p>
              </div>

              <div className="grid-item-2 red-grid-item">
                <img
                  alt="connection"
                  src="https://img.icons8.com/color/344/graph-clique.png"
                />
                <h2>Flexible.</h2>
                <p>
                  Ideal for business, e-learning, science and social
                  interaction.
                </p>
              </div>
              <div className="grid-item-2 purple-grid-item">
                <img
                  alt="astronaut helmet"
                  src="https://img.icons8.com/color/344/astronaut-helmet.png"
                />
                <h2>Friendly.</h2>
                <p>
                  No coding necessary. Point & click, drag & drop, click & save.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sub-section-2 ">
          <br />
          <br />
          <div className="split-list">
            <h1 className="big-header ">Quickly & Easily</h1>
            <h2 className="sub-text ">
              <ArrowForwardIcon /> Aggregate your business content, proposals &
              collateral.
              <br />
              <br />
              <ArrowForwardIcon /> Control the flow of information in real-time.
              <br />
              <br />
              <ArrowForwardIcon /> Close your deal on the spot.
            </h2>
          </div>

          <div className="demo-container">
            <img
              alt="example"
              className="example-board"
              src="https://firebasestorage.googleapis.com/v0/b/whatboard-dk/o/Screen%20Shot%202020-10-22%20at%206.54.55%20PM.png?alt=media&token=2aafb023-fdb6-4cf5-aaa5-68b448627f6a"
            />
          </div>

          {/* <div className="client-container">
          <h1 className="centered big-header">Our Clients</h1>
          <div className="logo-collection">

          </div>
        </div> */}
        </div>

        <br />
        <br />
        <br />
        <img alt="powered" className="power-icon" src="/power-icon.png" />
      </div>
      <Footer />
    </>
  );
}
