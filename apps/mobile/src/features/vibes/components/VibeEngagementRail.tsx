import {
  reactToVibe,
  removeVibeReaction,
  saveVibe,
  unsaveVibe,
  type Vibe,
  type VibeReactionType,
} from '@neighbour/api-client';
import { useCallback, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

interface VibeEngagementRailProps {
  vibe: Vibe;
  onChange: (vibe: Vibe) => void;
  onComments: () => void;
}

const REACTIONS: Array<{
  type: VibeReactionType;
  glyph: string;
  label: string;
}> = [
  {
    type: 'LIKE',
    glyph: '👍',
    label: 'Like',
  },
  {
    type: 'LOVE',
    glyph: '♥',
    label: 'Love',
  },
  {
    type: 'FIRE',
    glyph: '🔥',
    label: 'Fire',
  },
  {
    type: 'LAUGH',
    glyph: '😂',
    label: 'Laugh',
  },
  {
    type: 'WOW',
    glyph: '😮',
    label: 'Wow',
  },
];

function reactionGlyph(type: VibeReactionType | null): string {
  return REACTIONS.find((item) => item.type === type)?.glyph ?? '♥';
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
  onLongPress?: () => void;
}

function RailButton({
  glyph,
  label,
  count,
  active = false,
  disabled = false,
  onPress,
  onLongPress,
}: RailButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      delayLongPress={260}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.45 : pressed ? 0.68 : 1,
          transform: [
            {
              scale: pressed ? 0.92 : 1,
            },
          ],
        },
      ]}
    >
      <View style={[styles.glyphCircle, active ? styles.glyphCircleActive : null]}>
        <Text style={[styles.glyph, active ? styles.glyphActive : null]}>{glyph}</Text>
      </View>

      {count !== undefined ? <Text style={styles.count}>{compactCount(count)}</Text> : null}
    </Pressable>
  );
}

export function VibeEngagementRail({ vibe, onChange, onComments }: VibeEngagementRailProps) {
  const [reactionBusy, setReactionBusy] = useState(false);

  const [saveBusy, setSaveBusy] = useState(false);

  const [shareBusy, setShareBusy] = useState(false);

  const [showReactions, setShowReactions] = useState(false);

  const chooseReaction = useCallback(
    async (type: VibeReactionType) => {
      if (reactionBusy) {
        return;
      }

      setReactionBusy(true);
      setShowReactions(false);

      const previous = vibe;
      const previousType = vibe.engagement.myReaction;

      const addingNew = previousType === null;

      onChange({
        ...vibe,
        engagement: {
          ...vibe.engagement,
          myReaction: type,
          reactionCount: addingNew
            ? vibe.engagement.reactionCount + 1
            : vibe.engagement.reactionCount,
        },
      });

      try {
        const updated = await reactToVibe(vibe.id, type);

        onChange(updated);
      } catch {
        onChange(previous);
      } finally {
        setReactionBusy(false);
      }
    },
    [onChange, reactionBusy, vibe],
  );

  const toggleReaction = useCallback(async () => {
    if (reactionBusy) {
      return;
    }

    if (!vibe.engagement.myReaction) {
      await chooseReaction('LOVE');

      return;
    }

    setReactionBusy(true);

    const previous = vibe;

    onChange({
      ...vibe,
      engagement: {
        ...vibe.engagement,
        myReaction: null,
        reactionCount: Math.max(0, vibe.engagement.reactionCount - 1),
      },
    });

    try {
      await removeVibeReaction(vibe.id);
    } catch {
      onChange(previous);
    } finally {
      setReactionBusy(false);
    }
  }, [chooseReaction, onChange, reactionBusy, vibe]);

  const toggleSave = useCallback(async () => {
    if (saveBusy) {
      return;
    }

    setSaveBusy(true);

    const previous = vibe;
    const wasSaved = vibe.engagement.savedByMe;

    onChange({
      ...vibe,
      engagement: {
        ...vibe.engagement,
        savedByMe: !wasSaved,
        saveCount: wasSaved
          ? Math.max(0, vibe.engagement.saveCount - 1)
          : vibe.engagement.saveCount + 1,
      },
    });

    try {
      if (wasSaved) {
        await unsaveVibe(vibe.id);
      } else {
        await saveVibe(vibe.id);
      }
    } catch {
      onChange(previous);
    } finally {
      setSaveBusy(false);
    }
  }, [onChange, saveBusy, vibe]);

  const share = useCallback(async () => {
    if (shareBusy) {
      return;
    }

    setShareBusy(true);

    try {
      const creator = vibe.creator.displayName.trim();

      const caption = vibe.caption?.trim();

      const message = [
        creator ? `${creator} shared a Vibe on Neighbour™` : 'Check out this Vibe on Neighbour™',
        caption || null,
        vibe.postcode ? `📍 ${vibe.postcode}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      await Share.share({
        message,
        title: 'Neighbour™ Vibe',
      });
    } finally {
      setShareBusy(false);
    }
  }, [shareBusy, vibe]);

  return (
    <View style={styles.rail}>
      {showReactions ? (
        <View style={styles.reactionPalette}>
          {REACTIONS.map((reaction) => {
            const active = vibe.engagement.myReaction === reaction.type;

            return (
              <Pressable
                accessibilityLabel={reaction.label}
                accessibilityRole="button"
                disabled={reactionBusy}
                key={reaction.type}
                onPress={() => {
                  void chooseReaction(reaction.type);
                }}
                style={({ pressed }) => [
                  styles.reactionChoice,
                  active ? styles.reactionChoiceActive : null,
                  pressed ? styles.reactionChoicePressed : null,
                ]}
              >
                <Text style={styles.reactionChoiceGlyph}>{reaction.glyph}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <RailButton
        active={Boolean(vibe.engagement.myReaction)}
        count={vibe.engagement.reactionCount}
        disabled={reactionBusy}
        glyph={reactionGlyph(vibe.engagement.myReaction)}
        label={vibe.engagement.myReaction ? 'Remove reaction' : 'React to Vibe'}
        onLongPress={() => {
          setShowReactions(true);
        }}
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
        disabled={saveBusy}
        glyph="◆"
        label={vibe.engagement.savedByMe ? 'Unsave Vibe' : 'Save Vibe'}
        onPress={() => {
          void toggleSave();
        }}
      />

      <RailButton
        count={vibe.engagement.shareCount}
        disabled={shareBusy}
        glyph="↗"
        label="Share Vibe"
        onPress={() => {
          void share();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: 18,
    position: 'relative',
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

  reactionPalette: {
    alignItems: 'center',
    backgroundColor: 'rgba(9,12,11,0.96)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 7,
    position: 'absolute',
    right: 58,
    top: 0,
    zIndex: 30,
  },

  reactionChoice: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },

  reactionChoiceActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  reactionChoicePressed: {
    transform: [
      {
        scale: 1.18,
      },
    ],
  },

  reactionChoiceGlyph: {
    fontSize: 24,
  },
});
