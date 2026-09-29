import { StyleSheet } from 'react-native';

export const colors = {
  navy: '#123C69',
  blue: '#2167A8',
  teal: '#1B8A8F',
  ink: '#17202A',
  muted: '#657383',
  surface: '#FFFFFF',
  background: '#F4F7FA',
  border: '#DCE4EC',
  danger: '#B42318',
  success: '#16794C',
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 16, marginBottom: 14 },
  button: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 13, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#E7F0F8', borderRadius: 12, paddingVertical: 12, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  secondaryButtonText: { color: colors.navy, fontSize: 15, fontWeight: '800' },
});
