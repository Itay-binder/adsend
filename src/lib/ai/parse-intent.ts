import Anthropic from '@anthropic-ai/sdk'
import type { ParsedAdIntent } from '@/types'

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey && apiKey !== 'placeholder_add_your_key' ? new Anthropic({ apiKey }) : null

export async function parseAdIntent(
  message: string,
  campaigns: { id: string; name: string; adsets: { id: string; name: string }[] }[]
): Promise<ParsedAdIntent> {
  const campaignList = campaigns
    .map(c => `- קמפיין: "${c.name}" (id: ${c.id})\n  סדרות: ${c.adsets.map(a => `"${a.name}"`).join(', ')}`)
    .join('\n')

  if (!client) {
    return {
      campaign_hint: null, adset_hint: null, primary_text: null,
      headline: null, cta: null, destination_url: null, utm: null,
      status: 'PAUSED', confidence: 'low', missing: ['campaign', 'adset']
    }
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `אתה סוכן שמנתח הוראות בעברית להעלאת מודעה לפייסבוק.
חלץ מהטקסט את השדות הבאים ב-JSON בלבד:
{
  "campaign_hint": "שם קמפיין שהוזכר או null",
  "adset_hint": "שם סדרה שהוזכר או null",
  "primary_text": "טקסט ראשי של המודעה או null",
  "headline": "כותרת המודעה או null",
  "cta": "הנעה לפעולה (LEARN_MORE/SHOP_NOW/SIGN_UP/CONTACT_US/WATCH_MORE) או null",
  "destination_url": "URL אם הוזכר או null",
  "utm": "UTM parameter אם הוזכר או null",
  "status": "PAUSED או ACTIVE (ברירת מחדל PAUSED)",
  "confidence": "high אם מצאת קמפיין ברשימה, low אחרת",
  "missing": ["רשימת שדות חסרים קריטיים לשאול עליהם"]
}
החזר JSON בלבד, ללא הסברים.`,
    messages: [{
      role: 'user',
      content: `קמפיינים פעילים:\n${campaignList}\n\nהודעת המשתמש: "${message}"`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text) as ParsedAdIntent
  } catch {
    return {
      campaign_hint: null, adset_hint: null, primary_text: null,
      headline: null, cta: null, destination_url: null, utm: null,
      status: 'PAUSED', confidence: 'low', missing: ['campaign', 'adset']
    }
  }
}
