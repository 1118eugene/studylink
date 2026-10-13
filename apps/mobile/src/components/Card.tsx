import { useEffect, useState, type ReactNode } from 'react';
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

function Header({ overline, title, subtitle, trailing }: { overline?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  return <View style={styles.header}>
    {overline ? <Text style={[styles.label, dark && styles.darkMeta]}>{overline}</Text> : null}
    <View style={styles.headerRow}><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, dark && styles.darkText]}>{title}</Text>{subtitle ? <Text style={[styles.meta, dark && styles.darkMeta]}>{subtitle}</Text> : null}</View>{trailing}</View>
  </View>;
}

function Title({ children }: { children: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  return <Text accessibilityRole="header" style={[styles.title, dark && styles.darkText]}>{children}</Text>;
}

function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  return <View style={styles.section}><Text style={[styles.label, dark && styles.darkMeta]}>{label}</Text><View style={styles.sectionContent}>{children}</View></View>;
}

function Meta({ children }: { children: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  return <Text style={[styles.meta, dark && styles.darkMeta]}>{children}</Text>;
}

function Chips({ children, label = 'Details' }: { children: ReactNode; label?: string }) {
  return <View accessibilityLabel={label} style={styles.chips}>{children}</View>;
}

function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }) {
  const dark = useColorScheme() === 'dark';
  return <View style={[styles.badge, styles[`badge_${tone}`], dark && styles[`badge_${tone}_dark`]]}><Text style={[styles.badgeText, styles[`badgeText_${tone}`], dark && styles.darkBadgeText]}>{children}</Text></View>;
}

function Media({ src, alt = '', placeholder }: { src?: string | ImageSourcePropType | null; alt?: string; placeholder?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const dark = useColorScheme() === 'dark';
  if (!src || failed) return <View accessibilityLabel={alt || 'Image unavailable'} style={[styles.mediaFallback, dark && styles.darkFilled]}><Text style={[styles.mediaFallbackText, dark && styles.darkBrandText]}>{placeholder || '✦'}</Text></View>;
  const source = typeof src === 'string' ? { uri: src } : src;
  return <Image source={source} accessibilityLabel={alt} style={styles.media} resizeMode="cover" onError={() => setFailed(true)} />;
}

function Skeleton({ media = false, lines = 3 }: { media?: boolean; lines?: number }) {
  const dark = useColorScheme() === 'dark';
  return <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={[styles.skeletonCard, dark && styles.darkSurface]}>{media ? <View style={[styles.skeleton, styles.skeletonMedia, dark && styles.darkSkeleton]} /> : null}<View style={[styles.skeleton, styles.skeletonTitle, dark && styles.darkSkeleton]} />{Array.from({ length: Math.max(1, lines) }, (_, index) => <View key={index} style={[styles.skeleton, styles.skeletonLine, index === lines - 1 && styles.skeletonShort, dark && styles.darkSkeleton]} />)}</View>;
}

function Empty({ icon = '◇', message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  return <View style={[styles.card, styles.state, dark && styles.darkSurface]}><Text style={[styles.stateIcon, dark && styles.darkBrandText]} accessibilityElementsHidden>{icon}</Text><Text style={[styles.meta, dark && styles.darkMeta]}>{message}</Text>{action}</View>;
}

function Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const dark = useColorScheme() === 'dark';
  return <View accessibilityRole="alert" style={[styles.card, styles.state, styles.error, dark && styles.darkError]}><Text style={[styles.sectionText, dark && styles.darkText]}>{message}</Text>{onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={[styles.retryText, dark && styles.darkBrandText]}>Retry</Text></Pressable> : null}</View>;
}

function Expandable({ children, lines = 3, label = 'Show more' }: { children: string; lines?: number; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const dark = useColorScheme() === 'dark';
  return <View><Text numberOfLines={expanded ? undefined : lines} style={[styles.sectionText, dark && styles.darkText]}>{children}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.expandButton}><Text style={[styles.retryText, dark && styles.darkBrandText]}>{expanded ? 'Show less' : label}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: designTokens.radius.md, padding: designTokens.spacing.lg, marginBottom: designTokens.spacing.md },
  feature: { borderRadius: designTokens.radius.lg, borderLeftWidth: 4 },
  selected: { borderWidth: 2 },
  disabled: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  header: { gap: designTokens.spacing.xs, marginBottom: designTokens.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: designTokens.spacing.md },
  headerCopy: { flex: 1, gap: designTokens.spacing.xs },
  title: { color: '#17202A', fontSize: designTokens.typography.cardTitle, lineHeight: 24, fontWeight: '700' },
  darkText: { color: '#F9FAFB' },
  darkMeta: { color: '#D1D5DB' },
  darkBrandText: { color: '#91B9E8' },
  darkSurface: { backgroundColor: '#1F2937', borderColor: '#8A93A0' },
  darkFilled: { backgroundColor: '#243B55' },
  darkSkeleton: { backgroundColor: '#46515E' },
  darkError: { backgroundColor: '#4D2424', borderColor: '#FF9B90' },
  body: { gap: designTokens.spacing.md },
  section: { gap: designTokens.spacing.xs },
  sectionContent: { gap: designTokens.spacing.xs },
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
  badge_neutral_dark: { backgroundColor: '#273343', borderColor: '#B0B8C3' },
  badge_brand_dark: { backgroundColor: '#243B55', borderColor: '#91B9E8' },
  badge_success_dark: { backgroundColor: '#173B2A', borderColor: '#81D4A2' },
  badge_warning_dark: { backgroundColor: '#4B3713', borderColor: '#FFD27C' },
  badge_danger_dark: { backgroundColor: '#4D2424', borderColor: '#FF9B90' },
  badgeText: { fontSize: designTokens.typography.meta, fontWeight: '600' },
  badgeText_neutral: { color: '#46515E' },
  badgeText_brand: { color: '#123C69' },
  badgeText_success: { color: '#17643A' },
  badgeText_warning: { color: '#7A4B00' },
  badgeText_danger: { color: '#B42318' },
  darkBadgeText: { color: '#F9FAFB' },
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
