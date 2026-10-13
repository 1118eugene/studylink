import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useColorScheme, type ImageSourcePropType, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { designTokens } from '@studylink/shared';

type CardProps = {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled' | 'feature';
  selected?: boolean;
  disabled?: boolean;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function Card({ children, variant = 'elevated', selected = false, disabled = false, onPress, accessibilityLabel, style }: CardProps) {
  const dark = useColorScheme() === 'dark';
  const surface = dark ? '#1F2937' : designTokens.color.surfaceRaised;
  const border = dark ? '#8A93A0' : designTokens.color.borderSubtle;
  const shadow = dark ? undefined : variant === 'elevated' || variant === 'feature' ? {
    shadowColor: '#101828',
    shadowOpacity: variant === 'feature' ? 0.1 : 0.06,
    shadowRadius: variant === 'feature' ? 8 : 3,
    shadowOffset: { width: 0, height: variant === 'feature' ? 4 : 1 },
    elevation: variant === 'feature' ? 3 : 1,
  } : undefined;
  const cardStyle = [
    styles.card,
    { backgroundColor: variant === 'filled' ? (dark ? '#0B1220' : designTokens.color.surfaceSunken) : surface, borderColor: selected ? (dark ? '#91B9E8' : designTokens.color.brand) : border },
    variant === 'feature' && styles.feature,
    selected && styles.selected,
    disabled && styles.disabled,
    shadow,
    style,
  ];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && !disabled && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

function Header({ children }: { children: ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

function Title({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.label}>{label}</Text><Text style={styles.sectionText}>{children}</Text></View>;
}

function Meta({ children }: { children: ReactNode }) {
  return <Text style={styles.meta}>{children}</Text>;
}

function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }) {
  return <View style={[styles.badge, styles[`badge_${tone}`]]}><Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{children}</Text></View>;
}

function Media({ source, label }: { source?: ImageSourcePropType; label?: string }) {
  if (!source) return <View accessibilityLabel={label || 'Image unavailable'} style={styles.mediaFallback}><Text style={styles.mediaFallbackText}>✦</Text></View>;
  return <Image source={source} accessibilityLabel={label || ''} style={styles.media} resizeMode="cover" />;
}

function Skeleton({ media = false, lines = 3 }: { media?: boolean; lines?: number }) {
  return <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={styles.skeletonCard}>{media ? <View style={[styles.skeleton, styles.skeletonMedia]} /> : null}<View style={[styles.skeleton, styles.skeletonTitle]} />{Array.from({ length: Math.max(1, lines) }, (_, index) => <View key={index} style={[styles.skeleton, styles.skeletonLine, index === lines - 1 && styles.skeletonShort]} />)}</View>;
}

function Empty({ message, action }: { message: string; action?: ReactNode }) {
  return <View style={[styles.card, styles.state]}><Text style={styles.stateIcon} accessibilityElementsHidden>◇</Text><Text style={styles.meta}>{message}</Text>{action}</View>;
}

function Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View accessibilityRole="alert" style={[styles.card, styles.state, styles.error]}><Text style={styles.sectionText}>{message}</Text>{onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable> : null}</View>;
}

function Expandable({ children, lines = 3, label = 'Show more' }: { children: string; lines?: number; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  return <View><Text numberOfLines={expanded ? undefined : lines} style={styles.sectionText}>{children}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.expandButton}><Text style={styles.retryText}>{expanded ? 'Show less' : label}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: designTokens.radius.md, padding: designTokens.spacing.lg, marginBottom: designTokens.spacing.md },
  feature: { borderRadius: designTokens.radius.lg, borderLeftWidth: 4 },
  selected: { borderWidth: 2 },
  disabled: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  header: { gap: designTokens.spacing.xs, marginBottom: designTokens.spacing.md },
  title: { color: '#17202A', fontSize: designTokens.typography.cardTitle, lineHeight: 24, fontWeight: '700' },
  body: { gap: designTokens.spacing.md },
  section: { gap: designTokens.spacing.xs },
  label: { color: '#46515E', fontSize: designTokens.typography.overline, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  sectionText: { color: '#17202A', fontSize: designTokens.typography.body, lineHeight: 21, fontWeight: '400' },
  meta: { color: '#46515E', fontSize: designTokens.typography.meta, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: designTokens.spacing.sm, marginTop: designTokens.spacing.md },
  badge: { borderWidth: 1, borderRadius: designTokens.radius.full, paddingHorizontal: designTokens.spacing.sm, paddingVertical: designTokens.spacing.xxs, alignSelf: 'flex-start' },
  badge_neutral: { backgroundColor: '#FFFFFF', borderColor: '#767676' },
  badge_brand: { backgroundColor: '#E7F0F8', borderColor: '#123C69' },
  badge_success: { backgroundColor: '#E7F4EC', borderColor: '#17643A' },
  badge_warning: { backgroundColor: '#FFF3D6', borderColor: '#7A4B00' },
  badge_danger: { backgroundColor: '#FDECEA', borderColor: '#B42318' },
  badgeText: { fontSize: designTokens.typography.meta, fontWeight: '600' },
  badgeText_neutral: { color: '#46515E' },
  badgeText_brand: { color: '#123C69' },
  badgeText_success: { color: '#17643A' },
  badgeText_warning: { color: '#7A4B00' },
  badgeText_danger: { color: '#B42318' },
  media: { width: '100%', height: 124, borderRadius: designTokens.radius.sm, marginBottom: designTokens.spacing.md },
  mediaFallback: { width: '100%', height: 124, borderRadius: designTokens.radius.sm, marginBottom: designTokens.spacing.md, backgroundColor: '#E7F0F8', alignItems: 'center', justifyContent: 'center' },
  mediaFallbackText: { color: '#123C69', fontSize: 24 },
  skeletonCard: { gap: designTokens.spacing.md, borderRadius: designTokens.radius.md, padding: designTokens.spacing.lg, backgroundColor: '#FFFFFF', borderColor: '#767676', borderWidth: 1, marginBottom: designTokens.spacing.md },
  skeleton: { backgroundColor: '#D8DEE7', borderRadius: designTokens.radius.xs },
  skeletonMedia: { height: 124 },
  skeletonTitle: { width: '58%', height: 20 },
  skeletonLine: { width: '100%', height: 12 },
  skeletonShort: { width: '72%' },
  state: { alignItems: 'center', justifyContent: 'center', gap: designTokens.spacing.sm, minHeight: 128 },
  stateIcon: { color: '#123C69', fontSize: 24 },
  error: { borderColor: '#B42318', backgroundColor: '#FDECEA' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: designTokens.spacing.md },
  retryText: { color: '#123C69', fontSize: 14, fontWeight: '700' },
  expandButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});

export const CardPrimitive = Object.assign(Card, { Header, Title, Body, Section, Meta, Chips, Footer, Badge, Media, Skeleton, Empty, Error, Expandable });
export { CardPrimitive as Card };
