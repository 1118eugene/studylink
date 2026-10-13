import { StyleSheet } from 'react-native';
import { designTokens } from '@studylink/shared';

export const colors = {
  navy: designTokens.color.brand,
  blue: '#2167A8',
  teal: '#1B8A8F',
  ink: designTokens.color.textPrimary,
  muted: designTokens.color.textMuted,
  surface: designTokens.color.surface,
  background: designTokens.color.surfaceSunken,
  border: designTokens.color.borderSubtle,
  danger: designTokens.color.danger,
  success: designTokens.color.success,
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: designTokens.spacing.lg, paddingBottom: designTokens.spacing.xxxl, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: designTokens.radius.md, borderWidth: 1, borderColor: colors.border, padding: designTokens.spacing.lg, marginBottom: designTokens.spacing.md },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 16, marginBottom: 14 },
  button: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 13, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#E7F0F8', borderRadius: 12, paddingVertical: 12, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  secondaryButtonText: { color: colors.navy, fontSize: 15, fontWeight: '800' },
});
