import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Resource } from '../types/api';
import { colors, styles } from '../theme';
import { openSecureResource } from '../utils/externalLinks';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [saving, setSaving] = useState(false);
  const [libraryCount, setLibraryCount] = useState(0);
  const [library, setLibrary] = useState<Resource[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [profile, library] = await Promise.all([api.profile(), api.library()]);
      setBio(profile.bio || '');
      setMajor(profile.major || '');
      setYearOfStudy(profile.yearOfStudy || '');
      setLibraryCount(library.resources.length);
      setLibrary(library.resources);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to refresh your profile.'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function save() {
    setSaving(true);
    try { await api.updateProfile({ bio, major, yearOfStudy }); Alert.alert('Profile updated', 'Your changes have been saved.'); } catch (error) { Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.'); } finally { setSaving(false); }
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>Profile</Text><Text style={[styles.subtitle, { marginTop: 8, marginBottom: 22 }]}>{user?.name} · {user?.email}</Text>{error && <View style={styles.card}><Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 12 }}>{error}</Text><Pressable style={styles.secondaryButton} onPress={load}><Text style={styles.secondaryButtonText}>Try again</Text></Pressable></View>}<Text style={styles.cardTitle}>Academic profile</Text><Text style={styles.label}>Major</Text><TextInput style={styles.input} value={major} onChangeText={setMajor} placeholder="Your major" placeholderTextColor={colors.muted} /><Text style={styles.label}>Year of study</Text><TextInput style={styles.input} value={yearOfStudy} onChangeText={setYearOfStudy} placeholder="e.g. Year 3" placeholderTextColor={colors.muted} /><Text style={styles.label}>Bio</Text><TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline placeholder="Tell your study community about yourself" placeholderTextColor={colors.muted} /><Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save profile'}</Text></Pressable><Text style={[styles.cardTitle, { marginTop: 22 }]}>My library ({libraryCount})</Text>{library.length ? library.map((resource) => <Pressable style={styles.card} key={resource.id} onPress={() => openSecureResource(resource.url)}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.subtitle}>{resource.type}</Text><Text style={{ color: colors.blue, fontWeight: '700', marginTop: 8 }}>Open resource</Text></Pressable>) : <Text style={[styles.subtitle, { marginBottom: 20 }]}>Your saved resources will appear here.</Text>}<Pressable style={[styles.secondaryButton, { borderColor: '#F0C7C4', borderWidth: 1, marginTop: 12 }]} onPress={() => signOut()}><Text style={{ color: colors.danger, fontWeight: '800' }}>Sign out</Text></Pressable></ScrollView>;
}
