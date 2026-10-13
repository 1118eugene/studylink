import { Alert, Linking, Platform } from 'react-native';

export function openSecureResource(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('Only secure web links are supported.');
    if (Platform.OS === 'web') {
      window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
    } else {
      void Linking.openURL(parsed.toString()).catch(() => Alert.alert('Could not open resource', 'This resource link is unavailable.'));
    }
  } catch {
    Alert.alert('Could not open resource', 'This resource does not contain a valid secure web link.');
  }
}
