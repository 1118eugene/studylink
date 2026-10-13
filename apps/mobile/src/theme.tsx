import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { designTokens } from '@studylink/shared';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

function createColors(theme: Theme) {
  const dark = theme === 'dark';
  return {
    navy: dark ? designTokens.color.darkBrand : designTokens.color.brand,
    blue: dark ? designTokens.color.darkBrand : '#2167A8',
    teal: dark ? '#65D5CE' : '#1B8A8F',
    ink: dark ? designTokens.color.darkTextPrimary : designTokens.color.textPrimary,
    secondary: dark ? designTokens.color.darkTextSecondary : designTokens.color.textSecondary,
    muted: dark ? designTokens.color.darkTextMuted : designTokens.color.textMuted,
    surface: dark ? designTokens.color.darkSurface : designTokens.color.surface,
    background: dark ? designTokens.color.darkSurfaceSunken : designTokens.color.surfaceSunken,
    border: dark ? designTokens.color.darkBorderSubtle : designTokens.color.borderSubtle,
    borderControl: dark ? designTokens.color.darkBorderStrong : designTokens.color.controlBorder,
    brandSoft: dark ? designTokens.color.darkBrandSoft : designTokens.color.brandSoft,
    buttonText: dark ? designTokens.color.darkSurfaceSunken : '#FFFFFF',
    danger: dark ? '#FF9B90' : designTokens.color.danger,
    success: dark ? '#81D4A2' : designTokens.color.success,
  };
}

function createStyles(colors: ReturnType<typeof createColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: designTokens.spacing.lg, paddingBottom: designTokens.spacing.xxxl, width: '100%', maxWidth: 760, alignSelf: 'center' },
    title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
    subtitle: { color: colors.secondary, fontSize: designTokens.typography.body, lineHeight: 24 },
    card: { backgroundColor: colors.surface, borderRadius: designTokens.radius.md, borderWidth: 1, borderColor: colors.border, padding: designTokens.spacing.lg, marginBottom: designTokens.spacing.md },
    cardTitle: { color: colors.ink, fontSize: designTokens.typography.cardTitle, fontWeight: '600', marginBottom: 6 },
    label: { color: colors.secondary, fontSize: designTokens.typography.overline, fontWeight: '600', letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
    input: { backgroundColor: colors.surface, borderColor: colors.borderControl, borderWidth: 1, borderRadius: designTokens.radius.sm, paddingHorizontal: designTokens.spacing.md, paddingVertical: 10, color: colors.ink, fontSize: 16, marginBottom: designTokens.spacing.md, minHeight: 44 },
    button: { backgroundColor: colors.navy, borderRadius: designTokens.radius.sm, paddingVertical: 10, paddingHorizontal: designTokens.spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
    buttonText: { color: colors.buttonText, fontSize: 16, fontWeight: '700' },
    secondaryButton: { backgroundColor: colors.brandSoft, borderColor: colors.borderControl, borderWidth: 1, borderRadius: designTokens.radius.sm, paddingVertical: 10, paddingHorizontal: designTokens.spacing.md, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
    secondaryButtonText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  });
}

type MobileThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  colors: ReturnType<typeof createColors>;
  styles: ReturnType<typeof createStyles>;
  toggleTheme: () => void;
};

const MobileThemeContext = createContext<MobileThemeContextValue | null>(null);
const storageKey = 'studylink-theme';

async function readStoredMode(): Promise<ThemeMode> {
  if (Platform.OS === 'web') {
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  }
  const stored = await SecureStore.getItemAsync(storageKey);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

async function storeMode(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    if (mode === 'system') window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, mode);
    return;
  }
  if (mode === 'system') await SecureStore.deleteItemAsync(storageKey);
  else await SecureStore.setItemAsync(storageKey, mode);
}

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const theme: Theme = mode === 'system' ? systemTheme ?? 'light' : mode;

  useEffect(() => {
    let active = true;
    readStoredMode()
      .then((storedMode) => {
        if (active) setMode(storedMode);
      })
      .catch((error: unknown) => {
        console.warn('StudyLink could not read the saved mobile theme preference.', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    storeMode(nextMode).catch((error: unknown) => {
      console.warn('StudyLink could not save the mobile theme preference.', error);
    });
  }, [theme]);

  const value = useMemo(() => {
    const colors = createColors(theme);
    return { theme, mode, colors, styles: createStyles(colors), toggleTheme };
  }, [theme, mode, toggleTheme]);

  return <MobileThemeContext.Provider value={value}>{children}</MobileThemeContext.Provider>;
}

export function useMobileTheme() {
  const value = useContext(MobileThemeContext);
  if (!value) throw new Error('useMobileTheme must be used within MobileThemeProvider.');
  return value;
}

export const colors = createColors('light');
export const styles = createStyles(colors);
