import React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { BorderRadius, Spacing } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

interface CardProps extends ViewProps {
  elevated?: boolean
}

export function Card({ style, elevated = false, children, ...props }: CardProps) {
  const { colors, shadows } = useTheme()

  const cardBg = elevated ? colors.surfaceElevated : colors.surface
  const cardShadow = elevated ? shadows.md : shadows.sm

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: colors.border,
        },
        cardShadow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
})
