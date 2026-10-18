/**
 * Web build of push.ts (Metro picks this file on web). Phone push notifications don't exist in the
 * browser, so registration reports "unavailable" and nothing is listened for.
 */
export type PushStatus = 'on' | 'denied' | 'unavailable';

export async function registerForPush(_ask: boolean): Promise<PushStatus> {
  return 'unavailable';
}

export function usePushNotifications(_navigationReady: boolean) {}
