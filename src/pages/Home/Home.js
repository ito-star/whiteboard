import React from "react";
import { Link } from "react-router-dom";
import LandingLayout from "../../components/LandingLayout";
import { Button, SectionTitle, P, Body1 } from "../../components/common";

import bgHeaderImage from "../../assets/images/bg-header.png";
// import bgNewportImage from "../../assets/images/bg-Newport.jpg";
import bgTestimonialsImage from "../../assets/images/bg-testimonials.jpg";
import icArrowImage from "../../assets/images/ic-arrow.png";
import imgFileExchangeImage from "../../assets/images/img-FileExchange.png";
import imgHeaderImage from "../../assets/images/img-header.png";
import imgMacBookImage from "../../assets/images/img-macbook.png";
// import imgQuoteLightImage from "../../assets/images/img-quote-light.png";
import imgQuoteImage from "../../assets/images/img-quote.png";

import icAirtableImage from "../../assets/images/file_types/ic-airtable.png";
import icCsvImage from "../../assets/images/file_types/ic-csv.png";
import icGsheetsImage from "../../assets/images/file_types/ic-gsheets.png";
import icHtmlImage from "../../assets/images/file_types/ic-html.png";
import icMiscImage from "../../assets/images/file_types/ic-misc.png";
import icPdfImage from "../../assets/images/file_types/ic-pdf.png";
import icTxtImage from "../../assets/images/file_types/ic-txt.png";
import icVidImage from "../../assets/images/file_types/ic-vid.png";

import {
  Header,
  CopyTitle,
  HeaderImage,
  OverlayImage,
  ButtonWrapper,
  Section2,
  FeatureList,
  ListItem,
  Section3Description,
  SupportedFileContentWrapper,
  FileTypeListWrapper,
  TestimonialCard,
  TestimonialWrapper,
  FileExchangeImage,
  SalesImage,
} from "./Home.style";

const FILE_TYPES = [
  { name: "pdf", src: icPdfImage },
  { name: "vid", src: icVidImage },
  { name: "txt", src: icTxtImage },
  { name: "html", src: icHtmlImage },
  { name: "gsheets", src: icGsheetsImage },
  { name: "airtable", src: icAirtableImage },
  { name: "csv", src: icCsvImage },
  { name: "misc", src: icMiscImage },
];

const TESTIMONIAL_LIST = [
  {
    name: "Nicole,",
    title: "Literal North LLC",
    description:
      "Simplifies my project management. Convenient to have all my VoC content in one place",
  },
  {
    name: "Brad",
    title: "Buyhive",
    description:
      "Fits how I work. I prefer something visual over text - so cool.",
  },
  {
    name: "Katie",
    title: "ARM",
    description: "Much easier for working with customers on sales",
  },
];

const Home = () => {
  return (
    <LandingLayout pageName="home">
      <Header className="home-header">
        <OverlayImage src={bgHeaderImage} alt="header background" />
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-12 order-md-1 order-2 d-flex align-items-center">
              <div className="py-5">
                <CopyTitle color="#1cd3c0">Close your Sales Fast.</CopyTitle>
                <CopyTitle heavy>One. Simple. Board.</CopyTitle>
                <ButtonWrapper>
                  <Link to="/login">
                    <Button>Create a Whatboard</Button>
                  </Link>
                  <a
                    href="https://whatboard.app/b/readme"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button bgColor="#1cd3c0">Not in Sales?</Button>
                  </a>
                </ButtonWrapper>
              </div>
            </div>
            <div className="col-md-6 col-12 order-md-2 order-1">
              <HeaderImage src={imgHeaderImage} alt="Header" />
            </div>
          </div>
        </div>
      </Header>
      <div className="text-center">
        <a
          href="https://www.producthunt.com/posts/whatboard-app?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-whatboard&#0045;app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=347430&theme=light"
            alt="Whatboard&#0046;app - Sell&#0032;and&#0032;delegate&#0032;visually&#0044;&#0032;distraction&#0032;free&#0032;with&#0032;Whatboard | Product Hunt"
            style={{ width: 250, height: 54 }}
            width="250"
            height="54"
          />
        </a>
      </div>
      <Section2 minHeight="640px;">
        <SalesImage
          className="d-none d-lg-block"
          src={imgMacBookImage}
          alt="Sales Made Simple"
        />
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-5 ml-auto">
              <SectionTitle>Sales Made Simple</SectionTitle>
              <P>
                Your clients are overwhelmed. Reduce their load, control the
                sale, and isolate your message from competing emails, version
                conflicts, thread navigation and clutter that costs you
                business.
              </P>
              <FeatureList>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Combine content (PDF, video, links and more) in one view
                  </span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Share privately or publicly, or keep if to yourself
                  </span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>Track interaction &amp; interest</span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Integrate with 1000+ apps via Zapier&reg; (coming soon!)
                  </span>
                </ListItem>
                <Link to="/signup">
                  <Button size="medium" className="mt-2">
                    Get Started
                  </Button>
                </Link>
              </FeatureList>
            </div>
          </div>
        </div>
      </Section2>
      <Section2 className="container" border>
        <div className="row justify-content-center">
          <Section3Description className="col-md-10 col-12">
            Information overload is costing you deals. Put a stop to competing
            communications, time-consuming email and file searches, endless
            versioning, and your client&apos;s suffering.
          </Section3Description>
        </div>
      </Section2>
      <Section2 padding={80}>
        <SupportedFileContentWrapper>
          <SectionTitle className="text-center">
            Supported File Content
          </SectionTitle>
          <Body1 maxWidth="680px" className="text-center">
            Upload or link to dozens of popular content types, and embed
            real-time output from many of the web&apos;s most popular business
            application &amp; social networks
          </Body1>
          <FileTypeListWrapper>
            {FILE_TYPES.map(({ name, src }) => (
              <img key={name} src={src} alt={name} />
            ))}
          </FileTypeListWrapper>
          <Button size="medium" className="mt-2" style={{ cursor: "auto" }}>
            More Types Coming Soon
          </Button>
        </SupportedFileContentWrapper>
      </Section2>
      <Section2>
        <div className="container">
          <div className="row">
            <div className="col-12 col-md-6 pl-4 d-flex flex-column justify-content-center">
              <SectionTitle>Quickly &amp; Easily</SectionTitle>
              <FeatureList>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Aggregate your sales content, proposals, &amp; collateral.
                  </span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>Share your board</span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Review in real-time with your clients distraction free
                  </span>
                </ListItem>
                <ListItem>
                  <img src={icArrowImage} alt="icon list item" />
                  <span>
                    Control the flow and format of information and close your
                    deal on the spot
                  </span>
                </ListItem>
              </FeatureList>
            </div>
            <div className="col-12 col-md-6">
              <FileExchangeImage
                src={imgFileExchangeImage}
                alt="File Exchange"
              />
            </div>
          </div>
        </div>
      </Section2>
      <Section2 padding={115} background={bgTestimonialsImage}>
        <div className="container">
          <SectionTitle className="text-center">
            Why our users love us
          </SectionTitle>
          <TestimonialWrapper>
            {TESTIMONIAL_LIST.map((item) => (
              <TestimonialCard key={item.name}>
                <img src={imgQuoteImage} alt="quote" />
                <div className="description">{item.description}</div>
                <div className="divider" />
                <span className="name">{item.name}</span>
                <span className="title">{item.title}</span>
              </TestimonialCard>
            ))}
          </TestimonialWrapper>
        </div>
      </Section2>
      {/* <Section2
        background={bgNewportImage}
        minHeight="604px"
        className="d-flex justify-content-center align-items-center"
      >
        <div className="container">
          <img src={imgQuoteLightImage} alt="Quote NewPort" />
          <div className="row justify-content-between align-items-center mt-3">
            <div className="col-12 col-md-7">
              <H4 color="white">
                The average knowledge worker is responsible for more things than
                they were before email. This makes us frenetic. We should be
                thinking about how to remove the things on their plate, not
                giving people more to do.
              </H4>
            </div>
            <div className="col-12 col-md-4 pt-md-0 pt-5">
              <H5 color="white">Hyperactive workflow:</H5>
              <H3 color="#0072ff">CAL NEWPORT</H3>
              <H5 color="white">Geogetown University Professor</H5>
            </div>
          </div>
        </div>
      </Section2> */}
    </LandingLayout>
  );
};

export default Home;
