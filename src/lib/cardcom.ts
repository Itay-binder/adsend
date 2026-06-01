const CARDCOM_API = 'https://secure.cardcom.solutions/api/v11'
const TERMINAL = process.env.CARDCOM_TERMINAL!
const API_NAME = process.env.CARDCOM_API_NAME!
const API_PASSWORD = process.env.CARDCOM_API_PASSWORD!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function createPaymentPage(userId: string, userEmail?: string): Promise<{ url: string; lowProfileId: string }> {
  const body = {
    TerminalNumber: TERMINAL,
    ApiName: API_NAME,
    Amount: 99,
    Operation: 'ChargeAndCreateToken',
    SuccessRedirectUrl: `${APP_URL}/subscribe/success`,
    FailedRedirectUrl: `${APP_URL}/subscribe/failed`,
    WebHookUrl: `${APP_URL}/api/webhooks/cardcom/${userId}`,
    MaxPayments: 1,
    Document: {
      DocumentTypeToCreate: 'auto',
      Language: 'he',
      ...(userEmail ? { Email: userEmail, IsSendByEmail: true } : {}),
      Products: [{ Description: 'AdSend — מנוי חודשי', Quantity: 1, UnitCost: 99 }],
    },
  }

  const res = await fetch(`${CARDCOM_API}/LowProfile/Create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.ResponseCode !== 0) throw new Error(`Cardcom error: ${data.Description}`)
  return { url: data.Url, lowProfileId: data.LowProfileId }
}

export async function getLowProfileResult(lowProfileId: string) {
  const body = {
    TerminalNumber: TERMINAL,
    ApiName: API_NAME,
    LowProfileId: lowProfileId,
  }

  const res = await fetch(`${CARDCOM_API}/LowProfile/GetLpResult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return res.json()
}

export async function chargeToken(
  token: string,
  cardExpMMYY: string,
  userId: string,
  userEmail?: string,
  userName?: string,
): Promise<{ transactionId: number }> {
  const body = {
    TerminalNumber: TERMINAL,
    ApiName: API_NAME,
    Amount: 99,
    Token: token,
    CardExpirationMMYY: cardExpMMYY,
    Advanced: { ApiPassword: API_PASSWORD },
    ...(userEmail
      ? {
          Document: {
            DocumentTypeToCreate: 'auto',
            Language: 'he',
            Name: userName,
            Email: userEmail,
            IsSendByEmail: true,
            Products: [{ Description: 'AdSend — מנוי חודשי', Quantity: 1, UnitCost: 99 }],
          },
        }
      : {}),
  }

  const res = await fetch(`${CARDCOM_API}/Transactions/Transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.ResponseCode !== 0) throw new Error(`Cardcom charge error: ${data.Description}`)
  return { transactionId: data.TranzactionId }
}
