import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.ring
      : colors.border

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor,
            color: colors.foreground,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: TypographyTokens.sizes.sm,
    fontWeight: TypographyTokens.weights.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: TypographyTokens.sizes.base,
  },
  errorText: {
    fontSize: TypographyTokens.sizes.xs,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: TypographyTokens.sizes.xs,
    marginTop: Spacing.xs,
  },
})
