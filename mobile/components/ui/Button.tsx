import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { BorderRadius, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme()

  let bg = colors.primary
  let fg = colors.primaryForeground
  let border = 'transparent'

  if (variant === 'secondary') {
    bg = colors.muted
    fg = colors.foreground
  } else if (variant === 'outline') {
    bg = 'transparent'
    fg = colors.foreground
    border = colors.border
  } else if (variant === 'danger') {
    bg = colors.danger
    fg = '#ffffff'
  }

  const isSmall = size === 'sm'
  const isLarge = size === 'lg'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' ? 1 : 0,
          minHeight: isSmall ? 36 : isLarge ? 48 : 44,
          paddingVertical: isSmall ? 6 : isLarge ? 14 : 10,
          paddingHorizontal: isSmall ? 12 : isLarge ? 20 : 16,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: fg,
              fontSize: isSmall
                ? TypographyTokens.sizes.sm
                : isLarge
                  ? TypographyTokens.sizes.lg
                  : TypographyTokens.sizes.base,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: TypographyTokens.weights.semibold,
  },
})
