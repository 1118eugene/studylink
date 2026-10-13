import 'react-native-gesture-handler';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { GroupsScreen, GroupDetailScreen } from './src/screens/GroupsScreen';
import { SessionsScreen, SessionDetailScreen } from './src/screens/SessionsScreen';
import { ResourcesScreen, ResourceDetailScreen } from './src/screens/ResourcesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AcademicScreen, AcademicCourseDetailScreen } from './src/screens/AcademicScreen';
import { MobileThemeProvider, useMobileTheme } from './src/theme';
import type { MainStackParamList, MainTabParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors } = useMobileTheme();
  return <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.navy, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontWeight: '700' } }}>
    <Tabs.Screen name="Home" component={HomeScreen} />
    <Tabs.Screen name="Groups" component={GroupsScreen} />
    <Tabs.Screen name="Sessions" component={SessionsScreen} />
    <Tabs.Screen name="Resources" component={ResourcesScreen} />
    <Tabs.Screen name="Academic" component={AcademicScreen} />
    <Tabs.Screen name="Profile" component={ProfileScreen} />
  </Tabs.Navigator>;
}

function AppContent() {
  const { user, loading } = useAuth();
  const { colors } = useMobileTheme();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.navy} /><Text style={{ color: colors.muted, marginTop: 12 }}>Loading StudyLink...</Text></View>;
  if (!user) return <AuthScreen />;
  return <NavigationContainer><Stack.Navigator><Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} /><Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Study group' }} /><Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Study session' }} /><Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} options={{ title: 'Resource' }} /><Stack.Screen name="AcademicCourseDetail" component={AcademicCourseDetailScreen} options={{ title: 'Course' }} /></Stack.Navigator></NavigationContainer>;
}

function AppStatusBar() {
  const { theme } = useMobileTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return <MobileThemeProvider><AuthProvider><AppStatusBar /><AppContent /></AuthProvider></MobileThemeProvider>;
}
