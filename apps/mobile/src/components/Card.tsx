import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { designTokens } from '@studylink/shared';
import { useMobileTheme } from '../theme';

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
  const { theme, colors } = useMobileTheme();
  const dark = theme === 'dark';
  const surface = colors.surface;
  const border = colors.border;
  const shadow = dark ? undefined : variant === 'elevated' || variant === 'feature' ? {
    shadowColor: '#101828',
    shadowOpacity: variant === 'feature' ? 0.1 : 0.06,
    shadowRadius: variant === 'feature' ? 8 : 3,
    shadowOffset: { width: 0, height: variant === 'feature' ? 4 : 1 },
    elevation: variant === 'feature' ? 3 : 1,
  } : undefined;
  const cardStyle = [
    styles.card,
    { backgroundColor: variant === 'filled' ? colors.background : surface, borderColor: selected ? colors.navy : border },
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
  const { theme, colors } = useMobileTheme();
  const dark = theme === 'dark';
  return <View style={styles.header}>
    {overline ? <Text style={[styles.label, { color: colors.secondary }]}>{overline}</Text> : null}
    <View style={styles.headerRow}><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{title}</Text>{subtitle ? <Text style={[styles.meta, { color: colors.secondary }]}>{subtitle}</Text> : null}</View>{trailing}</View>
  </View>;
}

function Title({ children }: { children: ReactNode }) {
  const { colors } = useMobileTheme();
  return <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{children}</Text>;
}

function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useMobileTheme();
  return <View style={styles.section}><Text style={[styles.label, { color: colors.secondary }]}>{label}</Text><View style={styles.sectionContent}>{children}</View></View>;
}

function Meta({ children }: { children: ReactNode }) {
  const { colors } = useMobileTheme();
  return <Text style={[styles.meta, { color: colors.secondary }]}>{children}</Text>;
}

function Chips({ children, label = 'Details' }: { children: ReactNode; label?: string }) {
  return <View accessibilityLabel={label} style={styles.chips}>{children}</View>;
}

function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }) {
  const { theme, colors } = useMobileTheme();
  const dark = theme === 'dark';
  const tones = {
    neutral: { background: colors.surface, border: colors.borderControl, text: colors.secondary },
    brand: { background: colors.brandSoft, border: colors.navy, text: colors.navy },
    success: { background: dark ? '#173B2A' : '#E7F4EC', border: colors.success, text: colors.success },
    warning: { background: dark ? '#4B3713' : '#FFF3D6', border: dark ? '#FFD27C' : '#7A4B00', text: dark ? '#FFD27C' : '#7A4B00' },
    danger: { background: dark ? '#4D2424' : '#FDECEA', border: colors.danger, text: colors.danger },
  }[tone];
  return <View style={[styles.badge, { backgroundColor: tones.background, borderColor: tones.border }]}><Text style={[styles.badgeText, { color: tones.text }]}>{children}</Text></View>;
}

function Media({ src, alt = '', placeholder }: { src?: string | ImageSourcePropType | null; alt?: string; placeholder?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const { colors } = useMobileTheme();
  if (!src || failed) return <View accessibilityLabel={alt || 'Image unavailable'} style={[styles.mediaFallback, { backgroundColor: colors.brandSoft }]}><Text style={[styles.mediaFallbackText, { color: colors.navy }]}>{placeholder || '✦'}</Text></View>;
  const source = typeof src === 'string' ? { uri: src } : src;
  return <Image source={source} accessibilityLabel={alt} style={styles.media} resizeMode="cover" onError={() => setFailed(true)} />;
}

function Skeleton({ media = false, lines = 3 }: { media?: boolean; lines?: number }) {
  const { colors } = useMobileTheme();
  const skeletonColor = colors.border;
  return <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{media ? <View style={[styles.skeleton, styles.skeletonMedia, { backgroundColor: skeletonColor }]} /> : null}<View style={[styles.skeleton, styles.skeletonTitle, { backgroundColor: skeletonColor }]} />{Array.from({ length: Math.max(1, lines) }, (_, index) => <View key={index} style={[styles.skeleton, styles.skeletonLine, index === lines - 1 && styles.skeletonShort, { backgroundColor: skeletonColor }]} />)}</View>;
}

function Empty({ icon = '◇', message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  const { colors } = useMobileTheme();
  return <View style={[styles.card, styles.state, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.stateIcon, { color: colors.navy }]} accessibilityElementsHidden>{icon}</Text><Text style={[styles.meta, { color: colors.secondary }]}>{message}</Text>{action}</View>;
}

function Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors, theme } = useMobileTheme();
  return <View accessibilityRole="alert" style={[styles.card, styles.state, styles.error, { backgroundColor: theme === 'dark' ? '#4D2424' : '#FDECEA', borderColor: colors.danger }]}><Text style={[styles.sectionText, { color: colors.ink }]}>{message}</Text>{onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={[styles.retryText, { color: colors.navy }]}>Retry</Text></Pressable> : null}</View>;
}

function Expandable({ children, lines = 3, label = 'Show more' }: { children: string; lines?: number; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useMobileTheme();
  return <View><Text numberOfLines={expanded ? undefined : lines} style={[styles.sectionText, { color: colors.ink }]}>{children}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.expandButton}><Text style={[styles.retryText, { color: colors.navy }]}>{expanded ? 'Show less' : label}</Text></Pressable></View>;
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
  title: { color: '#0F172A', fontSize: designTokens.typography.cardTitle, lineHeight: 24, fontWeight: '600' },
  body: { gap: designTokens.spacing.md },
  section: { gap: designTokens.spacing.xs },
  sectionContent: { gap: designTokens.spacing.xs },
  label: { color: '#475569', fontSize: designTokens.typography.overline, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  sectionText: { color: '#0F172A', fontSize: designTokens.typography.body, lineHeight: 23, fontWeight: '400' },
  meta: { color: '#475569', fontSize: designTokens.typography.meta, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: designTokens.spacing.sm, marginTop: designTokens.spacing.md },
  badge: { borderWidth: 1, borderRadius: designTokens.radius.full, paddingHorizontal: designTokens.spacing.sm, paddingVertical: designTokens.spacing.xxs, alignSelf: 'flex-start' },
  badge_neutral: { backgroundColor: '#FFFFFF', borderColor: '#475569' },
  badge_brand: { backgroundColor: '#E7F0F8', borderColor: '#123C69' },
  badge_success: { backgroundColor: '#E7F4EC', borderColor: '#17643A' },
  badge_warning: { backgroundColor: '#FFF3D6', borderColor: '#7A4B00' },
  badge_danger: { backgroundColor: '#FDECEA', borderColor: '#B42318' },
  badgeText: { fontSize: designTokens.typography.meta, fontWeight: '600' },
  badgeText_neutral: { color: '#475569' },
  badgeText_brand: { color: '#123C69' },
  badgeText_success: { color: '#17643A' },
  badgeText_warning: { color: '#7A4B00' },
  badgeText_danger: { color: '#B42318' },
  media: { width: '100%', height: 124, borderRadius: designTokens.radius.sm, marginBottom: designTokens.spacing.md },
  mediaFallback: { width: '100%', height: 124, borderRadius: designTokens.radius.sm, marginBottom: designTokens.spacing.md, backgroundColor: '#E7F0F8', alignItems: 'center', justifyContent: 'center' },
  mediaFallbackText: { color: '#123C69', fontSize: 24 },
  skeletonCard: { gap: designTokens.spacing.md, borderRadius: designTokens.radius.md, padding: designTokens.spacing.lg, backgroundColor: '#FFFFFF', borderColor: '#475569', borderWidth: 1, marginBottom: designTokens.spacing.md },
  skeleton: { backgroundColor: '#D8DEE7', borderRadius: designTokens.radius.xs },
  skeletonMedia: { height: 124 },
  skeletonTitle: { width: '58%', height: 20 },
  skeletonLine: { width: '100%', height: 12 },
  skeletonShort: { width: '72%' },
  state: { alignItems: 'center', justifyContent: 'center', gap: designTokens.spacing.sm, minHeight: 128 },
  stateIcon: { color: '#123C69', fontSize: 24 },
  error: { borderColor: '#B42318', backgroundColor: '#FDECEA' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: designTokens.spacing.md },
  retryText: { color: '#123C69', fontSize: 14, fontWeight: '600' },
  expandButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});

export const CardPrimitive = Object.assign(Card, { Header, Title, Body, Section, Meta, Chips, Footer, Badge, Media, Skeleton, Empty, Error, Expandable });
export { CardPrimitive as Card };
