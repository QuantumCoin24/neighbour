import { ApiClientError, createPost, type FeedPost, type PostType } from '@neighbour/api-client';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface CommunityPostComposerProps {
  communityId: string;
  communityName: string;
  canPin: boolean;
  onCreated: (post: FeedPost) => void;
}

interface PostTypeOption {
  type: PostType;
  label: string;
  symbol: string;
  prompt: string;
}

const POST_TYPES: PostTypeOption[] = [
  {
    type: 'STANDARD',
    label: 'Post',
    symbol: '✎',
    prompt: 'Share an update with your community…',
  },
  {
    type: 'ANNOUNCEMENT',
    label: 'Announcement',
    symbol: '◉',
    prompt: 'Publish an important community announcement…',
  },
  {
    type: 'QUESTION',
    label: 'Question',
    symbol: '?',
    prompt: 'Ask your neighbours a question…',
  },
  {
    type: 'RECOMMENDATION',
    label: 'Recommend',
    symbol: '★',
    prompt: 'Recommend a local place, service or idea…',
  },
  {
    type: 'HELP_REQUEST',
    label: 'Need help',
    symbol: '♡',
    prompt: 'Explain what help you need from neighbours…',
  },
  {
    type: 'LOST_FOUND',
    label: 'Lost & found',
    symbol: '⌕',
    prompt: 'Describe the lost or found item…',
  },
  {
    type: 'SAFETY_ALERT',
    label: 'Safety alert',
    symbol: '!',
    prompt: 'Share clear, factual safety information…',
  },
  {
    type: 'ROAD_CLOSURE',
    label: 'Road closure',
    symbol: '↯',
    prompt: 'Explain where the closure is and what neighbours should know…',
  },
  {
    type: 'LOCAL_UPDATE',
    label: 'Local update',
    symbol: '⌖',
    prompt: 'Share a useful update about the local area…',
  },
  {
    type: 'VOLUNTEER_REQUEST',
    label: 'Volunteers',
    symbol: '+',
    prompt: 'Explain the project and what volunteers can help with…',
  },
];

function requiresTitle(type: PostType): boolean {
  return (
    type === 'ANNOUNCEMENT' ||
    type === 'QUESTION' ||
    type === 'SAFETY_ALERT' ||
    type === 'ROAD_CLOSURE' ||
    type === 'LOST_FOUND' ||
    type === 'VOLUNTEER_REQUEST'
  );
}

export function CommunityPostComposer({
  communityId,
  communityName,
  canPin,
  onCreated,
}: CommunityPostComposerProps) {
  const { theme } = useNeighbourTheme();

  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<PostType>('STANDARD');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = POST_TYPES.find((option) => option.type === type) ?? POST_TYPES[0];

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  const validationMessage = useMemo(() => {
    if (trimmedContent.length === 0) {
      return 'Write something before publishing.';
    }

    if (requiresTitle(type) && trimmedTitle.length < 3) {
      return 'Add a clear title for this type of post.';
    }

    return null;
  }, [trimmedContent, trimmedTitle, type]);

  const reset = () => {
    setExpanded(false);
    setType('STANDARD');
    setTitle('');
    setContent('');
    setIsPinned(false);
    setError(null);
  };

  const submit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (publishing || savingDraft) {
      return;
    }

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (status === 'PUBLISHED') {
      setPublishing(true);
    } else {
      setSavingDraft(true);
    }

    setError(null);

    try {
      const created = await createPost({
        communityId,
        content: trimmedContent,
        type,
        status,
        visibility: 'COMMUNITY',
        ...(trimmedTitle
          ? {
              title: trimmedTitle,
            }
          : {}),
        ...(canPin
          ? {
              isPinned,
            }
          : {}),
      });

      if (status === 'PUBLISHED') {
        onCreated(created);
      }

      reset();
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        setError(caughtError.message || 'The post could not be saved.');
      } else {
        setError('The post could not be saved. Please try again.');
      }
    } finally {
      setPublishing(false);
      setSavingDraft(false);
    }
  };

  if (!expanded) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setExpanded(true);
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <Card style={styles.collapsed}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone="brand">
              N
            </AppText>
          </View>

          <View
            style={[
              styles.placeholder,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText tone="muted">Share something with {communityName}…</AppText>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card style={styles.composer}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <AppText variant="subheading">Create a community post</AppText>

          <AppText variant="caption" tone="secondary">
            Publishing to {communityName}
          </AppText>
        </View>

        <Pressable
          accessibilityLabel="Close post composer"
          accessibilityRole="button"
          disabled={publishing || savingDraft}
          onPress={reset}
          style={[
            styles.close,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="bodyStrong">×</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.typeRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {POST_TYPES.map((option) => {
          const selected = option.type === type;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              key={option.type}
              onPress={() => {
                setType(option.type);
                setError(null);
              }}
              style={[
                styles.typeOption,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText
                style={{
                  color: selected ? theme.colors.inverseText : theme.colors.primary,
                  fontWeight: '800',
                }}
              >
                {option.symbol}
              </AppText>

              <AppText
                variant="caption"
                style={{
                  color: selected ? theme.colors.inverseText : theme.colors.text,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {requiresTitle(type) ? (
        <TextInput
          maxLength={160}
          onChangeText={setTitle}
          placeholder="Post title"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.titleInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
      ) : null}

      <TextInput
        maxLength={10000}
        multiline
        onChangeText={setContent}
        placeholder={selectedType.prompt}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[
          styles.contentInput,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.lg,
            color: theme.colors.text,
          },
        ]}
        textAlignVertical="top"
        value={content}
      />

      <View style={styles.counterRow}>
        <AppText variant="caption" tone="muted">
          {content.length}/10000
        </AppText>

        <AppText variant="caption" tone="secondary">
          {selectedType.label}
        </AppText>
      </View>

      {canPin ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: isPinned,
          }}
          onPress={() => {
            setIsPinned((value) => !value);
          }}
          style={[
            styles.pinRow,
            {
              backgroundColor: isPinned ? theme.colors.primarySoft : theme.colors.surfaceMuted,
              borderColor: isPinned ? theme.colors.primary : theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <View style={styles.pinCopy}>
            <AppText variant="bodyStrong">Pin this post</AppText>

            <AppText variant="caption" tone="secondary">
              Keep it prominent in the community feed.
            </AppText>
          </View>

          <AppText variant="label" tone={isPinned ? 'brand' : 'muted'}>
            {isPinned ? 'On' : 'Off'}
          </AppText>
        </Pressable>
      ) : null}

      {error ? (
        <View
          style={[
            styles.error,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.danger,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: theme.colors.danger,
            }}
          >
            {error}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={publishing || savingDraft}
          onPress={() => {
            void submit('DRAFT');
          }}
          style={[
            styles.action,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
              opacity: publishing || savingDraft ? 0.6 : 1,
            },
          ]}
        >
          {savingDraft ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <AppText variant="label" tone="brand">
              Save Draft
            </AppText>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={publishing || savingDraft}
          onPress={() => {
            void submit('PUBLISHED');
          }}
          style={[
            styles.action,
            styles.publish,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              opacity: publishing || savingDraft ? 0.6 : 1,
            },
          ]}
        >
          {publishing ? (
            <ActivityIndicator color={theme.colors.inverseText} size="small" />
          ) : (
            <AppText variant="label" tone="inverse">
              Publish Post
            </AppText>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  collapsed: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  placeholder: {
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  composer: {
    gap: 15,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
    gap: 3,
  },
  close: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  typeRow: {
    gap: 8,
  },
  typeOption: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  titleInput: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  contentInput: {
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 150,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinRow: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    padding: 13,
  },
  pinCopy: {
    flex: 1,
    gap: 3,
  },
  error: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  publish: {
    flex: 1.25,
  },
});
