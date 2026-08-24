import {
  reactToVibe,
  removeVibeReaction,
  saveVibe,
  unsaveVibe,
  type Vibe,
} from '@neighbour/api-client';
import {
  useCallback,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface VibeEngagementRailProps {
  vibe: Vibe;
  onChange: (vibe: Vibe) => void;
  onComments: () => void;
}

function compactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(value);
}

interface RailButtonProps {
  glyph: string;
  label: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function RailButton({
  glyph,
  label,
  count,
  active = false,
  disabled = false,
  onPress,
}: RailButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          opacity:
            disabled
              ? 0.45
              : pressed
                ? 0.72
                : 1,
        },
      ]}
    >
      <View
        style={[
          styles.glyphCircle,
          active ? styles.glyphCircleActive : null,
        ]}
      >
        <Text
          style={[
            styles.glyph,
            active ? styles.glyphActive : null,
          ]}
        >
          {glyph}
        </Text>
      </View>

      {count !== undefined ? (
        <Text style={styles.count}>
          {compactCount(count)}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function VibeEngagementRail({
  vibe,
  onChange,
  onComments,
}: VibeEngagementRailProps) {
  const [busy, setBusy] = useState(false);

  const toggleReaction = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      if (vibe.engagement.myReaction) {
        await removeVibeReaction(vibe.id);

        onChange({
          ...vibe,
          engagement: {
            ...vibe.engagement,
            myReaction: null,
            reactionCount: Math.max(
              0,
              vibe.engagement.reactionCount - 1,
            ),
          },
        });

        return;
      }

      const updated = await reactToVibe(
        vibe.id,
        'LOVE',
      );

      onChange(updated);
    } finally {
      setBusy(false);
    }
  }, [busy, onChange, vibe]);

  const toggleSave = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      if (vibe.engagement.savedByMe) {
        await unsaveVibe(vibe.id);

        onChange({
          ...vibe,
          engagement: {
            ...vibe.engagement,
            savedByMe: false,
            saveCount: Math.max(
              0,
              vibe.engagement.saveCount - 1,
            ),
          },
        });

        return;
      }

      await saveVibe(vibe.id);

      onChange({
        ...vibe,
        engagement: {
          ...vibe.engagement,
          savedByMe: true,
          saveCount:
            vibe.engagement.saveCount + 1,
        },
      });
    } finally {
      setBusy(false);
    }
  }, [busy, onChange, vibe]);

  return (
    <View style={styles.rail}>
      <RailButton
        active={Boolean(vibe.engagement.myReaction)}
        count={vibe.engagement.reactionCount}
        disabled={busy}
        glyph="♥"
        label="React to Vibe"
        onPress={() => {
          void toggleReaction();
        }}
      />

      <RailButton
        count={vibe.engagement.commentCount}
        glyph="◌"
        label="Open comments"
        onPress={onComments}
      />

      <RailButton
        active={vibe.engagement.savedByMe}
        count={vibe.engagement.saveCount}
        disabled={busy}
        glyph="◆"
        label="Save Vibe"
        onPress={() => {
          void toggleSave();
        }}
      />

      <RailButton
        count={vibe.engagement.shareCount}
        glyph="↗"
        label="Share Vibe"
        onPress={() => {
          // Native share transport arrives in the dedicated sharing build.
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: 18,
  },
  button: {
    alignItems: 'center',
    minWidth: 52,
  },
  glyphCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  glyphCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  glyph: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },
  glyphActive: {
    color: '#111815',
  },
  count: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },
});
