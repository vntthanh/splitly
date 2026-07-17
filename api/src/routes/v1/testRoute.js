import express from 'express'
import { NodemailerProvider } from '~/providers/NodemailerProvider'
import { env } from '~/config/environment'

const Router = express.Router()

/**
 * Test SMTP connection and send a test email
 * GET /v1/test/email
 * Query params:
 *   - to: email address to send test email (optional, defaults to ADMIN_EMAIL_ADDRESS)
 */
Router.get('/email', async (req, res) => {
  try {
    const testEmail = req.query.to || env.ADMIN_EMAIL_ADDRESS

    // Step 1: Test SMTP connection
    console.log('Testing SMTP connection...')
    const isConnected = await NodemailerProvider.verifyConnection()

    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'SMTP connection failed',
        config: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          user: env.SMTP_USER,
          hasPassword: !!env.SMTP_PASSWORD,
        },
      })
    }

    console.log('SMTP connection successful, sending test email...')

    // Step 2: Try sending a test email
    const result = await NodemailerProvider.sendEmail(
      testEmail,
      'Test Email from Splitly API',
      'This is a test email. If you receive this, your SMTP configuration is working correctly!',
      `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #4CAF50;">✅ SMTP Test Successful!</h1>
              <p>This is a test email from Splitly API.</p>
              <p>If you receive this email, your SMTP configuration is working correctly!</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                Sent from: ${env.ADMIN_EMAIL_ADDRESS}<br>
                SMTP Host: ${env.SMTP_HOST}<br>
                SMTP Port: ${env.SMTP_PORT}
              </p>
            </div>
          </body>
        </html>
      `
    )

    console.log('Test email sent successfully:', result)

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      result: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      },
      config: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        from: env.ADMIN_EMAIL_ADDRESS,
      },
    })
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      config: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        hasPassword: !!env.SMTP_PASSWORD,
      },
    })
  }
})

/**
 * Get current SMTP configuration (without sensitive data)
 * GET /v1/test/smtp-config
 */
Router.get('/smtp-config', async (req, res) => {
  res.json({
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      hasPassword: !!env.SMTP_PASSWORD,
      passwordLength: env.SMTP_PASSWORD?.length || 0,
      from: {
        name: env.ADMIN_EMAIL_NAME,
        address: env.ADMIN_EMAIL_ADDRESS,
      },
    },
  })
})

export const testRoute = Router
