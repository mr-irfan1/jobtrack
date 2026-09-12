import React from 'react'
import { StyleSheet, Text, type TextProps } from 'react-native'
import { TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

export function Heading({ style, children, ...props }: TextProps) {
  const { colors } = useTheme()
  return (
    <Text
      style={[
        styles.heading,
        { color: colors.foreground },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

export function Subheading({ style, children, ...props }: TextProps) {
  const { colors } = useTheme()
  return (
    <Text
      style={[
        styles.subheading,
        { color: colors.mutedForeground },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

export function BodyText({ style, children, ...props }: TextProps) {
  const { colors } = useTheme()
  return (
    <Text
      style={[
        styles.bodyText,
        { color: colors.foreground },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

export function CaptionText({ style, children, ...props }: TextProps) {
  const { colors } = useTheme()
  return (
    <Text
      style={[
        styles.captionText,
        { color: colors.mutedForeground },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: TypographyTokens.sizes['2xl'],
    fontWeight: TypographyTokens.weights.bold,
  },
  subheading: {
    fontSize: TypographyTokens.sizes.base,
    fontWeight: TypographyTokens.weights.medium,
  },
  bodyText: {
    fontSize: TypographyTokens.sizes.base,
    fontWeight: TypographyTokens.weights.regular,
  },
  captionText: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.regular,
  },
})
