import React from "react";
import { Container } from "@material-ui/core";
import Nav from "../Nav";
import Footer from "../Footer";
import PricingSummary from "../PricingSummary";
import "./PricesPage.scss";

export default function PricesPage() {
  return (
    <>
      <Nav />
      <Container className="prices-body" maxWidth="xl">
        <>
          <h1 className="big-header">Pricing</h1>
          <PricingSummary userPlan="none" />
        </>
      </Container>
      <Footer />
    </>
  );
}
