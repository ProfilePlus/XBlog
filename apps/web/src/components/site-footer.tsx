import React from "react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div style={{ marginBottom: '2rem', opacity: 0.15 }}>
           <img src="/images/logo-transparent.png" alt="Seal" style={{ width: '32px', height: '32px' }} />
        </div>
        <div className="footer-links">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            皖ICP备2026007447号
          </a>
          <span className="footer-separator" aria-hidden="true">|</span>
          <a
            href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34010402704764"
            target="_blank"
            rel="noopener noreferrer"
            className="gongan-link"
          >
            皖公网安备34010402704764号
          </a>
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Alex Plum. Built with Vibe Coding.
        </div>
      </div>
    </footer>
  );
}
