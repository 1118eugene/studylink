import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../services/api';
import { useMobileTheme } from '../theme';
import { reportReasons, type ReportReason } from '@studylink/shared';

export function ReportContentButton({
  contentType,
  contentId,
}: {
  contentType: 'group' | 'resource';
  contentId: number;
}) {
  const { colors, styles } = useMobileTheme();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<ReportReason>(reportReasons[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setSending(true);
    setError('');
    try {
      await api.reportContent({ contentType, contentId, reason, details });
      setSent(true);
      setVisible(false);
      setDetails('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not send your report.');
    } finally {
      setSending(false);
    }
  }

  return <>
    <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setVisible(true)}>
      <Text style={styles.secondaryButtonText}>{sent ? 'Reported for review' : `Report ${contentType}`}</Text>
    </Pressable>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <View style={{ maxHeight: '85%', backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.cardTitle}>Report {contentType}</Text>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>Choose a reason for moderator review.</Text>
            {reportReasons.map((item) => (
              <Pressable
                key={item}
                onPress={() => setReason(item)}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === item }}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <Text style={{ color: colors.ink, fontWeight: reason === item ? '800' : '500' }}>
                  {reason === item ? '● ' : '○ '}{item}
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.label, { marginTop: 14 }]}>Additional details (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              value={details}
              onChangeText={setDetails}
              maxLength={1000}
              multiline
              placeholder="Share only what is needed to review this item."
              placeholderTextColor={colors.muted}
            />
            {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
            <Pressable style={[styles.button, { marginTop: 16, opacity: sending ? 0.6 : 1 }]} onPress={submit} disabled={sending}>
              <Text style={styles.buttonText}>{sending ? 'Sending…' : 'Send report'}</Text>
            </Pressable>
            <Pressable style={{ alignItems: 'center', padding: 14 }} onPress={() => { setVisible(false); setError(''); }}>
              <Text style={{ color: colors.blue, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
