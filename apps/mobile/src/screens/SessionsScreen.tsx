import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Session } from '../types/api';
import type { MainNavigation } from '../navigation/types';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import { colors, styles } from '../theme';
import { dateError, lengthError, required } from '../utils/validation';
import { platformAlert as Alert } from '../utils/dialogs';

function DetailList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{values.map((item) => <Text key={item} style={[styles.subtitle, { marginTop: 6 }]}>• {item}</Text>)}</View>;
}

export function SessionsScreen() {
  const navigation = useNavigation<MainNavigation>();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try { setError(''); const [sessionResponse, groupResponse] = await Promise.all([api.sessions(), api.groups()]); setSessions(sessionResponse.sessions); setGroups(groupResponse.groups.map((group) => ({ id: group.id, name: group.name }))); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load sessions.'); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function toggleRsvp(session: Session) {
    try {
      if (session.isEnrolled) await api.withdrawSession(session.id);
      else await api.enrollSession(session.id);
      await load();
      Alert.alert(session.isEnrolled ? 'RSVP cancelled' : 'Enrollment confirmed', session.isEnrolled ? 'You are no longer attending this session.' : 'You are enrolled in this study session.');
    } catch (err) { Alert.alert('Could not update RSVP', err instanceof Error ? err.message : 'Please try again.'); }
  }
  async function create() { const parsedGroupId = Number(groupId); const validation = parsedGroupId > 0 ? '' : 'Enter a valid group ID.'; const fieldValidation = validation || required(title, 'Session title') || lengthError(title, 'Session title', 2, 160) || dateError(startsAt) || required(location, 'Location'); if (fieldValidation) return Alert.alert('Check your details', fieldValidation); setSaving(true); try { await api.createSession({ groupId: parsedGroupId, title, startsAt, location }); setShowForm(false); setGroupId(''); setTitle(''); setStartsAt(''); setLocation(''); await load(); Alert.alert('Session created', 'The study session is now available to the group.'); } catch (err) { Alert.alert('Could not create session', err instanceof Error ? err.message : 'Please try again.'); } finally { setSaving(false); } }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={styles.title}>Sessions</Text><Text style={[styles.subtitle, { marginTop: 6, marginBottom: 20 }]}>Plan focused time with your study community.</Text></View><Pressable onPress={() => setShowForm((value) => !value)}><Text style={{ color: colors.blue, fontWeight: '800' }}>{showForm ? 'Close' : 'Create'}</Text></Pressable></View>{showForm && <View style={styles.card}><Text style={styles.cardTitle}>Create a study session</Text><Text style={styles.label}>Group ID</Text><TextInput style={styles.input} value={groupId} onChangeText={setGroupId} keyboardType="number-pad" placeholder={groups.length ? `Available: ${groups.map((group) => `${group.id} ${group.name}`).join(', ')}` : 'Enter group ID'} placeholderTextColor={colors.muted} /><Text style={styles.label}>Title</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Session title" placeholderTextColor={colors.muted} /><Text style={styles.label}>Start time</Text><TextInput style={styles.input} value={startsAt} onChangeText={setStartsAt} placeholder="2026-09-30T14:00:00Z" placeholderTextColor={colors.muted} /><Text style={styles.label}>Location</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Room or online link" placeholderTextColor={colors.muted} /><Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={create} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Creating...' : 'Create session'}</Text></Pressable></View>}  {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : sessions.length === 0 ? <EmptyState message="No study sessions are scheduled." /> : sessions.map((session) => <View key={session.id} style={styles.card}><Pressable onPress={() => navigation.navigate('SessionDetail', { id: session.id })}><Text style={styles.cardTitle}>{session.title}</Text><Text style={styles.subtitle}>{session.dayOfWeek || session.startsAt || 'Date to be announced'}</Text><Text style={styles.subtitle}>{session.location || 'Online'} · {session.group || 'Study group'} · {session.status}</Text></Pressable>{session.status !== 'Cancelled' && <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => toggleRsvp(session)}><Text style={styles.secondaryButtonText}>{session.isEnrolled ? 'Cancel RSVP' : <>{'Join session'}{' (RSVP to session)'}</>}</Text></Pressable>}</View>)}</ScrollView>;
}

export function SessionDetailScreen({ route }: { route: { params: { id: number } } }) {
  const navigation = useNavigation<MainNavigation>();
  const { user } = useAuth();
  const [session, setSession] = useState<Session>();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setError(''); setSession((await api.session(route.params.id)).session); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load this session.'); } }, [route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function remove() { Alert.alert('Delete session?', 'This action cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deleteSession(route.params.id); navigation.goBack(); } catch (err) { Alert.alert('Could not delete session', err instanceof Error ? err.message : 'Please try again.'); } } }]); }
  function beginEdit() { setTitle(session?.title || ''); setStartsAt(session?.startsAt || ''); setLocation(session?.location || ''); setEditing(true); }
  async function saveEdit() {
    const validation = required(title, 'Session title') || lengthError(title, 'Session title', 2, 160) || dateError(startsAt);
    if (validation) return Alert.alert('Check your details', validation);
    setSaving(true);
    try { await api.updateSession(route.params.id, { title, startsAt, location }); setEditing(false); await load(); Alert.alert('Session updated', 'Your changes have been saved.'); } catch (err) { Alert.alert('Could not update session', err instanceof Error ? err.message : 'Please try again.'); } finally { setSaving(false); }
  }
  async function toggleRsvp(currentSession: Session) {
    try {
      if (currentSession.isEnrolled) await api.withdrawSession(currentSession.id);
      else await api.enrollSession(currentSession.id);
      await load();
      Alert.alert(currentSession.isEnrolled ? 'RSVP cancelled' : 'Enrollment confirmed', currentSession.isEnrolled ? 'You are no longer attending this session.' : 'You are enrolled in this study session.');
    } catch (err) {
      Alert.alert('Could not update RSVP', err instanceof Error ? err.message : 'Please try again.');
    }
  }
  if (error) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ErrorState message={error} onRetry={load} /></ScrollView>;
  if (!session) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><LoadingState /></ScrollView>;
  const currentSession = session;
  const canManage = user?.role === 'admin'
    || Number(currentSession.createdByUserId) === Number(user?.id)
    || Number(currentSession.groupOwnerUserId) === Number(user?.id);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{currentSession.title}</Text><Text style={[styles.subtitle, { marginVertical: 10 }]}>{currentSession.dayOfWeek || currentSession.startsAt || 'Date to be announced'} · {currentSession.location || 'Online'}</Text>{editing && <View style={styles.card}><Text style={styles.cardTitle}>Edit session</Text><Text style={styles.label}>Title</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} /><Text style={styles.label}>Start time</Text><TextInput style={styles.input} value={startsAt} onChangeText={setStartsAt} placeholder="2026-09-30T14:00:00Z" placeholderTextColor={colors.muted} /><Text style={styles.label}>Location</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} /><Pressable style={styles.button} onPress={saveEdit} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save changes'}</Text></Pressable></View>}<View style={styles.card}><Text style={styles.cardTitle}>Study group</Text><Text style={styles.subtitle}>{currentSession.group || 'StudyLink group'} {currentSession.courseCode ? `· ${currentSession.courseCode}` : ''}</Text><Text style={[styles.subtitle, { marginTop: 8 }]}>{currentSession.enrolledCount} enrolled · {currentSession.status}</Text></View>{currentSession.status !== 'Cancelled' && <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={() => toggleRsvp(currentSession)}><Text style={styles.secondaryButtonText}>{currentSession.isEnrolled ? 'Cancel RSVP' : 'RSVP to session'}</Text></Pressable>}<DetailList title="Agenda" values={currentSession.agenda} /><DetailList title="Preparation" values={currentSession.prepNotes} /><DetailList title="Attendance rules" values={currentSession.attendanceRules} />{canManage && <><Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={beginEdit}><Text style={styles.secondaryButtonText}>Edit session</Text></Pressable><Pressable style={[styles.secondaryButton, { borderColor: '#F0C7C4', borderWidth: 1, marginTop: 8 }]} onPress={remove}><Text style={{ color: colors.danger, fontWeight: '800' }}>Delete session</Text></Pressable></>}</ScrollView>;
}
