import { env } from '~/config/environment'

let tokenCache = null

const getAccessToken = async () => {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.accessToken

  const { GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET } = env
  if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET) {
    throw new Error('Microsoft Graph credentials are missing')
  }

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(GRAPH_TENANT_ID)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GRAPH_CLIENT_ID,
        client_secret: GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  )

  const tokenBody = await tokenResponse.json()
  if (!tokenResponse.ok) {
    throw new Error(`Microsoft Graph token request failed: ${tokenBody.error_description || tokenBody.error || tokenResponse.status}`)
  }

  tokenCache = {
    accessToken: tokenBody.access_token,
    expiresAt: Date.now() + Math.max(tokenBody.expires_in - 60, 60) * 1000,
  }
  return tokenCache.accessToken
}

const sendEmail = async (to, subject, textContent, htmlContent) => {
  if (!env.GRAPH_SENDER_EMAIL) throw new Error('GRAPH_SENDER_EMAIL is missing')

  const accessToken = await getAccessToken()
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.GRAPH_SENDER_EMAIL)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: htmlContent ? 'HTML' : 'Text', content: htmlContent || textContent },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(`Microsoft Graph sendMail failed: ${errorBody.error?.message || response.status}`)
  }

  return { accepted: true, status: response.status }
}

const verifyConnection = async () => {
  try {
    if (!env.GRAPH_SENDER_EMAIL) throw new Error('GRAPH_SENDER_EMAIL is missing')
    await getAccessToken()
    console.log('Microsoft Graph email service is ready')
    return true
  } catch (error) {
    console.error('Microsoft Graph connection error:', error.message)
    return false
  }
}

export const MicrosoftGraphEmailProvider = { sendEmail, verifyConnection }