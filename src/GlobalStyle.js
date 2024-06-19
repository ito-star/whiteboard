import { createGlobalStyle } from "styled-components";

import GalateaLight from "./assets/fonts/Galatea/Galatea-Light.otf";
import GalateaRegular from "./assets/fonts/Galatea/Galatea-Regular.otf";
import GalateaMedium from "./assets/fonts/Galatea/Galatea-Medium.otf";
import GalateaBold from "./assets/fonts/Galatea/Galatea-Bold.otf";

import AvenirLTStdLight from "./assets/fonts/AvenirLTStd/AvenirLTStd-Light.otf";
import AvenirLTStdMedium from "./assets/fonts/AvenirLTStd/AvenirLTStd-Medium.otf";
import AvenirLTStdRoman from "./assets/fonts/AvenirLTStd/AvenirLTStd-Roman.otf";
import AvenirLTStdHeavy from "./assets/fonts/AvenirLTStd/AvenirLTStd-Heavy.ttf";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: Galatea;
    font-weight: 300;
    src: url(${GalateaLight});
  }

  @font-face {
    font-family: Galatea;
    font-weight: 400;
    src: url(${GalateaRegular});
  }

  @font-face {
    font-family: Galatea;
    font-weight: 500;
    src: url(${GalateaMedium});
  }

  @font-face {
    font-family: Galatea;
    font-weight: 700;
    src: url(${GalateaBold});
  }

  @font-face {
    font-family: AvenirLTStd;
    font-weight: 300;
    src: url(${AvenirLTStdLight});
  }

  @font-face {
    font-family: AvenirLTStd;
    font-weight: 400;
    src: url(${AvenirLTStdMedium});
  }

  @font-face {
    font-family: AvenirLTStd-Roman;
    font-weight: 400;
    src: url(${AvenirLTStdRoman});
  }

  @font-face {
    font-family: AvenirLTStd;
    font-weight: 500;
    src: url(${AvenirLTStdHeavy});
  }
`;

export default GlobalStyle;
