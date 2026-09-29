import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors, styles } from '../theme';

export function LoadingState() {
  return <View style={{ alignItems: 'center', padding: 36 }}><ActivityIndicator size="large" color={colors.navy} /></View>;
}

export function EmptyState({ message }: { message: string }) {
  return <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}><Text style={styles.subtitle}>{message}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={[styles.card, { alignItems: 'center' }]}>
      <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 14 }}>{message}</Text>
      <Pressable style={styles.secondaryButton} onPress={onRetry}><Text style={styles.secondaryButtonText}>Try again</Text></Pressable>
    </View>
  );
}
