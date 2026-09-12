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

export default function LoginScreen() {
  const { colors } = useTheme()
  const { signIn, signInWithOAuth } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const result = await signIn(email, password)
    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      router.replace('/(tabs)')
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider)
    setErrorMsg(null)

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
            <Heading style={styles.welcomeText}>Welcome back</Heading>
            <Subheading style={styles.subText}>
              Sign in to manage your applications & pipeline
            </Subheading>
          </View>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errorMsg}
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
              or sign in with email
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.form}>
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
            />

            <View style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={[styles.forgotLink, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={Boolean(oauthLoading)}
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.signupLink, { color: colors.primary }]}>
                  Sign Up
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
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
  },
})
