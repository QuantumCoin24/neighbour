import {
  createVibeComment,
  getVibeComments,
  type VibeComment,
} from '@neighbour/api-client';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface VibeCommentsSheetProps {
  vibeId: string | null;
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function VibeCommentsSheet({
  vibeId,
  visible,
  onClose,
  onCreated,
}: VibeCommentsSheetProps) {
  const { theme } = useNeighbourTheme();

  const [comments, setComments] =
    useState<VibeComment[]>([]);

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!vibeId) {
      return;
    }

    setLoading(true);

    try {
      setComments(
        await getVibeComments(vibeId),
      );
    } finally {
      setLoading(false);
    }
  }, [vibeId]);

  useEffect(() => {
    if (visible) {
      void load();
    }
  }, [load, visible]);

  const submit = useCallback(async () => {
    const content = text.trim();

    if (!vibeId || !content || posting) {
      return;
    }

    setPosting(true);

    try {
      const comment = await createVibeComment(
        vibeId,
        {
          content,
        },
      );

      setComments((current) => [
        ...current,
        comment,
      ]);

      setText('');
      onCreated();
    } finally {
      setPosting(false);
    }
  }, [
    onCreated,
    posting,
    text,
    vibeId,
  ]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        onPress={onClose}
        style={styles.backdrop}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={styles.keyboard}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText variant="subheading">
              Comments
            </AppText>

            <Pressable
              accessibilityLabel="Close comments"
              accessibilityRole="button"
              onPress={onClose}
            >
              <AppText variant="heading">
                ×
              </AppText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={theme.colors.primary}
              />
            </View>
          ) : (
            <FlatList
              contentContainerStyle={
                comments.length === 0
                  ? styles.empty
                  : styles.list
              }
              data={comments}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <AppText
                  tone="secondary"
                  style={styles.emptyText}
                >
                  Be the first neighbour to join the conversation.
                </AppText>
              }
              renderItem={({ item }) => (
                <View style={styles.comment}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          theme.colors.primarySoft,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      tone="brand"
                    >
                      {item.author.displayName
                        .slice(0, 1)
                        .toUpperCase()}
                    </AppText>
                  </View>

                  <View style={styles.commentCopy}>
                    <AppText variant="bodyStrong">
                      {item.author.displayName}
                    </AppText>
                    <AppText tone="secondary">
                      {item.content}
                    </AppText>
                  </View>
                </View>
              )}
            />
          )}

          <View
            style={[
              styles.composer,
              {
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              editable={!posting}
              onChangeText={setText}
              onSubmitEditing={() => {
                void submit();
              }}
              placeholder="Add a comment…"
              placeholderTextColor={
                theme.colors.textMuted
              }
              returnKeyType="send"
              style={[
                styles.input,
                {
                  backgroundColor:
                    theme.colors.surfaceMuted,
                  color: theme.colors.text,
                },
              ]}
              value={text}
            />

            <Pressable
              accessibilityRole="button"
              disabled={
                posting || !text.trim()
              }
              onPress={() => {
                void submit();
              }}
              style={[
                styles.send,
                {
                  backgroundColor:
                    theme.colors.primary,
                  opacity:
                    posting || !text.trim()
                      ? 0.45
                      : 1,
                },
              ]}
            >
              <AppText
                variant="label"
                tone="inverse"
              >
                Send
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    height: '72%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(128,128,128,0.45)',
    borderRadius: 2,
    height: 4,
    marginTop: 9,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyText: {
    textAlign: 'center',
  },
  comment: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 10,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  commentCopy: {
    flex: 1,
    gap: 3,
  },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  input: {
    borderRadius: 22,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  send: {
    alignItems: 'center',
    borderRadius: 22,
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
});
