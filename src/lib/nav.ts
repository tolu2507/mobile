import { router, type Href } from 'expo-router';

/**
 * Back to the previous screen, or to `fallback` when there isn't one: on web after a refresh or an opened link,
 * the app has no history and a plain router.back() does nothing.
 */
export const goBack = (fallback: Href = '/') => (router.canGoBack() ? router.back() : router.replace(fallback));
