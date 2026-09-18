"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useAdminListParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString())
      mutate(next)
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams]
  )

  const setParam = useCallback(
    (key: string, value: string) => {
      replaceParams((params) => {
        const normalized = value.trim()
        if (!normalized || normalized === "all") params.delete(key)
        else params.set(key, normalized)
        if (key !== "page") params.delete("page")
      })
    },
    [replaceParams]
  )

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      replaceParams((params) => {
        for (const [key, value] of Object.entries(updates)) {
          const normalized = value.trim()
          if (!normalized || normalized === "all") params.delete(key)
          else params.set(key, normalized)
        }
        params.delete("page")
      })
    },
    [replaceParams]
  )

  const clearParams = useCallback(
    (keys: string[]) => {
      replaceParams((params) => {
        for (const key of keys) params.delete(key)
        params.delete("page")
      })
    },
    [replaceParams]
  )

  return { setParam, setParams, clearParams }
}

export function useAdminSearchQuery(initial: string) {
  const { setParam } = useAdminListParams()
  const [value, setValue] = useState(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setValue(initial)
  }, [initial])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const onChange = (next: string) => {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setParam("q", next)
    }, 300)
  }

  return {
    value,
    onChange,
    onFocus: () => {
      focused.current = true
    },
    onBlur: () => {
      focused.current = false
    },
  }
}
