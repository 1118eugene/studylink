import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, styles } from '../theme';
import { emailError, lengthError, required } from '../utils/validation';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const validation = emailError(email) || required(password, 'Password') || (registering ? required(fullName, 'Full name') : '') || (registering ? required(university, 'University') : '') || (registering ? lengthError(password, 'Password', 8, 128) : '');
    if (validation) {
      Alert.alert('Check your details', validation);
      return;
    }
    setBusy(true);
    try {
      if (registering) await signUp(fullName, email, password, university);
      else await signIn(email, password);
    } catch (error) {
      Alert.alert('Unable to continue', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.teal, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>STUDYLINK MOBILE</Text>
        <Text style={styles.title}>{registering ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={[styles.subtitle, { marginTop: 8, marginBottom: 28 }]}>Coordinate study groups, sessions, courses, and resources from anywhere.</Text>
        {registering && <><Text style={styles.label}>Full name</Text><TextInput style={styles.input} value={fullName} onChangeText={setFullName} autoCapitalize="words" /></>}
        {registering && <><Text style={styles.label}>University</Text><TextInput style={styles.input} value={university} onChangeText={setUniversity} /></>}
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete={registering ? 'new-password' : 'password'} />
        <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Please wait...' : registering ? 'Create account' : 'Sign in'}</Text>
        </Pressable>
        <Pressable onPress={() => setRegistering((value) => !value)} style={{ alignItems: 'center', padding: 18 }}>
          <Text style={{ color: colors.navy, fontWeight: '700' }}>{registering ? 'Already have an account? Sign in' : 'Need an account? Register'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
