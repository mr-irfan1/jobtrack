import { Link } from 'expo-router'
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

export default function ForgotPasswordScreen() {
  const { colors } = useTheme()
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await resetPassword(email)
    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setSuccessMsg(
        'Password reset link sent! Check your email inbox for instructions to reset your password.',
      )
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
            <Heading style={styles.welcomeText}>Reset Password</Heading>
            <Subheading style={styles.subText}>
              Enter your account email to receive a password reset link
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

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backRow}>
                <Text style={[styles.backText, { color: colors.primary }]}>
                  ← Back to Sign In
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
    marginBottom: Spacing.xl,
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
  form: {
    marginBottom: Spacing.xl,
  },
  footer: {
    alignItems: 'center',
  },
  backRow: {
    paddingVertical: Spacing.sm,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
