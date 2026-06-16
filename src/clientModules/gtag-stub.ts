// Ensures window.gtag is always a callable function stub before
// @docusaurus/plugin-google-gtag's onRouteDidUpdate fires.
// This guards against Cookiebot auto-blocking delaying the headTags
// consent script that normally defines window.gtag.
if (typeof window !== 'undefined') {
  (window as any).dataLayer = (window as any).dataLayer || [];
  if (typeof (window as any).gtag !== 'function') {
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };
  }
}

export {};
