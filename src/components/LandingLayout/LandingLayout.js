import React from "react";
import clsx from "clsx";
import Navbar from "../Navbar";
import Footer from "../Footer";

const LandingLayout = ({ pageName, children }) => {
  return (
    <main className={clsx("landing-layout", `${pageName}-page`)}>
      <Navbar />
      {children}
      <Footer />
    </main>
  );
};

export default LandingLayout;
