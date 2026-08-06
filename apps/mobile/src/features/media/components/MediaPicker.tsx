import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';
import { useMediaPicker } from '../hooks/useMediaPicker';
import type { PendingMedia } from '../types';

interface MediaPickerProps {
  items: PendingMedia[];
  disabled?: boolean;
  maximum?: number;
  onChange: (items: PendingMedia[]) => void;
}

export function MediaPicker({ items, disabled = false, maximum = 9, onChange }: MediaPickerProps) {
  const { theme } = useNeighbourTheme();

  const { error, opening, pickFromLibrary, takePhoto } = useMediaPicker();

  const addItems = (selected: PendingMedia[]) => {
    const remaining = Math.max(0, maximum - items.length);

    onChange([...items, ...selected.slice(0, remaining)]);
  };

  const choosePhotos = async () => {
    const result = await pickFromLibrary();

    addItems(result.items);
  };

  const capturePhoto = async () => {
    const result = await takePhoto();

    addItems(result.items);
  };

  const remove = (localId: string) => {
    onChange(items.filter((item) => item.localId !== localId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || opening || items.length >= maximum}
          onPress={() => {
            void choosePhotos();
          }}
          style={[
            styles.action,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          {opening ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <AppText variant="label" tone="brand">
              Choose Photos
            </AppText>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={disabled || opening || items.length >= maximum}
          onPress={() => {
            void capturePhoto();
          }}
          style={[
            styles.action,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Take Photo
          </AppText>
        </Pressable>
      </View>

      <AppText variant="caption" tone="secondary">
        {items.length}/{maximum} photos
      </AppText>

      {items.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.previewRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {items.map((item, index) => (
            <View key={item.localId} style={styles.preview}>
              <Image
                source={{
                  uri: item.uri,
                }}
                style={[
                  styles.image,
                  {
                    borderRadius: theme.radius.lg,
                  },
                ]}
              />

              <View
                style={[
                  styles.position,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone="inverse">
                  {index + 1}
                </AppText>
              </View>

              <Pressable
                accessibilityLabel="Remove photo"
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => {
                  remove(item.localId);
                }}
                style={[
                  styles.remove,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="bodyStrong">×</AppText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Card variant="muted" style={styles.empty}>
          <AppText variant="bodyStrong">Add photos</AppText>

          <AppText variant="caption" tone="secondary">
            Share up to nine images with your community.
          </AppText>
        </Card>
      )}

      {error ? (
        <AppText
          variant="caption"
          style={{
            color: theme.colors.danger,
          }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  previewRow: {
    gap: 10,
  },
  preview: {
    height: 118,
    position: 'relative',
    width: 118,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  position: {
    alignItems: 'center',
    bottom: 6,
    height: 24,
    justifyContent: 'center',
    left: 6,
    position: 'absolute',
    width: 24,
  },
  remove: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 30,
  },
  empty: {
    gap: 4,
    minHeight: 88,
    justifyContent: 'center',
  },
});
