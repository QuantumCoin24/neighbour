import {
  createLiveSession,
  getLiveAccess,
  startLiveSession,
  type LiveAccess,
  type LiveSession,
} from '@neighbour/api-client';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../components/AppText';

interface GoLiveSheetProps {
  visible: boolean;
  onClose: () => void;
  onReady: (access: LiveAccess, session: LiveSession) => void;
}

export function GoLiveSheet({ visible, onClose, onReady }: GoLiveSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin(): Promise<void> {
    if (busy) return;

    try {
      setBusy(true);
      setError(null);

      const session = await createLiveSession({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });

      const access = await getLiveAccess(session.id);
      const started = await startLiveSession(session.id);

      onReady(access, started);
    } catch (cause) {
      console.error('Unable to start live session', cause);
      setError('Live could not be started. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} disabled={busy}>
            <AppText>Cancel</AppText>
          </Pressable>

          <AppText style={styles.heading}>Go Live</AppText>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.liveMark}>
            <View style={styles.liveDot} />
            <AppText style={styles.liveMarkText}>VIBES LIVE</AppText>
          </View>

          <AppText style={styles.title}>Broadcast to your neighbourhood</AppText>

          <AppText style={styles.copy}>
            Start a live Vibe and let neighbours join you in real time.
          </AppText>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your live a title"
            placeholderTextColor="#8E8E93"
            maxLength={120}
            editable={!busy}
            style={styles.input}
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's happening?"
            placeholderTextColor="#8E8E93"
            maxLength={1000}
            editable={!busy}
            multiline
            style={[styles.input, styles.description]}
          />

          {error ? <AppText style={styles.error}>{error}</AppText> : null}

          <Pressable
            onPress={begin}
            disabled={busy}
            style={({ pressed }) => [
              styles.goButton,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.goButtonText}>Start Live</AppText>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 16,
  },
  liveMark: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef233c',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveMarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  copy: {
    fontSize: 16,
    lineHeight: 23,
    opacity: 0.72,
  },
  input: {
    minHeight: 54,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D1D6',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#F7F7F8',
  },
  description: {
    minHeight: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  error: {
    color: '#ef233c',
  },
  goButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#ef233c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  goButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
});
