'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export type Locale = 'en' | 'he'

// URL param 'lang' wins; anything other than 'he' is treated as English.
export function useLocale(): Locale {
  const params = useSearchParams()
  const raw = params.get('lang')
  return raw === 'he' ? 'he' : 'en'
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
