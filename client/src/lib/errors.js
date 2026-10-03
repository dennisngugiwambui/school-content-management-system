/**
 * Friendly wording for every error the website can show, keyed by HTTP status
 * (plus "offline"). Shared by the full error pages and the smaller in-page error boxes.
 */
export const ERRORS = {
  400: {
    icon: 'patch-question',
    title: 'Hmm, that didn’t look right',
    text: 'Something in the link or the form wasn’t quite right. Please check it and try again.',
  },
  401: {
    icon: 'person-lock',
    title: 'Please sign in first',
    text: 'This page is only for signed-in staff. Sign in to continue, or head back to the website.',
  },
  403: {
    icon: 'shield-lock',
    title: 'This room is staff only',
    text: 'Your account doesn’t have permission to open this page. Ask the school administrator if you need access.',
  },
  404: {
    icon: 'compass',
    title: 'Oops! This page went missing',
    text: 'We looked everywhere, even under the desks, but couldn’t find it. It may have moved or no longer exists.',
  },
  408: {
    icon: 'hourglass-split',
    title: 'That took a little too long',
    text: 'The page took too long to answer. Please try again.',
  },
  413: {
    icon: 'file-earmark-x',
    title: 'That file is too big',
    text: 'Please choose a smaller file and try again.',
  },
  429: {
    icon: 'stopwatch',
    title: 'Whoa, slow down a little!',
    text: 'There were too many tries in a short time. Please wait a minute, then try again.',
  },
  500: {
    icon: 'tools',
    title: 'Something broke on our side',
    text: 'It’s not you, it’s us. Please try again in a little while.',
  },
  502: {
    icon: 'cloud-slash',
    title: 'The school server isn’t answering',
    text: 'We couldn’t get a reply from the server. Please try again in a few minutes.',
  },
  503: {
    icon: 'cup-hot',
    title: 'The website is taking a short break',
    text: 'We’re updating things or the server is busy. Please come back in a few minutes.',
  },
  504: {
    icon: 'hourglass-split',
    title: 'The server took too long',
    text: 'The school server didn’t answer in time. Please try again.',
  },
  offline: {
    icon: 'wifi-off',
    title: 'You’re offline',
    text: 'We can’t reach the internet right now. Check your connection, then try again.',
  },
};

/** Status codes that have their own page, e.g. /404. */
export const ERROR_PAGES = ['400', '401', '403', '404', '408', '429', '500', '502', '503', '504', 'offline'];

/** The key in ERRORS that best describes an error thrown by lib/api.js (or any Error). */
export function errorCode(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  const status = error?.status;
  if (ERRORS[status]) return String(status);
  if (status >= 500) return '500';
  if (status >= 400) return '400';
  if (/reach the server|failed to fetch|network/i.test(error?.message || '')) return 'offline';
  return '500';
}
