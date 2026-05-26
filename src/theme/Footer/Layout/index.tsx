/**
 * Marketing-design footer. Replaces Docusaurus's default Footer/Layout with
 * the legacy index.html footer markup. We discard the `links`/`logo`/`copyright`
 * props from themeConfig.footer because the legacy footer has columns plus an
 * address column with logo, which doesn't fit Docusaurus's links-only schema.
 * Editing this file directly updates all pages.
 */
import {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function FooterLayout(): ReactNode {
  const logoSvg = useBaseUrl('/images/airen_ci/OML_Text_L.svg');
  const logoPng = useBaseUrl('/images/airen_ci/OML_Text_L.png');
  const {siteConfig} = useDocusaurusContext();
  const previewSource = (siteConfig.customFields as Record<string, string> | undefined)?.previewSource || '';

  return (
    <>
    {/* Scroll-to-top button — shown when scrolled > 400px via legacy-marketing.ts */}
    <button
      id="btnScrollTop"
      className="btn-scroll-top"
      aria-label="Back to top">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
    <section className="full-page-section d-flex flex-column bg-black footer-section pb-0-mobile">
      <footer className="border-top border-darker">
        <div className="container mt-5">
          <div className="row g-5 justify-content-between">
            <div className="col-12 col-lg-4 address-col">
              <picture style={{pointerEvents: 'none'}}>
                <source srcSet={logoSvg} type="image/svg+xml" />
                <img src={logoPng} alt="OvenMedia Labs" className="sharp-img" />
              </picture>
              <div className="address-compact">
                <p>
                  #1203, 157, Yangpyeong-ro, Yeongdeungpo-gu,
                  <br />Seoul 07207, South Korea
                </p>
                <p>T. +82-2-6378-5227 &nbsp;|&nbsp; F. +82-2-6378-5228</p>
                <p>contact@ovenmedialabs.com</p>
              </div>
            </div>

            {!previewSource && (
            <div className="col-12 col-lg-8 d-none d-md-block">
              <div className="d-flex justify-content-between">
                <div className="footer-col">
                  <h6 className="footer-heading">Products</h6>
                  <ul className="list-unstyled">
                    <li><Link to="/ome" className="footer-link">OvenMediaEngine</Link></li>
                    <li><Link to="/ome-enterprise" className="footer-link">OvenMediaEngine Enterprise</Link></li>
                    <li><Link to="/docs/ovenplayer" className="footer-link">OvenPlayer</Link></li>
                    <li><Link to="https://github.com/OvenMediaLabs/OvenLiveKit-Web" className="footer-link">OvenLiveKit</Link></li>
                  </ul>
                </div>
                <div className="footer-col">
                  <h6 className="footer-heading">Resources</h6>
                  <ul className="list-unstyled">
                    <li><a href="https://github.com/OvenMediaLabs" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a></li>
                    <li><Link to="/latency" className="footer-link">Tech: Low Latency</Link></li>
                    <li><Link to="/blog" className="footer-link">Blog</Link></li>
                  </ul>
                </div>
                <div className="footer-col">
                  <h6 className="footer-heading">Docs</h6>
                  <ul className="list-unstyled">
                    <li><Link to="/docs/ome" className="footer-link">OME Guide</Link></li>
                    <li><Link to="/docs/ome-enterprise" className="footer-link">OME-E Guide</Link></li>
                    <li><Link to="/docs/ovenplayer" className="footer-link">OP Guide</Link></li>
                  </ul>
                </div>
                <div className="footer-col">
                  <h6 className="footer-heading">Company</h6>
                  <ul className="list-unstyled">
                    <li><Link to="/company" className="footer-link">About Us</Link></li>
                    <li><Link to="/company#contact" className="footer-link">Contact</Link></li>
                    <li><Link to="/agplv3" className="footer-link">License Compliance</Link></li>
                    <li><Link to="/eula" className="footer-link">EULA</Link></li>
                  </ul>
                </div>
                <div className="footer-col">
                  <h6 className="footer-heading">Social</h6>
                  <ul className="list-unstyled">
                    <li><a href="https://www.linkedin.com/company/ovenmedialabs" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</a></li>
                    <li><a href="https://x.com/OvenMediaEngine" target="_blank" rel="noopener noreferrer" className="footer-link">X (Twitter)</a></li>
                    <li><a href="https://www.reddit.com/r/OvenMediaEngine" target="_blank" rel="noopener noreferrer" className="footer-link">Reddit</a></li>
                  </ul>
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="border-top border-darker mt-3 pt-2 text-center">
            <p className="copyright-text">
              Copyright &copy; OvenMedia Labs Inc.{' '}
              <span className="extra-small fw-light">
                (formerly AirenSoft Co., Ltd.)
              </span>{' '}
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </section>
    </>
  );
}
