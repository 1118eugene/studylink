import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import type { Resource } from '../types/api';
import type { MainNavigation } from '../navigation/types';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import { colors, styles } from '../theme';
import { openSecureResource } from '../utils/externalLinks';

export function ResourcesScreen() {
  const navigation = useNavigation<MainNavigation>();
  const [resources, setResources] = useState<Resource[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const load = useCallback(async () => { try { setError(''); setResources((await api.resources()).resources); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load resources.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const filtered = resources.filter((item) => `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(query.toLowerCase()));
  async function save(id: number) { if (savedIds.includes(id)) return; try { await api.saveResource(id); setSavedIds((current) => [...current, id]); Alert.alert('Saved to library', 'You can find this resource in your profile library.'); } catch (err) { Alert.alert('Could not save resource', err instanceof Error ? err.message : 'Please try again.'); } }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}><Text style={styles.title}>Resources</Text><TextInput style={[styles.input, { marginTop: 18 }]} placeholder="Search resources" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} />{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState message="No matching resources found." /> : filtered.map((resource) => { const saved = savedIds.includes(resource.id); return <View style={styles.card} key={resource.id}><Pressable onPress={() => navigation.navigate('ResourceDetail', { id: resource.id })}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.subtitle}>{resource.type} · {resource.description || 'Study material'}</Text></Pressable><Pressable style={[styles.secondaryButton, { marginTop: 12, opacity: saved ? 0.65 : 1 }]} onPress={() => save(resource.id)} disabled={saved}><Text style={styles.secondaryButtonText}>{saved ? 'Saved' : 'Save resource'}</Text></Pressable><Pressable onPress={() => openSecureResource(resource.url)} style={{ paddingTop: 12 }}><Text style={{ color: colors.blue, fontWeight: '700' }}>Open resource</Text></Pressable></View>; })}</ScrollView>;
}

export function ResourceDetailScreen({ route }: { route: { params: { id: number } } }) {
  const [resource, setResource] = useState<Resource>();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const load = useCallback(async () => { try { setResource((await api.resource(route.params.id)).resource); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load this resource.'); } }, [route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (error) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ErrorState message={error} onRetry={load} /></ScrollView>;
  if (!resource) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><LoadingState /></ScrollView>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{resource.title}</Text><Text style={[styles.subtitle, { marginVertical: 12 }]}>{resource.description || 'StudyLink resource'}</Text><View style={styles.card}><Text style={styles.cardTitle}>Resource information</Text><Text style={styles.subtitle}>Type: {resource.type || 'Not specified'}</Text>{resource.audience && <Text style={[styles.subtitle, { marginTop: 7 }]}>Audience: {resource.audience}</Text>}{resource.usageNotes && <Text style={[styles.subtitle, { marginTop: 7 }]}>How to use it: {resource.usageNotes}</Text>}<Text style={[styles.subtitle, { marginTop: 7 }]}>Saved/accessed by {resource.downloads} students</Text></View><Pressable style={styles.button} onPress={() => openSecureResource(resource.url)}><Text style={styles.buttonText}>Open resource</Text></Pressable><Pressable style={[styles.secondaryButton, { marginTop: 12, opacity: saved ? 0.65 : 1 }]} disabled={saved} onPress={async () => { try { await api.saveResource(resource.id); setSaved(true); Alert.alert('Saved to library', 'This resource is now in your library.'); } catch (err) { Alert.alert('Could not save resource', err instanceof Error ? err.message : 'Please try again.'); } }}><Text style={styles.secondaryButtonText}>{saved ? 'Saved to library' : 'Save to library'}</Text></Pressable></ScrollView>;
}
