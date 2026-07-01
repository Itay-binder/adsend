'use client'

import { useEffect, useState } from 'react'

export type Locale = 'en' | 'he'

// Locale resolution order, post-mount:
//   1. Pathname override — /lp-en and /dashboard-en (and children) force English.
//      /lp-he forces Hebrew. This lets the URL itself decide the language, so
//      /lp-en shows English content without any query params.
//   2. ?lang= query param — 'en' or 'he'.
//   3. defaultLocale arg (Hebrew).
export function useLocale(defaultLocale: Locale = 'he'): Locale {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = window.location.pathname
    // Any path ending in -en or nested under /dashboard-en → English
    if (p === '/lp-en' || p === '/dashboard-en' || p.startsWith('/dashboard-en/')) {
      setLocale('en')
      return
    }
    if (p === '/lp-he') {
      setLocale('he')
      return
    }
    const raw = new URLSearchParams(window.location.search).get('lang')
    if (raw === 'en' || raw === 'he') setLocale(raw as Locale)
  }, [defaultLocale])
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
