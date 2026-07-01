'use client'

import { useEffect, useState } from 'react'

export type Locale = 'en' | 'he'

// Read the ?lang=he URL param client-side (post-mount) to avoid
// useSearchParams()'s Suspense requirement during SSR. Server render
// always emits the English default; if the URL says otherwise we flip
// on hydration.
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = new URLSearchParams(window.location.search).get('lang')
    if (raw === 'he') setLocale('he')
  }, [])
  return locale
}

// Sync <html lang/dir> to the active locale so global styles (font, alignment)
// stay in step with the content the page decided to render.
export function useApplyHtmlDir(locale: Locale) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    html.setAttribute('lang', locale)
    html.setAttribute('dir', locale === 'he' ? 'rtl' : 'ltr')
  }, [locale])
}

export function dirFor(locale: Locale) {
  return locale === 'he' ? 'rtl' : 'ltr'
}
