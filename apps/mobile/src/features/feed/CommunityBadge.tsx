import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface CommunityBadgeProps {
  label: string;
}

export function CommunityBadge({ label }: CommunityBadgeProps) {
  const { theme } = useNeighbourTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.primarySoft,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: theme.colors.primary,
          fontWeight: '600',
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
