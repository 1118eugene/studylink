import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import type { Course, Group, Resource, Session } from '../types/api';
import { useMobileTheme } from '../theme';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import type { MainNavigation } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type DashboardData = { courses: Course[]; groups: Group[]; sessions: Session[]; resources: Resource[] };
type SectionError = { courses?: string; groups?: string; sessions?: string; resources?: string };
type LoadResult<T> = { data: T } | { error: unknown };

function loadSection<T>(promise: Promise<T>): Promise<LoadResult<T>> {
  return promise.then((data) => ({ data })).catch((error: unknown) => ({ error }));
}

export function HomeScreen() {
  const { colors, styles } = useMobileTheme();
  const { user } = useAuth();
  const navigation = useNavigation<MainNavigation>();
  const [data, setData] = useState<DashboardData>({ courses: [], groups: [], sessions: [], resources: [] });
  const [errors, setErrors] = useState<SectionError>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setErrors({});
    const coursesResult = await loadSection(api.courses());
    const groupsResult = await loadSection(api.groups());
    const sessionsResult = await loadSection(api.sessions());
    const resourcesResult = await loadSection(api.resources());
    const next: DashboardData = { courses: [], groups: [], sessions: [], resources: [] };
    const nextErrors: SectionError = {};
    if ('data' in coursesResult) next.courses = coursesResult.data.courses;
    else nextErrors.courses = coursesResult.error instanceof Error ? coursesResult.error.message : 'Unable to load this section.';
    if ('data' in groupsResult) next.groups = groupsResult.data.groups;
    else nextErrors.groups = groupsResult.error instanceof Error ? groupsResult.error.message : 'Unable to load this section.';
    if ('data' in sessionsResult) next.sessions = sessionsResult.data.sessions;
    else nextErrors.sessions = sessionsResult.error instanceof Error ? sessionsResult.error.message : 'Unable to load this section.';
    if ('data' in resourcesResult) next.resources = resourcesResult.data.resources;
    else nextErrors.resources = resourcesResult.error instanceof Error ? resourcesResult.error.message : 'Unable to load this section.';
    setData(next);
    setErrors(nextErrors);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }
  if (loading) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.subtitle}>Good to see you,</Text><Text style={styles.title}>{user?.name || 'Student'}</Text><LoadingState /></ScrollView>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}><Text style={styles.subtitle}>Good to see you,</Text><Text style={[styles.title, { marginBottom: 6 }]}>{user?.name || 'Student'}</Text><Text style={[styles.subtitle, { marginBottom: 22 }]}>Your StudyLink academic companion.</Text><View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>{[['Courses', data.courses.length], ['Groups', data.groups.length], ['Sessions', data.sessions.length]].map(([label, count]) => <View key={String(label)} style={[styles.card, { flex: 1, marginBottom: 0, padding: 12 }]}><Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text><Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800', marginTop: 4 }}>{count}</Text></View>)}</View><View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}><Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => navigation.navigate('Tabs', { screen: 'Groups' })}><Text style={styles.secondaryButtonText}>Find a group</Text></Pressable><Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => navigation.navigate('Tabs', { screen: 'Resources' })}><Text style={styles.secondaryButtonText}>Study resources</Text></Pressable></View><Text style={styles.cardTitle}>Enrolled courses</Text>{errors.courses ? <ErrorState message={errors.courses} onRetry={load} /> : data.courses.length ? data.courses.slice(0, 3).map((course) => <Pressable key={course.id} style={styles.card} onPress={() => navigation.navigate('AcademicCourseDetail', { id: course.id })}><Text style={styles.cardTitle}>{course.code} · {course.title}</Text><Text style={styles.subtitle}>{course.description || course.category || 'Course'}</Text></Pressable>) : <EmptyState message="You are not enrolled in any courses yet." />}<Text style={[styles.cardTitle, { marginTop: 8 }]}>Upcoming sessions</Text>{errors.sessions ? <ErrorState message={errors.sessions} onRetry={load} /> : data.sessions.length ? data.sessions.slice(0, 3).map((session) => <Pressable key={session.id} style={styles.card} onPress={() => navigation.navigate('SessionDetail', { id: session.id })}><Text style={styles.cardTitle}>{session.title}</Text><Text style={styles.subtitle}>{session.dayOfWeek || session.startsAt || 'Scheduled session'} · {session.location || 'Online'}</Text></Pressable>) : <EmptyState message="No upcoming sessions yet." />}<Text style={[styles.cardTitle, { marginTop: 8 }]}>Study groups</Text>{errors.groups ? <ErrorState message={errors.groups} onRetry={load} /> : data.groups.length ? data.groups.slice(0, 3).map((group) => <Pressable key={group.id} style={styles.card} onPress={() => navigation.navigate('GroupDetail', { id: group.id })}><Text style={styles.cardTitle}>{group.name}</Text><Text style={styles.subtitle}>{group.courseCode || group.course || 'Academic group'} · {group.members} members</Text></Pressable>) : <EmptyState message="No study groups are available yet." />}<Text style={[styles.cardTitle, { marginTop: 8 }]}>Learning resources</Text>{errors.resources ? <ErrorState message={errors.resources} onRetry={load} /> : data.resources.length ? data.resources.slice(0, 2).map((resource) => <Pressable key={resource.id} style={styles.card} onPress={() => navigation.navigate('ResourceDetail', { id: resource.id })}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.subtitle}>{resource.type} · {resource.audience || 'Study material'}</Text></Pressable>) : <EmptyState message="No resources are available yet." />}</ScrollView>;
}
