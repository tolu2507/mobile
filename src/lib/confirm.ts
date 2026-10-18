import { Alert, Platform } from 'react-native';

type Options = { title: string; message: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean };

/**
 * Asks yes/no and resolves true on yes. React Native Web's Alert ignores buttons, so the web
 * build uses the browser's own confirm box instead.
 */
export function confirm({ title, message, confirmLabel, cancelLabel = 'Cancel', destructive }: Options): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
