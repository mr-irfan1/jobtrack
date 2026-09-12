import type { Provider, Session, User } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    pass: string,
    fullName: string,
  ) => Promise<{ error: string | null; message?: string }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signInWithOAuth: (provider: Provider) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function getFriendlyAuthErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.'
  const message =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: string }).message)
      : String(err)

  const lower = message.toLowerCase()

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please check your details and try again.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your inbox and verify your email address before signing in.'
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already exists')
  ) {
    return 'An account with this email address already exists. Please sign in instead.'
  }
  if (lower.includes('password should be at least')) {
    return 'Password is too weak. Please use at least 6 characters.'
  }
  if (lower.includes('network') || lower.includes('fetch failed')) {
    return 'Network connection error. Please check your internet connection and try again.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }

  return message
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
      setIsLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      })
      if (error) return { error: getFriendlyAuthErrorMessage(error) }
      return { error: null }
    } catch (err) {
      return { error: getFriendlyAuthErrorMessage(err) }
    }
  }

  const signUp = async (email: string, pass: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: { full_name: fullName.trim() },
        },
      })
      if (error) return { error: getFriendlyAuthErrorMessage(error) }
      if (data.user && !data.session) {
        return {
          error: null,
          message:
            'Registration successful! Please check your email inbox to confirm your account.',
        }
      }
      return { error: null }
    } catch (err) {
      return { error: getFriendlyAuthErrorMessage(err) }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
      )
      if (error) return { error: getFriendlyAuthErrorMessage(error) }
      return { error: null }
    } catch (err) {
      return { error: getFriendlyAuthErrorMessage(err) }
    }
  }

  const signInWithOAuth = async (provider: Provider) => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error) return { error: getFriendlyAuthErrorMessage(error) }

      if (data?.url) {
        const authResult = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        )

        if (authResult.type === 'success' && authResult.url) {
          const urlStr = authResult.url
          let accessToken: string | null = null
          let refreshToken: string | null = null
          let code: string | null = null

          try {
            const parsedUrl = new URL(urlStr)
            accessToken = parsedUrl.searchParams.get('access_token')
            refreshToken = parsedUrl.searchParams.get('refresh_token')
            code = parsedUrl.searchParams.get('code')

            if (!accessToken && parsedUrl.hash) {
              const hashParams = new URLSearchParams(parsedUrl.hash.substring(1))
              accessToken = hashParams.get('access_token')
              refreshToken = hashParams.get('refresh_token')
            }
          } catch {
            // Fallback for custom deep link strings
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (sessionError) {
              return { error: getFriendlyAuthErrorMessage(sessionError) }
            }
            return { error: null }
          }

          if (code) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              return { error: getFriendlyAuthErrorMessage(exchangeError) }
            }
            return { error: null }
          }
        }
      }

      return { error: null }
    } catch (err) {
      return { error: getFriendlyAuthErrorMessage(err) }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        resetPassword,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
