import React, { useEffect, useRef } from 'react'
import { Animated, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { BorderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const { isDark } = useTheme()
  const opacityAnim = useRef(new Animated.Value(0.3))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim.current, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim.current, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()

    return () => {
      animation.stop()
    }
  }, [])

  const backgroundColor = isDark ? '#334155' : '#E2E8F0'

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
          opacity: opacityAnim.current,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
})
