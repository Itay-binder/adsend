'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

const PIXEL_ID = '1004023898651075'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])
  return null
}

export function MetaPixel() {
  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}

// Best-effort log to our own events table — never blocks the pixel call.
function logToDb(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, params: params ?? {} }),
    keepalive: true, // survives page navigation
  }).catch(() => { /* fire and forget */ })
}

// Helper to fire standard Meta events (PageView, Subscribe, InitiateCheckout, …)
// Also logs to the events table for our own analytics.
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', name, params ?? {})
  }
  logToDb(name, params)
}

// Helper to fire custom events (login, welcome, dashboard, whatsapp_connection, …)
// Also logs to the events table for our own analytics.
export function trackCustom(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', name, params ?? {})
  }
  logToDb(name, params)
}
