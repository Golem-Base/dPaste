import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import React from "react";
import styles from "@/styles/Layout.module.scss";
import "@/styles/global.scss";
import { ANALYTICS_URL, ANALYTICS_SITE_ID } from "@/lib/config";

export const metadata: Metadata = {
  title: "Golem dPaste",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <header className={styles.header}>
          <div className={styles.container}>
            <Link href="/">
              <img src="/golem-dpaste.svg" alt="Golem dPaste" width={100} height={50} />
            </Link>
          </div>
        </header>
        <main className={styles.container}>{children}</main>
        <footer className={styles.footer}>
          <div className={styles.container}>
            <ul className={styles.footer__socials}>
              <li>
                <a href="https://x.com/golemproject" target="_blank" rel="noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1227" viewBox="0 0 1200 1227" fill="none"><g clipPath="url(#clip0_1_2)"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="#fff" /></g><defs><clipPath id="clip0_1_2"><rect width="1200" height="1227" fill="white" /></clipPath></defs>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://discord.com/invite/golem" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464,66.52A50,50,0,0,0,414.12,17L97.64,16A49.65,49.65,0,0,0,48,65.52V392c0,27.3,22.28,48,49.64,48H368l-13-44L464,496ZM324.65,329.81s-8.72-10.39-16-19.32C340.39,301.55,352.5,282,352.5,282a139,139,0,0,1-27.85,14.25,173.31,173.31,0,0,1-35.11,10.39,170.05,170.05,0,0,1-62.72-.24A184.45,184.45,0,0,1,191.23,296a141.46,141.46,0,0,1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62,19.09,42.38,28.26c-7.27,9.18-16.23,19.81-16.23,19.81-53.51-1.69-73.85-36.47-73.85-36.47,0-77.06,34.87-139.62,34.87-139.62,34.87-25.85,67.8-25.12,67.8-25.12l2.42,2.9c-43.59,12.32-63.44,31.4-63.44,31.4s5.32-2.9,14.28-6.77c25.91-11.35,46.5-14.25,55-15.21a24,24,0,0,1,4.12-.49,205.62,205.62,0,0,1,48.91-.48,201.62,201.62,0,0,1,72.89,22.95S333.61,145,292.44,132.7l3.39-3.86S329,128.11,363.64,154c0,0,34.87,62.56,34.87,139.62C398.51,293.34,378.16,328.12,324.65,329.81Z" /><path d="M212.05,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.8,0,24.7-11.83,24.7-26.57C237,229.81,225.85,218,212.05,218Z" /><path d="M300.43,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.81,0,24.7-11.83,24.7-26.57S314,218,300.43,218Z" /></svg>
                </a>
              </li>
            </ul>
            <ul className={styles.footer__links}>
              <li>
                <a href="/terms.pdf" target="_blank" rel="noreferrer">
                  Terms of use
                </a>
              </li>
              <li>
                <a href="/privacy.pdf" target="_blank" rel="noreferrer">
                  Privacy statement
                </a>
              </li>
              <li>
                <a href="https://golem-base.io" target="_blank" rel="noreferrer">
                  Powered by Golem Base | 2025
                </a>
              </li>
            </ul>
          </div>
        </footer>
      </body>
      <Script id="analytics">
        {`var _paq = window._paq = window._paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="${ANALYTICS_URL}";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', ${ANALYTICS_SITE_ID}]);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })();
        `}
      </Script>
    </html>
  );
}
