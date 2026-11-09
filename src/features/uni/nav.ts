import { router, type Href } from 'expo-router';

/**
 * Leave the current university screen. Uses the back stack when there is one; otherwise (app reloaded on this
 * screen, or we arrived via router.replace) goes to `fallback`, so the button never does nothing.
 */
export function leave(fallback: Href = '/uni') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
