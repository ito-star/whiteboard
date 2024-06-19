import React from "react";
import "./SecurityPage.scss";
import Nav from "../Nav";
import Footer from "../Footer";

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <div className="security-page">
        <section>
          <h1 className="main-header">Security</h1>
          <p className="sub-details">
            Security is a priority at Whatboard. Precautions we take to keep
            your data secure are many and the include, but are not limited to
            the following:
          </p>
          <br />
          <br />
          <h2>Application Security Monitoring and Alerting</h2>
          <br />
          <br />
          <p className="sub-details">
            Utilizing intruder.io&apos;s scanning platform & Mozilla&apos;s
            Observatory tool, Whatboard is monitored for emerging and known
            threats to our systems and your data.
          </p>
          <br />
          <br />
          <h2>Application Development Security</h2>
          <br />
          <br />
          <p className="sub-details">
            Whatboard.app is developed using Eslint, Github&apos;s CodeQL and
            Github&apos;s Dependabot. The combination of these tools identifies
            many security issues in code before it is deployed to production.
          </p>
          <br />
          <br />
          <h2>Account-level Security</h2>
          <br />
          <br />
          <p className="sub-details">
            Account management and logins are OAuth are employed, which uses
            authorization tokens provided by OAuth providers (eg. Google),
            instead of confidential passwords. Coming soon: 2FA for email
            logins.
          </p>
          <br />
          <br />
          <h2>Personnel</h2>
          <br />
          <br />
          <p className="sub-details">
            Whatboard is coded and hosted in the United States by an
            experienced, close-knit and vetted development team located
            primarily in Illinois and Texas. For more information on the people
            and personalities behind Whatboard, see our about page (coming
            soon).
          </p>
          <br />
          <br />
          <h2>Other</h2>
          <br />
          <br />
          <p className="sub-details">
            HTTPS is required throughout Whatboard for external assets.
            Additional precautions include close attention to XSS protection,
            URL validation, HTML rendering, DOM Access, server-side rendering,
            JSON state and external library minimization.
          </p>

          <img alt="powered" className="power-icon" src="/power-icon.png" />
        </section>
      </div>
      <Footer />
    </>
  );
}
