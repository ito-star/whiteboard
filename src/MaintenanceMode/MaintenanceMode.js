import React from "react";

const MaintenanceMode = () => (
  <div className="container-fluid login-page">
    <section>
      <p id="user_id" className="" />
    </section>
    <div style={{ textAlign: "left" }}>
      <br />
      <br />
      <br />
      <div className="center margin-middle">
        <img width="140" height="140" src="/logo.png" alt="logo" />
        <br />
        <br />
        <br />
        <p>
          Whatboard is currently down for maintenance. We should be back
          shortly.
        </p>
        <p>Thank you for your patience.</p>
      </div>
    </div>
  </div>
);

export default MaintenanceMode;
