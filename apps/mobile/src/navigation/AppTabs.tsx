import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../components';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useNeighbourTheme } from '../theme';

import { type AppTabParamList, ROUTES } from './routes';

const Tabs = createBottomTabNavigator<AppTabParamList>();

interface TabIconProps {
  symbol: string;
  focused: boolean;
}

function TabIcon({ symbol, focused }: TabIconProps) {
  const { theme } = useNeighbourTheme();

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: focused ? theme.colors.primarySoft : 'transparent',
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText
        style={{
          color: focused ? theme.colors.primary : theme.colors.textMuted,
          fontSize: 19,
          lineHeight: 22,
        }}
      >
        {symbol}
      </AppText>
    </View>
  );
}

export default function AppTabs() {
  const { theme } = useNeighbourTheme();

  return (
    <Tabs.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 3,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.glassStrong,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 82,
          paddingBottom: 10,
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="⌂" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.COMMUNITIES}
        component={CommunitiesScreen}
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="◎" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.MESSAGES}
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="◌" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="◇" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="◉" />,
        }}
      />
    </Tabs.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 44,
  },
});
