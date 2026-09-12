import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

export interface NetworkStatus {
  isConnected: boolean | null
  isInternetReachable: boolean | null
  isOffline: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
  })

  useEffect(() => {
    function updateState(state: NetInfoState) {
      const isOffline = state.isConnected === false || state.isInternetReachable === false
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOffline,
      })
    }

    // Initial check
    NetInfo.fetch().then(updateState)

    // Event listener
    const unsubscribe = NetInfo.addEventListener(updateState)

    return () => {
      unsubscribe()
    }
  }, [])

  return status
}
