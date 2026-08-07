import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../components';
import { useMessages } from '../features/messages';
import { useNotifications } from '../features/notifications';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import HomeScreen from '../screens/HomeScreen';
import MapsScreen from '../screens/MapsScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
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
          backgroundColor: focused ? theme.colors.primary : 'transparent',
          borderColor: focused ? theme.colors.primary : 'transparent',
          borderRadius: theme.radius.pill,
        },
        focused ? theme.shadows.subtle : null,
      ]}
    >
      <AppText
        style={{
          color: focused ? theme.colors.inverseText : theme.colors.textMuted,
          fontSize: focused ? 20 : 18,
          fontWeight: '800',
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
  const messages = useMessages();
  const notifications = useNotifications();

  return (
    <Tabs.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 3,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.glassStrong,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 86,
          paddingBottom: 10,
          paddingTop: 7,
        },
        tabBarItemStyle: {
          paddingHorizontal: 1,
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
        name={ROUTES.SEARCH}
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="⌕" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.MAPS}
        component={MapsScreen}
        options={{
          title: 'Maps',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="⌖" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.MARKETPLACE}
        component={MarketplaceScreen}
        options={{
          title: 'Market',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="▣" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.MESSAGES}
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarBadge:
            messages.unreadCount > 0
              ? messages.unreadCount > 99
                ? '99+'
                : messages.unreadCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.danger,
            color: theme.colors.inverseText,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="◌" />,
        }}
      />

      <Tabs.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarBadge:
            notifications.unreadCount > 0
              ? notifications.unreadCount > 99
                ? '99+'
                : notifications.unreadCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.danger,
            color: theme.colors.inverseText,
            fontSize: 10,
            fontWeight: '700',
          },
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
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 48,
  },
});
