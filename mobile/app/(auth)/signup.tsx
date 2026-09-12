import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Heading, Subheading } from '../../components/ui/Typography'
import { Spacing } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

export default function SignupScreen() {
  const { colors } = useTheme()
  const { signUp, signInWithOAuth } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  async function handleSignup() {
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await signUp(email, password, fullName)
    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else if (result.message) {
      setSuccessMsg(result.message)
    } else {
      router.replace('/(tabs)')
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await signInWithOAuth(provider)
    setOauthLoading(null)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.avoidView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandContainer}>
            <Text style={[styles.brandLogo, { color: colors.primary }]}>
              JobTrack
            </Text>
            <Heading style={styles.welcomeText}>Create an Account</Heading>
            <Subheading style={styles.subText}>
              Start tracking job applications in seconds
            </Subheading>
          </View>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={[styles.successBox, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
              <Text style={[styles.successText, { color: colors.success }]}>
                {successMsg}
              </Text>
            </View>
          ) : null}

          {/* SOCIAL LOGIN BUTTONS */}
          <View style={styles.socialContainer}>
            <Button
              title="Continue with Google"
              variant="outline"
              size="md"
              onPress={() => handleOAuth('google')}
              loading={oauthLoading === 'google'}
              disabled={Boolean(oauthLoading) || loading}
            />
            <View style={{ height: Spacing.sm }} />
            <Button
              title="Continue with GitHub"
              variant="outline"
              size="md"
              onPress={() => handleOAuth('github')}
              loading={oauthLoading === 'github'}
              disabled={Boolean(oauthLoading) || loading}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              or sign up with email
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              helperText="Minimum 6 characters"
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              disabled={Boolean(oauthLoading)}
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avoidView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandLogo: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  welcomeText: {
    textAlign: 'center',
  },
  subText: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  successBox: {
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  socialContainer: {
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: Spacing.sm,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
})
