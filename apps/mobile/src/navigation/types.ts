import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  GroupDetail: { id: number };
  SessionDetail: { id: number };
  ResourceDetail: { id: number };
  AcademicCourseDetail: { id: number };
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Sessions: undefined;
  Resources: undefined;
  Profile: undefined;
  Academic: undefined;
};

export type MainNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<MainStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;
