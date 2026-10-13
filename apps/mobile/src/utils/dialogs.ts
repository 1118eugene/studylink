import { Alert, Platform } from 'react-native';

type DialogButton = {
  text: string;
  style?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export function showDialog(title: string, message: string, buttons?: DialogButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  if (buttons?.length) {
    const action = buttons.find((button) => button.style !== 'cancel');
    if (action && window.confirm(`${title}\n\n${message}`)) void action.onPress?.();
    return;
  }

  window.alert(`${title}\n\n${message}`);
}

export const platformAlert = { alert: showDialog };

export function confirmAction(title: string, message: string) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
