import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface FeedAvatarProps {
  displayName: string;
  avatarUrl: string | null;
}

export function FeedAvatar({ displayName, avatarUrl }: FeedAvatarProps) {
  const { theme } = useNeighbourTheme();

  if (avatarUrl) {
    return (
      <Image
        accessibilityLabel={`${displayName}'s profile picture`}
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="label" tone="brand">
        {displayName.trim().slice(0, 1).toUpperCase() || 'N'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
