import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Group } from '../types/api';
import type { MainNavigation } from '../navigation/types';
import { colors, styles } from '../theme';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import { lengthError, required } from '../utils/validation';

function ListSection({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{items.map((item) => <Text key={item} style={[styles.subtitle, { marginTop: 6 }]}>• {item}</Text>)}</View>;
}

export function GroupsScreen() {
  const navigation = useNavigation<MainNavigation>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [meetingType, setMeetingType] = useState('Hybrid');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try { setError(''); setGroups((await api.groups()).groups); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load groups.'); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function join(id: number) { try { await api.enrollGroup(id); Alert.alert('You joined the group', 'The group is now part of your StudyLink activity.'); await load(); } catch (err) { Alert.alert('Could not join group', err instanceof Error ? err.message : 'Please try again.'); } }
  async function create() {
    const validation = required(name, 'Group name') || lengthError(name, 'Group name', 2, 120) || required(description, 'Description') || required(courseCode, 'Course code') || required(meetingType, 'Meeting type');
    if (validation) return Alert.alert('Check your details', validation);
    setSaving(true);
    try { await api.createGroup({ name, description, courseCode, meetingType }); setName(''); setDescription(''); setCourseCode(''); setShowForm(false); await load(); Alert.alert('Group created', 'Your new study group is ready.'); } catch (err) { Alert.alert('Could not create group', err instanceof Error ? err.message : 'Please try again.'); } finally { setSaving(false); }
  }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={styles.title}>Study groups</Text><Text style={[styles.subtitle, { marginTop: 6, marginBottom: 20 }]}>Find peers working toward the same academic goals.</Text></View><Pressable onPress={() => setShowForm((value) => !value)}><Text style={{ color: colors.blue, fontWeight: '800' }}>{showForm ? 'Close' : 'Create'}</Text></Pressable></View>
    {showForm && <View style={styles.card}><Text style={styles.cardTitle}>Create a study group</Text><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Database revision circle" placeholderTextColor={colors.muted} /><Text style={styles.label}>Description</Text><TextInput style={styles.input} value={description} onChangeText={setDescription} multiline placeholder="What will members work on?" placeholderTextColor={colors.muted} /><Text style={styles.label}>Course code</Text><TextInput style={styles.input} value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" placeholder="e.g. CS101" placeholderTextColor={colors.muted} /><Text style={styles.label}>Meeting type</Text><TextInput style={styles.input} value={meetingType} onChangeText={setMeetingType} placeholder="Hybrid, Online, or In-Person" placeholderTextColor={colors.muted} /><Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={create} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Creating...' : 'Create group'}</Text></Pressable></View>}
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : groups.length === 0 ? <EmptyState message="No study groups are available yet." /> : groups.map((group) => <View key={group.id} style={styles.card}><Pressable onPress={() => navigation.navigate('GroupDetail', { id: group.id })}><Text style={styles.cardTitle}>{group.name}</Text><Text style={styles.subtitle}>{group.description || 'StudyLink collaboration group'}</Text><Text style={{ color: colors.teal, fontWeight: '700', marginTop: 10 }}>{group.courseCode || group.course || 'Academic group'} · {group.members} members</Text></Pressable><Pressable style={[styles.secondaryButton, { marginTop: 14 }]} onPress={() => join(group.id)}><Text style={styles.secondaryButtonText}>Join group</Text></Pressable></View>)}
  </ScrollView>;
}

export function GroupDetailScreen({ route }: { route: { params: { id: number } } }) {
  const navigation = useNavigation<MainNavigation>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group>();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setError(''); setGroup((await api.group(route.params.id)).group); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load this group.'); } }, [route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function remove() { Alert.alert('Delete group?', 'This removes the group and its sessions.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deleteGroup(route.params.id); navigation.goBack(); } catch (err) { Alert.alert('Could not delete group', err instanceof Error ? err.message : 'Please try again.'); } } }]); }
  function beginEdit() { setName(group?.name || ''); setDescription(group?.description || ''); setCourseCode(group?.courseCode || ''); setMeetingType(group?.meetingType || 'Hybrid'); setEditing(true); }
  async function saveEdit() {
    const validation = required(name, 'Group name') || lengthError(name, 'Group name', 2, 120);
    if (validation) return Alert.alert('Check your details', validation);
    setSaving(true);
    try { await api.updateGroup(route.params.id, { name, description, courseCode, meetingType }); setEditing(false); await load(); Alert.alert('Group updated', 'Your changes have been saved.'); } catch (err) { Alert.alert('Could not update group', err instanceof Error ? err.message : 'Please try again.'); } finally { setSaving(false); }
  }
  if (error) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ErrorState message={error} onRetry={load} /></ScrollView>;
  if (!group) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><LoadingState /></ScrollView>;
  const canManage = Number(group.ownerUserId) === Number(user?.id) || user?.role === 'admin';
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{group.name}</Text><Text style={[styles.subtitle, { marginVertical: 10 }]}>{group.description || 'StudyLink collaboration group'}</Text>{editing && <View style={styles.card}><Text style={styles.cardTitle}>Edit group</Text><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} /><Text style={styles.label}>Description</Text><TextInput style={styles.input} value={description} onChangeText={setDescription} multiline /><Text style={styles.label}>Course code</Text><TextInput style={styles.input} value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" /><Text style={styles.label}>Meeting type</Text><TextInput style={styles.input} value={meetingType} onChangeText={setMeetingType} /><Pressable style={styles.button} onPress={saveEdit} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save changes'}</Text></Pressable></View>}<View style={styles.card}><Text style={styles.cardTitle}>About this group</Text><Text style={styles.subtitle}>{group.courseCode || group.course || 'Academic collaboration'} · {group.meetingType}</Text><Text style={[styles.subtitle, { marginTop: 8 }]}>{group.members} members · {group.sessionCount} sessions</Text>{group.whoCanJoin && <Text style={[styles.subtitle, { marginTop: 10 }]}>Who can join: {group.whoCanJoin}</Text>}{group.communicationChannel && <Text style={[styles.subtitle, { marginTop: 8 }]}>Communication: {group.communicationChannel}</Text>}{group.scheduleNotes && <Text style={[styles.subtitle, { marginTop: 8 }]}>Schedule: {group.scheduleNotes}</Text>}</View><ListSection title="Join requirements" items={group.joinRequirements} /><ListSection title="Group rules" items={group.groupRules} /><ListSection title="Member benefits" items={group.memberBenefits} /><ListSection title="New member steps" items={group.newMemberSteps} /><Text style={styles.cardTitle}>Sessions</Text>{group.sessions?.length ? group.sessions.map((session) => <Pressable style={styles.card} key={session.id} onPress={() => navigation.navigate('SessionDetail', { id: session.id })}><Text style={styles.cardTitle}>{session.title}</Text><Text style={styles.subtitle}>{session.startsAt || 'Date to be announced'}</Text></Pressable>) : <EmptyState message="This group has no sessions yet." />}{canManage && <><Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={beginEdit}><Text style={styles.secondaryButtonText}>Edit group</Text></Pressable><Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={remove}><Text style={{ color: colors.danger, fontWeight: '800' }}>Delete group</Text></Pressable></>}</ScrollView>;
}
