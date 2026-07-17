import express from 'express'
import { MicrosoftGraphEmailProvider } from '~/providers/MicrosoftGraphEmailProvider'
import { env } from '~/config/environment'

const Router = express.Router()

/**
 * Send a Microsoft Graph test email.
 * GET /v1/test/email?to=recipient@example.com
 */
Router.get('/email', async (req, res) => {
  try {
    const testEmail = req.query.to || env.GRAPH_SENDER_EMAIL
    const isConnected = await MicrosoftGraphEmailProvider.verifyConnection()

    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'Microsoft Graph email service is not configured',
        config: {
          sender: env.GRAPH_SENDER_EMAIL,
          hasTenantId: !!env.GRAPH_TENANT_ID,
          hasClientId: !!env.GRAPH_CLIENT_ID,
          hasClientSecret: !!env.GRAPH_CLIENT_SECRET,
        },
      })
    }

    const result = await MicrosoftGraphEmailProvider.sendEmail(
      testEmail,
      'Test Email from Splitly API (Microsoft Graph)',
      'This is a test email sent through Microsoft Graph.',
      '<html><body><h1>Microsoft Graph Test Successful</h1><p>This email was sent through Microsoft Graph.</p></body></html>'
    )

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      result,
      config: { provider: 'Microsoft Graph', sender: env.GRAPH_SENDER_EMAIL },
    })
  } catch (error) {
    console.error('Microsoft Graph test email error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      config: {
        provider: 'Microsoft Graph',
        sender: env.GRAPH_SENDER_EMAIL,
        hasTenantId: !!env.GRAPH_TENANT_ID,
        hasClientId: !!env.GRAPH_CLIENT_ID,
        hasClientSecret: !!env.GRAPH_CLIENT_SECRET,
      },
    })
  }
})

/**
 * Get Microsoft Graph configuration status without exposing secrets.
 * GET /v1/test/graph-config
 */
Router.get('/graph-config', async (req, res) => {
  res.json({
    provider: 'Microsoft Graph',
    sender: env.GRAPH_SENDER_EMAIL,
    hasTenantId: !!env.GRAPH_TENANT_ID,
    hasClientId: !!env.GRAPH_CLIENT_ID,
    hasClientSecret: !!env.GRAPH_CLIENT_SECRET,
  })
})

export const testRoute = Router