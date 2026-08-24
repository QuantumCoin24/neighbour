import { createVibe, type Vibe } from '@neighbour/api-client';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../components';
import { MediaPicker, type PendingMedia, useMediaUpload } from '../../media';

interface CreateVibeSheetProps {
  visible: boolean;
  onClose: () => void;
  onPublished: (vibe: Vibe) => void;
}

const MAX_CAPTION = 2200;

export function CreateVibeSheet({ visible, onClose, onPublished }: CreateVibeSheetProps) {
  const mediaUpload = useMediaUpload();

  const [media, setMedia] = useState<PendingMedia[]>([]);

  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const busy = publishing || mediaUpload.uploading;

  const reset = useCallback(() => {
    setMedia([]);
    setCaption('');
    setError(null);
    setPublishing(false);
    mediaUpload.reset();
  }, [mediaUpload]);

  const close = useCallback(() => {
    if (busy) {
      return;
    }

    reset();
    onClose();
  }, [busy, onClose, reset]);

  const publish = useCallback(async () => {
    if (busy) {
      return;
    }

    if (media.length === 0) {
      setError('Choose at least one photo for your Vibe.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const uploaded = await mediaUpload.upload(media);

      const vibe = await createVibe({
        caption: caption.trim() || undefined,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        mediaIds: uploaded.map((item) => item.asset.id),
      });

      onPublished(vibe);
      reset();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your Vibe could not be published.');
    } finally {
      setPublishing(false);
    }
  }, [busy, caption, media, mediaUpload, onClose, onPublished, reset]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable disabled={busy} onPress={close} style={styles.headerButton}>
            <AppText tone="inverse">Cancel</AppText>
          </Pressable>

          <View style={styles.headerTitle}>
            <AppText style={styles.vibes} tone="inverse">
              VIBES
            </AppText>

            <AppText style={styles.headerSubtitle} tone="inverse">
              Show your neighbourhood.
            </AppText>
          </View>

          <Pressable
            disabled={busy || media.length === 0}
            onPress={() => {
              void publish();
            }}
            style={[
              styles.publishButton,
              busy || media.length === 0 ? styles.publishDisabled : null,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#062B1F" size="small" />
            ) : (
              <AppText style={styles.publishText}>Post</AppText>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <AppText style={styles.sectionLabel} tone="inverse">
              THE MOMENT
            </AppText>

            <AppText style={styles.sectionCopy} tone="inverse">
              What is happening around you?
            </AppText>
          </View>

          <MediaPicker disabled={busy} items={media} maximum={9} onChange={setMedia} />

          <View style={styles.captionBox}>
            <TextInput
              editable={!busy}
              maxLength={MAX_CAPTION}
              multiline
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.38)"
              style={styles.captionInput}
              value={caption}
            />

            <AppText style={styles.counter} tone="inverse">
              {caption.length}/{MAX_CAPTION}
            </AppText>
          </View>

          <View style={styles.visibilitySection}>
            <AppText style={styles.sectionLabel} tone="inverse">
              WHO CAN SEE IT?
            </AppText>

            <View style={styles.audienceCard}>
              <AppText style={styles.audienceTitle} tone="inverse">
                Everyone nearby
              </AppText>

              <AppText style={styles.audienceCopy} tone="inverse">
                This Vibe will be visible in the local Vibes feed.
              </AppText>
            </View>
          </View>

          {busy ? (
            <View style={styles.progressBox}>
              <View style={styles.progressTop}>
                <AppText tone="inverse">
                  {mediaUpload.uploading ? 'Preparing your Vibe…' : 'Publishing…'}
                </AppText>

                <AppText tone="inverse">{Math.round(mediaUpload.overallProgress * 100)}%</AppText>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(0.03, mediaUpload.overallProgress) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          <View style={styles.promise}>
            <AppText style={styles.promiseTitle} tone="inverse">
              LOCAL. REAL. NOW.
            </AppText>

            <AppText style={styles.promiseCopy} tone="inverse">
              Vibes are the moments that make your neighbourhood feel alive.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#080A0D',
    flex: 1,
  },

  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 82,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  headerButton: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 62,
  },

  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },

  vibes: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.2,
  },

  headerSubtitle: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.62,
  },

  publishButton: {
    alignItems: 'center',
    backgroundColor: '#DDF7EA',
    borderRadius: 22,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 66,
    paddingHorizontal: 15,
  },

  publishDisabled: {
    opacity: 0.35,
  },

  publishText: {
    color: '#063E2C',
    fontWeight: '900',
  },

  content: {
    gap: 24,
    padding: 20,
    paddingBottom: 60,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    opacity: 0.65,
  },

  sectionCopy: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: 5,
  },

  captionBox: {
    backgroundColor: '#111519',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 150,
    overflow: 'hidden',
    padding: 16,
  },

  captionInput: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    opacity: 0.42,
  },

  visibilitySection: {
    gap: 12,
  },

  audienceCard: {
    backgroundColor: '#111519',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 5,
    padding: 16,
  },

  audienceTitle: {
    fontSize: 15,
    fontWeight: '900',
  },

  audienceCopy: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.54,
  },

  progressBox: {
    backgroundColor: '#101A16',
    borderRadius: 18,
    gap: 12,
    padding: 16,
  },

  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
  },

  progressFill: {
    backgroundColor: '#42D39B',
    borderRadius: 4,
    height: '100%',
  },

  errorBox: {
    backgroundColor: 'rgba(210,62,62,0.14)',
    borderColor: 'rgba(255,100,100,0.32)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },

  errorText: {
    color: '#FF9B9B',
  },

  promise: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
    marginTop: 8,
    paddingTop: 22,
  },

  promiseTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  promiseCopy: {
    lineHeight: 21,
    opacity: 0.58,
  },
});
