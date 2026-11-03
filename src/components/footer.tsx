import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faYoutube } from "@fortawesome/free-brands-svg-icons";

import './footer.less';

export function Footer() {
  return (
    <footer className="footer">
      <span className="shrink-mobile">
        Forked from <a href="https://github.com/AlphaSheep/smartcube-3style" target="_blank" rel="noreferrer">Brendan&nbsp;James&nbsp;Gray's smartcube-3style</a>
      </span>
      <span className="footer-links">
        <a href="https://github.com/wiser2/smartcube-3style" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faGithub} />
          <span className="hide-mobile">GitHub</span>
        </a>
      </span>
    </footer>
  );
}

