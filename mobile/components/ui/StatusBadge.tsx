import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  BorderRadius,
  StatusBadgeTokens,
  TypographyTokens,
  type ApplicationStatusType,
} from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

interface StatusBadgeProps {
  status: ApplicationStatusType
  size?: 'sm' | 'md'
}

export const StatusBadge = React.memo(function StatusBadge({
  status,
  size = 'md',
}: StatusBadgeProps) {
  const { themeName } = useTheme()
  const token = StatusBadgeTokens[status] || StatusBadgeTokens.Applied
  const styleTheme = token[themeName]

  const isSmall = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleTheme.bg,
          borderColor: styleTheme.border,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: styleTheme.text,
            fontSize: isSmall
              ? TypographyTokens.sizes.xs
              : TypographyTokens.sizes.sm,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: TypographyTokens.weights.semibold,
  },
})
