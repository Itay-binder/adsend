const INSTANCE_ID = process.env.GREENAPI_INSTANCE_ID!
const API_TOKEN = process.env.GREENAPI_TOKEN!
const ADMIN_PHONE = process.env.GREENAPI_ADMIN_PHONE ?? '972526660006'

export async function sendWhatsAppAlert(message: string): Promise<void> {
  if (!INSTANCE_ID || !API_TOKEN) return

  const url = `https://api.green-api.com/waInstance${INSTANCE_ID}/sendMessage/${API_TOKEN}`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: `${ADMIN_PHONE}@c.us`,
      message,
    }),
  }).catch(() => {})
}
