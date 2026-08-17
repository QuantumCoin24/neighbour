import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import NeighbourMark from '../components/brand/NeighbourMark';
import { useAuth } from '../auth/auth-context';
import { AppText } from '../components';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import CreateBusinessScreen from '../screens/CreateBusinessScreen';
import EditBusinessScreen from '../screens/EditBusinessScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ConversationScreen from '../screens/ConversationScreen';
import LoginScreen from '../screens/LoginScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import PremiumScreen from '../screens/PremiumScreen';
import CreateMarketplaceListingScreen from '../features/marketplace-listings/screens/CreateMarketplaceListingScreen';
import MarketplaceListingDetailScreen from '../features/marketplace-listings/screens/MarketplaceListingDetailScreen';
import MarketplaceListingsScreen from '../features/marketplace-listings/screens/MarketplaceListingsScreen';
import MyMarketplaceListingsScreen from '../features/marketplace-listings/screens/MyMarketplaceListingsScreen';
import SavedMarketplaceListingsScreen from '../features/marketplace-listings/screens/SavedMarketplaceListingsScreen';
import { FulfilmentScreen } from '../features/marketplace-fulfilment';
import {
  MakeMarketplaceOfferScreen,
  MarketplaceOfferDetailScreen,
  MarketplaceOffersScreen,
  MarketplaceTransactionsScreen,
} from '../features/marketplace-transactions';

import { useNeighbourTheme } from '../theme';

import AppTabs from './AppTabs';
import { type RootStackParamList, ROUTES } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SessionLoadingScreen() {
  const { theme } = useNeighbourTheme();

  return (
    <View
      style={[
        styles.loadingScreen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <NeighbourMark size={76} style={theme.shadows.floating} />

      <AppText
        style={{
          color: theme.colors.primaryStrong,
          fontSize: 22,
          fontWeight: '800',
        }}
      >
        Neighbour™
      </AppText>

      <ActivityIndicator color={theme.colors.primary} size="small" />

      <AppText variant="caption" tone="muted">
        Stronger together. Local forever.
      </AppText>
    </View>
  );
}

export default function AppNavigator() {
  const { theme, isDark } = useNeighbourTheme();
  const { status, user } = useAuth();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;

  const navigationTheme: NavigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };

  if (status === 'restoring') {
    return <SessionLoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name={ROUTES.APP} component={AppTabs} />

            <Stack.Screen name={ROUTES.CONVERSATION} component={ConversationScreen} />

            <Stack.Screen name={ROUTES.COMMUNITY_DETAIL} component={CommunityDetailScreen} />

            <Stack.Screen name={ROUTES.CREATE_COMMUNITY} component={CreateCommunityScreen} />

            <Stack.Screen name={ROUTES.CREATE_EVENT} component={CreateEventScreen} />

            <Stack.Screen name={ROUTES.EVENT_DETAIL} component={EventDetailScreen} />

            <Stack.Screen name={ROUTES.BUSINESS_DETAIL} component={BusinessDetailScreen} />

            <Stack.Screen name={ROUTES.MARKETPLACE} component={MarketplaceScreen} />

            <Stack.Screen name={ROUTES.EDIT_BUSINESS} component={EditBusinessScreen} />

            <Stack.Screen name={ROUTES.CREATE_BUSINESS} component={CreateBusinessScreen} />

            <Stack.Screen
              name={ROUTES.MARKETPLACE_LISTINGS}
              component={MarketplaceListingsScreen}
            />

            <Stack.Screen
              name={ROUTES.CREATE_MARKETPLACE_LISTING}
              component={CreateMarketplaceListingScreen}
            />

            <Stack.Screen
              name={ROUTES.MARKETPLACE_LISTING_DETAIL}
              component={MarketplaceListingDetailScreen}
            />

            <Stack.Screen
              name={ROUTES.MY_MARKETPLACE_LISTINGS}
              component={MyMarketplaceListingsScreen}
            />

            <Stack.Screen
              name={ROUTES.SAVED_MARKETPLACE_LISTINGS}
              component={SavedMarketplaceListingsScreen}
            />

            <Stack.Screen name={ROUTES.MARKETPLACE_OFFERS} component={MarketplaceOffersScreen} />

            <Stack.Screen
              name={ROUTES.MARKETPLACE_TRANSACTIONS}
              component={MarketplaceTransactionsScreen}
            />

            <Stack.Screen
              name={ROUTES.MAKE_MARKETPLACE_OFFER}
              component={MakeMarketplaceOfferScreen}
            />

            <Stack.Screen
              name={ROUTES.MARKETPLACE_OFFER_DETAIL}
              component={MarketplaceOfferDetailScreen}
            />

            <Stack.Screen
              name={ROUTES.MARKETPLACE_TRANSACTION_DETAIL}
              getComponent={() =>
                require('../features/marketplace-transactions/screens/MarketplaceTransactionDetailScreen')
                  .default
              }
            />

            <Stack.Screen name={ROUTES.MARKETPLACE_FULFILMENT} component={FulfilmentScreen} />

            <Stack.Screen name={ROUTES.PREMIUM} component={PremiumScreen} />
          </>
        ) : (
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
  },
  loadingMark: {
    alignItems: 'center',
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
});
