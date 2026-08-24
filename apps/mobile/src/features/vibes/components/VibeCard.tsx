import type { Vibe } from '@neighbour/api-client';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components';
import { VibeEngagementRail } from './VibeEngagementRail';
import { VibeMediaSurface } from './VibeMediaSurface';

interface VibeCardProps {
  vibe: Vibe;
  active: boolean;
  height: number;
  onChange: (vibe: Vibe) => void;
  onComments: () => void;
}

export function VibeCard({
  vibe,
  active,
  height,
  onChange,
  onComments,
}: VibeCardProps) {
  return (
    <View
      style={[
        styles.container,
        {
          height,
        },
      ]}
    >
      <VibeMediaSurface
        active={active}
        vibe={vibe}
      />

      <View style={styles.topShade} />
      <View style={styles.bottomShade} />

      <View style={styles.topBar}>
        <View>
          <AppText
            style={styles.brand}
            tone="inverse"
          >
            VIBES
          </AppText>

          <AppText
            style={styles.subBrand}
            tone="inverse"
          >
            Your local world. Moving.
          </AppText>
        </View>

        <View style={styles.localBadge}>
          <AppText
            variant="label"
            tone="inverse"
          >
            {vibe.postcode ?? 'LOCAL'}
          </AppText>
        </View>
      </View>

      <View style={styles.bottomContent}>
        <View style={styles.copyColumn}>
          <View style={styles.creatorRow}>
            {vibe.creator.avatarUrl ? (
              <Image
                source={{
                  uri: vibe.creator.avatarUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText
                  variant="bodyStrong"
                  tone="inverse"
                >
                  {vibe.creator.displayName
                    .slice(0, 1)
                    .toUpperCase()}
                </AppText>
              </View>
            )}

            <AppText
              variant="bodyStrong"
              tone="inverse"
            >
              {vibe.creator.displayName}
            </AppText>
          </View>

          {vibe.caption ? (
            <AppText
              style={styles.caption}
              tone="inverse"
            >
              {vibe.caption}
            </AppText>
          ) : null}

          <View style={styles.metaRow}>
            <AppText
              variant="caption"
              tone="inverse"
            >
              ◉ {vibe.engagement.viewCount} views
            </AppText>

            {vibe.neighbourhoodId ? (
              <AppText
                variant="caption"
                tone="inverse"
              >
                · Neighbourhood
              </AppText>
            ) : null}
          </View>
        </View>

        <VibeEngagementRail
          onChange={onChange}
          onComments={onComments}
          vibe={vibe}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080A0D',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  topShade: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    height: 130,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomShade: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    bottom: 0,
    height: 260,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 18,
    position: 'absolute',
    right: 18,
    top: 18,
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  subBrand: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
    opacity: 0.78,
  },
  localBadge: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bottomContent: {
    alignItems: 'flex-end',
    bottom: 24,
    flexDirection: 'row',
    gap: 12,
    left: 18,
    position: 'absolute',
    right: 14,
  },
  copyColumn: {
    flex: 1,
    gap: 9,
    paddingBottom: 4,
  },
  creatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  avatar: {
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    width: 36,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 300,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 7,
    opacity: 0.82,
  },
});
