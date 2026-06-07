import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

const DELAY_MS = 1500 // gap between sends to avoid GreenAPI rate limits

function chatId(phone: string): string {
  // Normalize to international digits (strip non-digits, drop leading zeros)
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  return `${digits}@c.us`
}

export async function POST(request: Request) {
  await requireAdmin()
  const { message, phones } = await request.json() as { message: string; phones: string[] }

  if (!message?.trim() || !phones?.length) {
    return NextResponse.json({ error: 'הודעה או נמענים חסרים' }, { status: 400 })
  }

  const instance = process.env.GREENAPI_INSTANCE_ID
  const token = process.env.GREENAPI_TOKEN
  if (!instance || !token) {
    return NextResponse.json({ error: 'GreenAPI לא מוגדר' }, { status: 500 })
  }

  const url = `https://api.green-api.com/waInstance${instance}/sendMessage/${token}`
  const results: { phone: string; ok: boolean; error?: string }[] = []

  for (const phone of phones) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId(phone), message }),
      })
      const data = await res.json()
      if (res.ok && data.idMessage) {
        results.push({ phone, ok: true })
      } else {
        results.push({ phone, ok: false, error: data.errorMessage ?? data.error ?? `HTTP ${res.status}` })
      }
    } catch (e) {
      results.push({ phone, ok: false, error: (e as Error).message })
    }
    if (phone !== phones[phones.length - 1]) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  return NextResponse.json({ results })
}
