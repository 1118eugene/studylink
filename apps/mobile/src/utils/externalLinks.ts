import { Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../config';
import { getApiToken } from '../services/api';

export async function openSecureResource(url: string) {
  try {
    const apiBase = new URL(API_BASE_URL);
    const parsed = new URL(url, apiBase);
    const uploadMatch = parsed.origin === apiBase.origin
      ? /^\/(?:api\/)?uploads\/([A-Za-z0-9][A-Za-z0-9_.-]*)$/.exec(parsed.pathname)
      : null;

    if (uploadMatch) {
      const token = getApiToken();
      if (!token) throw new Error('Sign in to open this StudyLink upload.');
      const downloadUrl = `${API_BASE_URL}/api/uploads/${encodeURIComponent(uploadMatch[1])}`;
      const headers = { Authorization: `Bearer ${token}` };
      const popup = Platform.OS === 'web' ? window.open('about:blank', '_blank') : null;
      if (Platform.OS === 'web' && !popup) throw new Error('Allow pop-ups to open this StudyLink upload.');
      if (popup) popup.opener = null;

      try {
        if (Platform.OS === 'web') {
          const response = await fetch(downloadUrl, { headers });
          if (!response.ok) throw new Error('The uploaded StudyLink resource could not be opened.');
          const objectUrl = URL.createObjectURL(await response.blob());
          popup?.location.replace(objectUrl);
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          return;
        }

        if (!FileSystem.cacheDirectory) throw new Error('A temporary download location is unavailable.');
        const localFile = await FileSystem.downloadAsync(
          downloadUrl,
          `${FileSystem.cacheDirectory}${uploadMatch[1]}`,
          { headers },
        );
        if (localFile.status !== 200) throw new Error('The uploaded StudyLink resource could not be downloaded.');
        if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
        await Sharing.shareAsync(localFile.uri, { dialogTitle: 'Open StudyLink resource' });
      } catch (error) {
        popup?.close();
        throw error;
      }
      return;
    }

    if (parsed.protocol !== 'https:') throw new Error('Only secure web links are supported.');
    if (Platform.OS === 'web') {
      window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
    } else {
      void Linking.openURL(parsed.toString()).catch(() => Alert.alert('Could not open resource', 'This resource link is unavailable.'));
    }
  } catch (error) {
    Alert.alert('Could not open resource', error instanceof Error ? error.message : 'This resource does not contain a valid secure web link.');
  }
}
