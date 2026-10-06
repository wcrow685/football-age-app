// Google Analytics 4 events (gtag is loaded in index.html). Never let a
// blocked or missing gtag break the page.
export function track(name, params = {}) {
  try {
    window.gtag?.("event", name, params);
  } catch {
    /* analytics blocked */
  }
}
