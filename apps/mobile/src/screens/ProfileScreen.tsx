import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Resource } from '../types/api';
import type { AppNotification } from '../types/api';
import { platformAlert as Alert } from '../utils/dialogs';
import { useMobileTheme } from '../theme';
import { openSecureResource } from '../utils/externalLinks';

export function ProfileScreen() {
  const { colors, styles, theme, toggleTheme } = useMobileTheme();
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [program, setProgram] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'members' | 'private'>('members');
  const [notificationPreferences, setNotificationPreferences] = useState({ groups: true, sessions: true, moderation: true });
  const [saving, setSaving] = useState(false);
  const [libraryCount, setLibraryCount] = useState(0);
  const [library, setLibrary] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [profile, library, notificationResult] = await Promise.all([api.profile(), api.library(), api.notifications()]);
      setBio(profile.user.bio || '');
      setMajor(profile.user.major || '');
      setYearOfStudy(profile.user.yearOfStudy || '');
      setProgram(profile.user.program || '');
      setProfileVisibility(profile.user.profileVisibility || 'members');
      setNotificationPreferences(profile.user.notificationPreferences || { groups: true, sessions: true, moderation: true });
      setLibraryCount(library.resources.length);
      setLibrary(library.resources);
      setNotifications(notificationResult.notifications);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to refresh your profile.'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function save() {
    setSaving(true);
    try { await api.updateProfile({ bio, major, yearOfStudy, program, profileVisibility, notificationPreferences }); Alert.alert('Profile updated', 'Your changes have been saved.'); } catch (error) { Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.'); } finally { setSaving(false); }
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Text style={[styles.subtitle, { marginTop: 8, marginBottom: 22 }]}>{user?.name} · {user?.email}</Text>
      {error && <View style={styles.card}><Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 12 }}>{error}</Text><Pressable style={styles.secondaryButton} onPress={load}><Text style={styles.secondaryButtonText}>Try again</Text></Pressable></View>}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic profile</Text>
        <Text style={styles.label}>Programme</Text>
        <TextInput style={styles.input} value={program} onChangeText={setProgram} placeholder="Your programme" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Major</Text>
        <TextInput style={styles.input} value={major} onChangeText={setMajor} placeholder="Your major" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Year of study</Text>
        <TextInput style={styles.input} value={yearOfStudy} onChangeText={setYearOfStudy} placeholder="e.g. Year 3" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline placeholder="Tell your study community about yourself" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Profile visibility</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={[styles.secondaryButton, profileVisibility === 'members' && { backgroundColor: colors.blue }]} onPress={() => setProfileVisibility('members')}>
            <Text style={[styles.secondaryButtonText, profileVisibility === 'members' && { color: colors.buttonText }]}>Study members</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, profileVisibility === 'private' && { backgroundColor: colors.blue }]} onPress={() => setProfileVisibility('private')}>
            <Text style={[styles.secondaryButtonText, profileVisibility === 'private' && { color: colors.buttonText }]}>Private</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.button, saving && { opacity: 0.6 }, { marginTop: 18 }]} onPress={save} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save profile'}</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.subtitle}>Dark mode</Text>
          <Switch
            accessibilityLabel="Dark mode"
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.borderControl, true: colors.navy }}
          />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification preferences</Text>
        {(['groups', 'sessions', 'moderation'] as const).map((key) => (
          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <Text style={styles.subtitle}>{key === 'groups' ? 'Group activity' : key === 'sessions' ? 'Session updates' : 'Report decisions'}</Text>
            <Switch value={notificationPreferences[key]} onValueChange={(value) => setNotificationPreferences((current) => ({ ...current, [key]: value }))} />
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent notifications</Text>
        {notifications.length
          ? notifications.slice(0, 10).map((item) => (
            <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.message}</Text>
              <Text style={styles.subtitle}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          ))
          : <Text style={styles.subtitle}>No notifications yet.</Text>}
      </View>
      <Text style={[styles.cardTitle, { marginTop: 22 }]}>My library ({libraryCount})</Text>
      {library.length
        ? library.map((resource) => (
          <Pressable style={styles.card} key={resource.id} onPress={() => openSecureResource(resource.url)}>
            <Text style={styles.cardTitle}>{resource.title}</Text>
            <Text style={styles.subtitle}>{resource.type}</Text>
            <Text style={{ color: colors.blue, fontWeight: '600', marginTop: 8 }}>Open resource</Text>
          </Pressable>
        ))
        : <Text style={[styles.subtitle, { marginBottom: 20 }]}>Your saved resources will appear here.</Text>}
      <Pressable style={[styles.secondaryButton, { borderColor: colors.borderControl, marginTop: 12 }]} onPress={() => signOut()}>
        <Text style={{ color: colors.danger, fontWeight: '700' }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
