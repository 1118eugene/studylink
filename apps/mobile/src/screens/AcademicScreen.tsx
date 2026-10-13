import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import type { AcademicCourse, AcademicProgram, AcademicSchool, Course, CourseResource } from '../types/api';
import type { MainNavigation } from '../navigation/types';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import { colors, styles } from '../theme';
import { openSecureResource } from '../utils/externalLinks';
import { confirmAction, platformAlert as Alert } from '../utils/dialogs';

export function AcademicScreen() {
  const navigation = useNavigation<MainNavigation>();
  const [schools, setSchools] = useState<AcademicSchool[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number>();
  const [selectedProgram, setSelectedProgram] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setError('');
    const failures: string[] = [];
    await Promise.all([
      api.academicSchools().then((result) => { setSchools(result.schools); }).catch(() => { failures.push('schools'); }),
      api.academicCourses().then((result) => { setCourses(result.courses); }).catch(() => { failures.push('courses'); }),
      api.courses().then((result) => { setEnrolledCourses(result.courses.filter((course) => course.isEnrolled)); }).catch(() => { failures.push('enrolled courses'); }),
    ]);
    if (failures.length) setError(`Some academic information could not be loaded: ${failures.join(', ')}.`);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function chooseSchool(id: number) { setSelectedSchool(id); setSelectedProgram(undefined); setPrograms([]); setCourses([]); setError(''); try { setPrograms((await api.academicPrograms(id)).programs); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load programs.'); } }
  async function chooseProgram(id: number) { setSelectedProgram(id); setCourses([]); setError(''); try { setCourses((await api.academicCourses(id)).courses); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load courses.'); } }
  async function withdrawCourse(course: Course) {
    const confirmed = await confirmAction('Withdraw from course?', `You will no longer be enrolled in ${course.code}.`);
    if (!confirmed) return;
    try {
      await api.withdrawCourse(course.id);
      await load();
      Alert.alert('Course withdrawn', `You are no longer enrolled in ${course.code}.`);
    } catch (err) {
      Alert.alert('Could not withdraw', err instanceof Error ? err.message : 'Please try again.');
    }
  }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}><Text style={styles.title}>Academic hub</Text><Text style={[styles.subtitle, { marginTop: 6, marginBottom: 20 }]}>Browse your university structure and course resources.</Text>{loading ? <LoadingState /> : <>{error && <ErrorState message={error} onRetry={load} />}{enrolledCourses.length > 0 && <><Text style={styles.cardTitle}>My enrolled courses</Text>{enrolledCourses.map((course) => <View style={styles.card} key={`enrolled-${course.id}`}><Text style={styles.cardTitle}>{course.code} · {course.title}</Text><Text style={styles.subtitle}>Currently enrolled</Text><Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => withdrawCourse(course)}><Text style={styles.secondaryButtonText}>Withdraw</Text></Pressable></View>)}</>}<Text style={styles.cardTitle}>Schools</Text>{schools.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>{schools.map((school) => <Pressable key={school.id} style={[styles.secondaryButton, { marginRight: 8, paddingHorizontal: 14, backgroundColor: selectedSchool === school.id ? colors.navy : '#E7F0F8' }]} onPress={() => chooseSchool(school.id)}><Text style={{ color: selectedSchool === school.id ? colors.surface : colors.navy, fontWeight: '700' }}>{school.name}</Text></Pressable>)}</ScrollView> : <EmptyState message="No schools have been added yet." />}{selectedSchool && <><Text style={styles.cardTitle}>Programs</Text>{programs.length ? programs.map((program) => <Pressable key={program.id} style={[styles.card, selectedProgram === program.id && { borderColor: colors.blue }]} onPress={() => chooseProgram(program.id)}><Text style={styles.cardTitle}>{program.name}</Text><Text style={styles.subtitle}>{program.code || 'Program'}</Text></Pressable>) : <EmptyState message="No programs found for this school." />}</>}<Text style={[styles.cardTitle, { marginTop: 8 }]}>Courses</Text>{courses.length ? courses.map((course) => <Pressable key={course.id} style={styles.card} onPress={() => navigation.navigate('AcademicCourseDetail', { id: course.id })}><Text style={styles.cardTitle}>{course.code} · {course.title}</Text><Text style={styles.subtitle}>{course.description || course.program_name || 'Academic course'}</Text></Pressable>) : <EmptyState message={selectedProgram ? 'No courses found for this program.' : 'Select a school and program to browse courses.'} />}</>}</ScrollView>;
}

export function AcademicCourseDetailScreen({ route }: { route: { params: { id: number } } }) {
  const [course, setCourse] = useState<AcademicCourse>();
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { const [courseResponse, resourceResponse] = await Promise.all([api.academicCourse(route.params.id), api.academicCourseResources(route.params.id)]); setCourse(courseResponse.course); setResources(resourceResponse.resources); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load course details.'); } }, [route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (error) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ErrorState message={error} onRetry={load} /></ScrollView>;
  if (!course) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><LoadingState /></ScrollView>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{course.code}</Text><Text style={[styles.subtitle, { fontSize: 19, color: colors.ink, marginTop: 6, marginBottom: 12 }]}>{course.title}</Text><View style={styles.card}><Text style={styles.cardTitle}>Academic context</Text><Text style={styles.subtitle}>{course.program_name || 'Program not specified'}{course.year_number ? ` · Year ${course.year_number}` : ''}{course.semester_name ? ` · ${course.semester_name}` : ''}</Text></View><Text style={styles.cardTitle}>Overview</Text><Text style={[styles.subtitle, { marginBottom: 20 }]}>{course.description || 'No course description has been added.'}</Text><Text style={styles.cardTitle}>Course resources</Text>{resources.length ? resources.map((resource) => <Pressable style={styles.card} key={resource.id} onPress={() => openSecureResource(resource.url)}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.subtitle}>{resource.resource_type || 'Resource'}</Text><Text style={{ color: colors.blue, fontWeight: '700', marginTop: 8 }}>Open resource</Text></Pressable>) : <EmptyState message="No resources have been added to this course." />}</ScrollView>;
}
