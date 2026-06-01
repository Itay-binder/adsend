const CARDCOM_API = 'https://secure.cardcom.solutions/api/v11'

function getConfig() {
  return {
    terminal: parseInt(process.env.CARDCOM_TERMINAL!),
    apiName: process.env.CARDCOM_API_NAME!,
    apiPassword: process.env.CARDCOM_API_PASSWORD!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://adsend.vercel.app',
  }
}

export async function createPaymentPage(userId: string, userEmail?: string): Promise<{ url: string; lowProfileId: string }> {
  const { terminal, apiName, appUrl } = getConfig()

  const body: Record<string, unknown> = {
    TerminalNumber: terminal,
    ApiName: apiName,
    Amount: 99,
    SuccessRedirectUrl: `${appUrl}/subscribe/success`,
    FailedRedirectUrl: `${appUrl}/subscribe/failed`,
    WebHookUrl: `${appUrl}/api/webhooks/cardcom/${userId}`,
    IsCreateToken: true,
  }

  if (userEmail) {
    body.Document = {
      DocumentTypeToCreate: 'auto',
      Language: 'he',
      Email: userEmail,
      IsSendByEmail: true,
      Products: [{ Description: 'AdSend - מנוי חודשי', Quantity: 1, UnitCost: 99 }],
    }
  }

  const res = await fetch(`${CARDCOM_API}/LowProfile/Create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.ResponseCode !== 0) {
    throw new Error(`Cardcom: ${data.Description ?? JSON.stringify(data)}`)
  }
  return { url: data.Url, lowProfileId: data.LowProfileId }
}

export async function getLowProfileResult(lowProfileId: string) {
  const { terminal, apiName } = getConfig()

  const res = await fetch(`${CARDCOM_API}/LowProfile/GetLpResult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TerminalNumber: terminal, ApiName: apiName, LowProfileId: lowProfileId }),
  })

  return res.json()
}

export async function chargeToken(
  token: string,
  cardExpMMYY: string,
  userEmail?: string,
  userName?: string,
): Promise<{ transactionId: number }> {
  const { terminal, apiName, apiPassword } = getConfig()

  const body: Record<string, unknown> = {
    TerminalNumber: terminal,
    ApiName: apiName,
    Amount: 99,
    Token: token,
    CardExpirationMMYY: cardExpMMYY,
    Advanced: { ApiPassword: apiPassword },
  }

  if (userEmail) {
    body.Document = {
      DocumentTypeToCreate: 'auto',
      Language: 'he',
      Name: userName,
      Email: userEmail,
      IsSendByEmail: true,
      Products: [{ Description: 'AdSend - מנוי חודשי', Quantity: 1, UnitCost: 99 }],
    }
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
