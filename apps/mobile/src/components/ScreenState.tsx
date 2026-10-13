import { View } from 'react-native';
import { Card } from './Card';

export function LoadingState() {
  return <View accessibilityLabel="Loading content"><Card.Skeleton lines={2} /><Card.Skeleton lines={3} /></View>;
}

export function EmptyState({ message }: { message: string }) {
  return <Card.Empty message={message} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card.Error message={message} onRetry={onRetry} />;
}
