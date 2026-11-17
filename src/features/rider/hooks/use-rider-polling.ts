'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RiderPortalData } from '@/lib/google-sheets/types'

export interface UseRiderPollingOptions {
  initialData?: RiderPortalData | null
  intervalMs?: number
  enabled?: boolean
}

export function useRiderPolling(options: UseRiderPollingOptions = {}) {
  const { initialData = null, intervalMs = 20000, enabled = true } = options

  const [data, setData] = useState<RiderPortalData | null>(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialData ? new Date(initialData.lastSyncedAt) : null
  )

  const isMountedRef = useRef(true)

  const refresh = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setIsRefreshing(true)
    }

    try {
      const res = await fetch('/api/rider/portal', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please log in again.')
        } else if (res.status === 404) {
          setError('Rider profile not found in operations sheet.')
        } else {
          setError(`Server error (${res.status})`)
        }
        return
      }

      const json = (await res.json()) as { success: boolean; data: RiderPortalData }
      if (isMountedRef.current && json.success && json.data) {
        setData(json.data)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (isMountedRef.current) {
        // Retain existing data, log transient network warning
        console.warn('[useRiderPolling] Background refresh failed:', err)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (!enabled) {
      return
    }

    // Initial fetch if no server-provided data
    if (!initialData) {
      refresh(false)
    }

    const timer = setInterval(() => {
      // Pause polling when browser tab is inactive to save quota
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }
      refresh(true)
    }, intervalMs)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [enabled, initialData, intervalMs, refresh])

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh: () => refresh(false),
  }
}
