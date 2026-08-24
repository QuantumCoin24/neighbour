import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { useMessages } from '../features/messages';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import HomeScreen from '../screens/HomeScreen';
import MapsScreen from '../screens/MapsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VibesScreen from '../screens/VibesScreen';
import { useNeighbourTheme } from '../theme';

import { type AppTabParamList, ROUTES } from './routes';

const Tabs = createBottomTabNavigator<AppTabParamList>();

type IconName = 'home' | 'communities' | 'vibes' | 'nearby' | 'messages' | 'profile';

interface NavIconProps {
  name: IconName;
  color: string;
}

function NavIcon({ name, color }: NavIconProps) {
  if (name === 'home') {
    return (
      <View style={styles.iconCanvas}>
        <View
          style={[
            styles.homeRoof,
            {
              borderBottomColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.homeBody,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.homeDoor,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'communities') {
    return (
      <View style={styles.iconCanvas}>
        <View
          style={[
            styles.personHead,
            styles.personHeadLeft,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.personHead,
            styles.personHeadRight,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.peopleBody,
            {
              borderColor: color,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'vibes') {
    return (
      <View style={styles.iconCanvas}>
        <View
          style={[
            styles.vibesPlay,
            {
              borderLeftColor: color,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'nearby') {
    return (
      <View style={styles.nearbyGlyph}>
        <View
          style={[
            styles.nearbyRing,
            {
              borderColor: color,
            },
          ]}
        >
          <View
            style={[
              styles.nearbyCore,
              {
                backgroundColor: color,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.nearbyVertical,
            styles.nearbyTop,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.nearbyVertical,
            styles.nearbyBottom,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.nearbyHorizontal,
            styles.nearbyLeft,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.nearbyHorizontal,
            styles.nearbyRight,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'messages') {
    return (
      <View style={styles.iconCanvas}>
        <View
          style={[
            styles.messageBubble,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.messageTail,
            {
              borderTopColor: color,
            },
          ]}
        />

        <View style={styles.messageDots}>
          <View style={[styles.messageDot, { backgroundColor: color }]} />
          <View style={[styles.messageDot, { backgroundColor: color }]} />
          <View style={[styles.messageDot, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconCanvas}>
      <View
        style={[
          styles.profileHead,
          {
            borderColor: color,
          },
        ]}
      />

      <View
        style={[
          styles.profileBody,
          {
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

export default function AppTabs() {
  const { theme } = useNeighbourTheme();
  const messages = useMessages();

  const renderIcon =
    (name: Exclude<IconName, 'nearby'>) =>
    ({ focused }: { focused: boolean }) => (
      <View
        style={[
          styles.standardIconContainer,
          {
            backgroundColor: focused ? theme.colors.primarySoft : 'transparent',
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <NavIcon name={name} color={focused ? theme.colors.primary : theme.colors.textMuted} />
      </View>
    );

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
          marginBottom: 2,
          marginTop: 2,
        },

        tabBarStyle: {
          backgroundColor: theme.colors.glassStrong,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 88,
          paddingBottom: 10,
          paddingTop: 8,
        },

        tabBarItemStyle: {
          paddingHorizontal: 1,
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: renderIcon('home'),
        }}
      />

      <Tabs.Screen
        name={ROUTES.COMMUNITIES}
        component={CommunitiesScreen}
        options={{
          title: 'Communities',
          tabBarIcon: renderIcon('communities'),
        }}
      />

      <Tabs.Screen
        name={ROUTES.VIBES}
        component={VibesScreen}
        options={{
          title: 'Vibes',
          tabBarIcon: renderIcon('vibes'),
        }}
      />
      <Tabs.Screen
        name={ROUTES.MAPS}
        component={MapsScreen}
        options={{
          title: 'Nearby',

          tabBarIcon: () => (
            <View
              style={[
                styles.nearbyButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                  borderRadius: theme.radius.pill,
                },
                theme.shadows.floating,
              ]}
            >
              <NavIcon name="nearby" color={theme.colors.inverseText} />
            </View>
          ),

          tabBarLabelStyle: {
            color: theme.colors.primary,
            fontSize: 10,
            fontWeight: '800',
            marginBottom: 2,
            marginTop: 5,
          },
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

          tabBarIcon: renderIcon('messages'),
        }}
      />

      <Tabs.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: renderIcon('profile'),
        }}
      />
    </Tabs.Navigator>
  );
}

const styles = StyleSheet.create({
  standardIconContainer: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 50,
  },

  vibesPlay: {
    borderBottomWidth: 9,
    borderLeftWidth: 15,
    borderTopWidth: 9,
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    height: 0,
    marginLeft: 4,
    width: 0,
  },
  iconCanvas: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    position: 'relative',
    width: 28,
  },

  homeRoof: {
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderLeftWidth: 9,
    borderRightColor: 'transparent',
    borderRightWidth: 9,
    height: 0,
    position: 'absolute',
    top: 2,
    width: 0,
  },

  homeBody: {
    borderRadius: 2,
    borderWidth: 1.8,
    bottom: 3,
    height: 13,
    position: 'absolute',
    width: 17,
  },

  homeDoor: {
    bottom: 3,
    height: 7,
    position: 'absolute',
    width: 4,
  },

  personHead: {
    borderRadius: 5,
    borderWidth: 1.8,
    height: 8,
    position: 'absolute',
    top: 2,
    width: 8,
  },

  personHeadLeft: {
    left: 4,
  },

  personHeadRight: {
    right: 4,
  },

  peopleBody: {
    borderBottomWidth: 0,
    borderRadius: 10,
    borderWidth: 1.8,
    bottom: 2,
    height: 11,
    width: 24,
  },

  nearbyButton: {
    alignItems: 'center',
    borderWidth: 5,
    height: 58,
    justifyContent: 'center',
    marginTop: -22,
    width: 58,
  },

  nearbyGlyph: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    width: 30,
  },

  nearbyRing: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },

  nearbyCore: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },

  nearbyVertical: {
    height: 5,
    position: 'absolute',
    width: 2,
  },

  nearbyTop: {
    top: 0,
  },

  nearbyBottom: {
    bottom: 0,
  },

  nearbyHorizontal: {
    height: 2,
    position: 'absolute',
    width: 5,
  },

  nearbyLeft: {
    left: 0,
  },

  nearbyRight: {
    right: 0,
  },

  messageBubble: {
    borderRadius: 5,
    borderWidth: 1.8,
    height: 17,
    position: 'absolute',
    top: 2,
    width: 23,
  },

  messageTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 1,
    borderTopWidth: 5,
    bottom: 1,
    height: 0,
    left: 5,
    position: 'absolute',
    transform: [{ rotate: '18deg' }],
    width: 0,
  },

  messageDots: {
    flexDirection: 'row',
    gap: 3,
    position: 'absolute',
    top: 9,
  },

  messageDot: {
    borderRadius: 2,
    height: 3,
    width: 3,
  },

  profileHead: {
    borderRadius: 6,
    borderWidth: 1.8,
    height: 10,
    position: 'absolute',
    top: 1,
    width: 10,
  },

  profileBody: {
    borderBottomWidth: 0,
    borderRadius: 10,
    borderWidth: 1.8,
    bottom: 1,
    height: 12,
    width: 21,
  },
});
