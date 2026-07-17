import { NodemailerProvider } from '~/providers/NodemailerProvider.js'
import { WEBSITE_DOMAIN } from './constants'

export const sendPaymentEmail = async ({
  recipientEmail,
  recipientName,
  payerName,
  amount,
  note,
  confirmationToken,
}) => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; 
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header { 
      background: linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content { 
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .amount-card { 
      background: linear-gradient(135deg, rgba(239, 154, 154, 0.1) 0%, rgba(206, 147, 216, 0.1) 100%);
      border: 2px solid rgba(239, 154, 154, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .amount { 
      font-size: 42px; 
      font-weight: 700;
      background: linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 10px 0;
    }
    .note { 
      background: #f8fafc;
      padding: 20px;
      border-left: 4px solid #ce93d8;
      border-radius: 12px;
      margin: 25px 0;
    }
    .note-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .note-content {
      color: #64748b;
      font-size: 15px;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">💰</div>
        <h1>Thông báo thanh toán</h1>
      </div>
      <div class="content">
      <p class="greeting">Xin chào <strong>${recipientName}</strong>,</p>
      <p class="message">
        <strong>${payerName}</strong> vừa thực hiện thanh toán cho bạn trên Splitly.
      </p>
      
      <div class="amount-card">
        <div class="amount-label">Số tiền thanh toán</div>
        <div class="amount">${amount.toLocaleString('vi-VN')}₫</div>
      </div>
      
      ${
        note
          ? `
      <div class="note">
        <div class="note-label">📝 Ghi chú</div>
        <div class="note-content">${note}</div>
      </div>
      `
          : ''
      }
      
      <p class="action-text">
        Vui lòng kiểm tra và xác nhận khi bạn đã nhận được tiền.
      </p>
      
      ${
        confirmationToken
          ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${WEBSITE_DOMAIN}/payment/confirm?token=${confirmationToken}"
           style="display: inline-block;
                  padding: 16px 40px;
                  background: linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%);
                  color: white;
                  text-decoration: none;
                  border-radius: 18px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ✓ Xác nhận đã nhận tiền
        </a>
      </div>
      `
          : ''
      }
      
      <div class="footer">
        <p>Trân trọng,<br><strong>Splitly Team</strong></p>
      </div>
    </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    try {
      await NodemailerProvider.sendEmail(
        recipientEmail,
        `💰 ${payerName} đã thanh toán cho bạn qua Splitly`,
        'Splitly - Quản lý chi tiêu nhóm dễ dàng',
        htmlContent
      )
    } catch (error) {}

    return true
  } catch (error) {
    return false
  }
}

export const sendPaymentResponseEmail = async ({ payerEmail, payerName, recipientName, amount, isConfirmed }) => {
  try {
    const statusIcon = isConfirmed ? '✅' : '❌'
    const statusText = isConfirmed ? 'Đã nhận được' : 'Chưa nhận được'
    const statusColor = isConfirmed ? '#10b981' : '#ef4444'
    const statusGradient = isConfirmed
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    const message = isConfirmed
      ? `<strong>${recipientName}</strong> đã xác nhận nhận được khoản thanh toán từ bạn.`
      : `<strong>${recipientName}</strong> đã xác nhận <strong>không</strong> nhận được khoản thanh toán. Vui lòng kiểm tra lại.`

    // Modern HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; 
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header { 
      background: ${statusGradient};
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content { 
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .status-card { 
      background: ${isConfirmed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
      border: 2px solid ${isConfirmed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .status-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .status { 
      font-size: 24px; 
      font-weight: 700;
      color: ${statusColor};
      margin: 10px 0;
    }
    .amount { 
      font-size: 36px; 
      font-weight: 700;
      background: ${statusGradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 15px 0;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .login-button {
      text-align: center;
      margin: 30px 0;
    }
    .login-button a {
      display: inline-block;
      padding: 16px 40px;
      background: ${statusGradient};
      color: white;
      text-decoration: none;
      border-radius: 18px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">${statusIcon}</div>
        <h1>Thông báo xác nhận thanh toán</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào <strong>${payerName}</strong>,</p>
      <p class="message">
        ${message}
      </p>
      
      <div class="status-card">
        <div class="status-label">Trạng thái</div>
        <div class="status">${statusIcon} ${statusText}</div>
        <div class="status-label" style="margin-top: 20px;">Số tiền</div>
        <div class="amount">${amount.toLocaleString('vi-VN')}₫</div>
      </div>
      
      <p class="action-text">
        ${
          isConfirmed
            ? 'Khoản thanh toán đã được xác nhận thành công. Cảm ơn bạn đã sử dụng Splitly!'
            : 'Vui lòng liên hệ trực tiếp với người nhận để kiểm tra thông tin thanh toán.'
        }
      </p>
      
      <div class="login-button">
        <a href="${WEBSITE_DOMAIN}/login">
          Đăng nhập để xem chi tiết
        </a>
      </div>
      
      <div class="footer">
        <p>Trân trọng,<br><strong>Splitly Team</strong></p>
      </div>
    </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Send email using SMTP
    await NodemailerProvider.sendEmail(
      payerEmail,
      `${statusIcon} ${recipientName} ${statusText} thanh toán qua Splitly`,
      'Splitly - Quản lý chi tiêu nhóm dễ dàng',
      htmlContent
    )

    console.log(`Payment response email sent successfully to ${payerEmail}`)
    return true
  } catch (error) {
    console.error('Failed to send payment response email:', error)
    return false
  }
}

/**
 * Send payment reminder email to debtor
 * @param {Object} params - Email parameters
 * @returns {Promise<boolean>} - Success status
 */
export const sendPaymentReminderEmail = async ({
  debtorEmail,
  debtorName,
  creditorName,
  bills,
  creditorBankName,
  creditorBankAccount,
  reminderToken,
  priorityBill,
}) => {
  try {
    // Calculate total amount
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)

    // Generate QR code URL if bank info is available
    let qrCodeUrl = ''
    if (creditorBankName && creditorBankAccount && totalAmount > 0) {
      qrCodeUrl = `https://img.vietqr.io/image/${creditorBankName}-${creditorBankAccount}-qr_only.png?amount=${totalAmount}`
    }

    // Modern HTML email template for reminder
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; 
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header { 
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content { 
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .bills-list {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .bills-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bill-row {
      border-bottom: 1px solid #e2e8f0;
    }
    .bill-row:last-child {
      border-bottom: none;
    }
    .bill-name {
      font-weight: 600;
      color: #1e293b;
      text-align: left;
      padding: 12px 0;
    }
    .bill-amount {
      font-weight: 700;
      color: #f59e0b;
      text-align: right;
      padding: 12px 0;
    }
    .total-card { 
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
      border: 2px solid rgba(251, 191, 36, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      color: #1e293b;
    }
    .total-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .total-amount { 
      font-size: 36px; 
      font-weight: 700;
      margin: 10px 0;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .bank-info {
      background: #f5f5f5;
      border-radius: 18px;
      padding: 20px;
      margin: 25px 0;
    }
    .bank-info-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
    }
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      table-layout: auto;
    }
    .bank-table td {
      padding: 4px 0;
    }
    .bank-label {
      font-size: 14px;
      color: #64748b;
      padding-right: 2px;
      white-space: nowrap;
    }
    .bank-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .qr-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .qr-code {
      width: 200px;
      height: 200px;
      object-fit: contain;
      border-radius: 8px;
      background: white;
      padding: 8px;
    }
    .login-button {
      text-align: center;
      margin: 30px 0;
    }
    .login-button a {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      text-decoration: none;
      border-radius: 18px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">⏰</div>
        <h1>Nhắc nhở thanh toán</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào <strong>${debtorName}</strong>,</p>
        <p class="message">
          <strong>${creditorName}</strong> muốn nhắc nhở bạn về các khoản nợ chưa thanh toán trên Splitly.
        </p>
        
        <div class="bills-list">
          <table class="bills-table">
            ${bills
              .map(
                (bill) => `
              <tr class="bill-row">
                <td class="bill-name">${bill.billName}</td>
                <td class="bill-amount">${bill.amount.toLocaleString('vi-VN')}₫</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </div>
        
        <div class="total-card">
          <div class="total-label">Tổng số tiền cần thanh toán</div>
          <div class="total-amount">${totalAmount.toLocaleString('vi-VN')}₫</div>
        </div>
        
        ${
          creditorBankName && creditorBankAccount
            ? `
        <div class="bank-info">
          <div class="bank-info-title">Thông tin chuyển khoản</div>
          <table class="bank-table">
            <tr>
              <td class="bank-label">Ngân hàng:</td>
              <td class="bank-value">${creditorBankName}</td>
            </tr>
            <tr>
              <td class="bank-label">Số tài khoản:</td>
              <td class="bank-value">${creditorBankAccount}</td>
            </tr>
            <tr>
              <td class="bank-label">Chủ tài khoản:</td>
              <td class="bank-value">${creditorName}</td>
            </tr>
            <tr>
              <td class="bank-label">Số tiền thanh toán:</td>
              <td class="bank-value">${totalAmount.toLocaleString('vi-VN')}₫</td>
            </tr>
          </table>
          
          ${
            qrCodeUrl
              ? `
          <div class="qr-section">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" valign="middle" style="padding: 20px 0; min-height: 220px;">
                  <img src="${qrCodeUrl}" alt="QR Code thanh toán" class="qr-code" />
                </td>
              </tr>
            </table>
          </div>
          `
              : ''
          }

          <p style="font-size: 12px; margin-top: 12px; font-style: italic; text-align: center;">
          Bạn chỉ muốn thanh toán một phần? <a href="${WEBSITE_DOMAIN}/payment/pay?token=${reminderToken}${priorityBill ? `&bill=${priorityBill}` : ''}">Nhấn vào đây để tùy chỉnh số tiền.</a>
        </div>
        `
            : ''
        }
        
        <p class="action-text">
          Nếu bạn đã thanh toán, vui lòng nhấn vào nút bên dưới để xác nhận.
        </p>
        <div class="login-button">
          <a href="${WEBSITE_DOMAIN}/payment/pay?token=${reminderToken}${priorityBill ? `&bill=${priorityBill}` : ''}">
            Xác nhận thanh toán
          </a>
        </div>
        
        <div class="footer">
          <p>Trân trọng,<br><strong>Splitly Team</strong></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Send email using SMTP
    await NodemailerProvider.sendEmail(
      debtorEmail,
      `⏰ ${creditorName} nhắc nhở bạn thanh toán qua Splitly`,
      'Splitly - Quản lý chi tiêu nhóm dễ dàng',
      htmlContent
    )

    console.log(`Payment reminder email sent successfully to ${debtorEmail}`)
    return true
  } catch (error) {
    console.error('Failed to send payment reminder email:', error)
    return false
  }
}

/**
 * Send bill creation notification email to participants (except payer)
 * @param {Object} params - Email parameters
 * @returns {Promise<boolean>} - Success status
 */
export const sendBillCreationEmail = async ({
  participantEmail,
  participantName,
  payerName,
  billName,
  billDescription,
  totalAmount,
  participantAmount,
  items,
  participants,
  optOutToken,
  paymentToken,
  billId,
}) => {
  try {
    // Generate bill details HTML
    const billDetailsHtml =
      items && items.length > 0
        ? `
    <div class="bill-details">
      <h3 style="color: #1e293b; font-size: 18px; margin: 25px 0 15px 0;">Chi tiết hóa đơn</h3>
      <div class="items-list">
        ${items
          .map(
            (item) => `
          <div class="item-row">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              ${item.quantity ? `<span class="item-quantity">x${item.quantity}</span>` : ''}
            </div>
            <div class="item-amount">${item.amount.toLocaleString('vi-VN')}₫</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''

    // Generate participants list HTML
    const participantsHtml =
      participants && participants.length > 0
        ? `
    <div class="participants-section">
      <h3 style="color: #1e293b; font-size: 18px; margin: 25px 0 15px 0;">Người tham gia</h3>
      <div class="participants-list">
        <table class="participants-table">
          ${participants
            .map(
              (p) => `
            <tr class="participant-row">
              <td class="participant-name">${p.name}</td>
              <td class="participant-amount">${p.amount.toLocaleString('vi-VN')}</td>
            </tr>
          `
            )
            .join('')}
          <tr class="participant-row" style="border-top: 2px solid #e2e8f0; font-weight: 700;">
            <td class="participant-name">Tổng cộng</td>
            <td class="participant-amount">${totalAmount.toLocaleString('vi-VN')}₫</td>
          </tr>
        </table>
      </div>
    </div>
    `
        : ''

    // Modern HTML email template for bill creation
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .bill-info {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .bill-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .bill-description {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 15px;
    }
    .bill-details h3, .participants-section h3 {
      color: #1e293b;
      font-size: 18px;
      margin: 25px 0 15px 0;
    }
    .items-list, .participants-list {
      background: #f8fafc;
      border-radius: 12px;
      padding: 15px;
    }
    .participants-table {
      width: 100%;
      border-collapse: collapse;
    }
    .participant-row {
      border-bottom: 1px solid #e2e8f0;
    }
    .participant-row:last-child {
      border-bottom: none;
    }
    .participant-name {
      font-weight: 500;
      color: #1e293b;
      text-align: left;
      padding: 10px 0;
    }
    .participant-amount {
      font-weight: 700;
      color: #667eea;
      text-align: right;
      padding: 10px 0;
    }
    .total-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 2px solid rgba(102, 126, 234, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .total-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .total-amount {
      font-size: 36px;
      font-weight: 700;
      color: #1e293b;
      margin: 10px 0;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .amount-highlight-text {
      font-size: 16px;
      margin-bottom: 8px;
      opacity: 0.9;
    }
    .amount-highlight-value {
      font-size: 24px;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">📄</div>
        <h1>Bạn đã được thêm vào hóa đơn</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào <strong>${participantName}</strong>,</p>
        <p class="message">
          Bạn đã được <strong>${payerName}</strong> thêm vào hóa đơn trên Splitly.
        </p>

        <div class="bill-info">
          <div class="bill-title">${billName}</div>
          ${billDescription ? `<div class="bill-description">${billDescription}</div>` : ''}
        </div>

        ${billDetailsHtml}

        ${participantsHtml}

        <div class="total-card">
          <div class="total-label">Số tiền bạn cần thanh toán cho ${payerName}</div>
          <div class="total-amount">${participantAmount.toLocaleString('vi-VN')}₫</div>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${WEBSITE_DOMAIN}/payment/pay?token=${paymentToken}&bill=${billId}"
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 18px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Thanh toán ngay
          </a>
        </div>

        <p class="action-text">Bạn không tham gia hóa đơn này? <a href="${WEBSITE_DOMAIN}/bill/opt-out?token=${optOutToken}">Nhấn vào đây để từ chối.</a></p>

        <div class="footer">
          <p>Trân trọng,<br><strong>Splitly Team</strong></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Send email using SMTP
    await NodemailerProvider.sendEmail(
      participantEmail,
      `📄 Bạn đã được thêm vào hóa đơn "${billName}"`,
      'Splitly - Quản lý chi tiêu nhóm dễ dàng',
      htmlContent
    )

    console.log(`Bill creation email sent successfully to ${participantEmail}`)
    return true
  } catch (error) {
    console.error('Failed to send bill creation email:', error)
    return false
  }
}

/**
 * Send debt balance notification email
 * @param {Object} params - Email parameters
 * @returns {Promise<boolean>} - Success status
 */
export const sendDebtBalanceEmail = async ({
  user1Email,
  user1Name,
  user2Email,
  user2Name,
  user1BillsBefore,
  user2BillsBefore,
  user1BillsRemaining,
  user2BillsRemaining,
  billsMarkedPaid,
  netDebt,
}) => {
  try {
    // Format currency helper
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount)
    }

    // Generate bills list HTML
    const generateBillsList = (bills) => {
      if (!bills || bills.length === 0) {
        return '<p>Không có hóa đơn nào.</p>'
      }
      return `
        <table style="width: 100%; border-collapse: collapse;">
          ${bills
            .map(
              (bill) => `
            <tr>
              <td style="text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${bill.billName}</td>
              <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formatCurrency(
                bill.remainingAmount
              )}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      `
    }

    // Calculate totals before balancing
    const user1TotalBefore = user1BillsBefore.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    const user2TotalBefore = user2BillsBefore.reduce((sum, bill) => sum + bill.remainingAmount, 0)

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; 
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header { 
      background: linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content { 
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .bills-section {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .bills-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bill-row {
      border-bottom: 1px solid #e2e8f0;
    }
    .bill-row:last-child {
      border-bottom: none;
    }
    .bill-name {
      font-weight: 600;
      color: #1e293b;
      text-align: left;
      padding: 12px 0;
    }
    .bill-amount {
      font-weight: 700;
      color: #ef4444;
      text-align: right;
      padding: 12px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
    }
    .total-card { 
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
      border: 2px solid rgba(239, 68, 68, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .total-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .total-amount { 
      font-size: 36px; 
      font-weight: 700;
      color: #1e293b;
      margin: 10px 0;
    }
    .success-card { 
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
      border: 2px solid rgba(5, 150, 105, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .success-text {
      font-size: 18px;
      font-weight: 600;
      color: #059669;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">⚖️</div>
        <h1>Cân Bằng Nợ Thành Công</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào,</p>
        <p class="message">
          Hệ thống Splitly đã tự động cân bằng các hóa đơn giữa <strong>${user1Name}</strong> và <strong>${user2Name}</strong>.
        </p>
        
        <div class="bills-section">
          <div class="section-title">Hóa đơn nợ trước khi cân bằng</div>
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${user1Name} nợ ${user2Name}:</div>
            ${generateBillsList(user1BillsBefore)}
            <div style="text-align: center; margin-top: 15px; font-weight: 700; color: #ef4444;">
              Tổng: ${formatCurrency(user1TotalBefore)}
            </div>
          </div>
          <div>
            <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${user2Name} nợ ${user1Name}:</div>
            ${generateBillsList(user2BillsBefore)}
            <div style="text-align: center; margin-top: 15px; font-weight: 700; color: #ef4444;">
              Tổng: ${formatCurrency(user2TotalBefore)}
            </div>
          </div>
        </div>

        ${
          netDebt > 0
            ? `
        <div class="section-title">Kết quả cân bằng: ${user1Name} còn nợ</div>
        <div class="bills-section">
          ${generateBillsList(user1BillsRemaining)}
        </div>
        <div class="total-card">
          <div class="total-label">Tổng số tiền còn nợ</div>
          <div class="total-amount">${formatCurrency(netDebt)}</div>
        </div>
        `
            : netDebt < 0
            ? `
        <div class="section-title">Kết quả cân bằng: ${user2Name} còn nợ</div>
        <div class="bills-section">
          ${generateBillsList(user2BillsRemaining)}
        </div>
        <div class="total-card">
          <div class="total-label">Tổng số tiền còn nợ</div>
          <div class="total-amount">${formatCurrency(Math.abs(netDebt))}</div>
        </div>
        `
            : `
        <div class="success-card">
          <div class="success-icon">✅</div>
          <div class="success-text">Tất cả hóa đơn đã được thanh toán hoàn toàn</div>
        </div>
        `
        }

        <p class="action-text">
          Bạn có thể đăng nhập vào ứng dụng để xem chi tiết các hóa đơn đã được cập nhật.
        </p>
        
        <div class="footer">
          <p>Trân trọng,<br><strong>Splitly Team</strong></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

    // Send emails to both users using SMTP
    const [result1, result2] = await Promise.allSettled([
      NodemailerProvider.sendEmail(user1Email, `Cân bằng nợ với ${user2Name} - Splitly`, 'Splitly', htmlContent),
      NodemailerProvider.sendEmail(user2Email, `Cân bằng nợ với ${user1Name} - Splitly`, 'Splitly', htmlContent),
    ])

    const success1 = result1.status === 'fulfilled'
    const success2 = result2.status === 'fulfilled'

    if (success1 && success2) {
      console.log(`Debt balance emails sent successfully to ${user1Email} and ${user2Email}`)
      return true
    } else {
      console.error('Failed to send some debt balance emails:', {
        user1: success1 ? 'sent' : result1.reason?.message,
        user2: success2 ? 'sent' : result2.reason?.message,
      })
      return false
    }
  } catch (error) {
    console.error('Failed to send debt balance email:', error)
    return false
  }
}

/**
 * Send opt-out notification email to both debtor and creditor
 * @param {Object} params - Email parameters
 * @returns {Promise<boolean>} - Success status
 */
export const sendOptOutEmail = async ({
  debtorEmail,
  debtorName,
  creditorEmail,
  creditorName,
  billName,
  billDescription,
  amount,
}) => {
  try {
    // Email to debtor (the one who opted out)
    const debtorHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .bill-info {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .bill-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .bill-description {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 15px;
    }
    .amount-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
      border: 2px solid rgba(245, 158, 11, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #d97706;
      margin: 10px 0;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">🚪</div>
        <h1>Đã từ chối tham gia</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào <strong>${debtorName}</strong>,</p>
        <p class="message">
          Bạn đã từ chối tham gia hóa đơn "<strong>${billName}</strong>" thành công.
        </p>

        <div class="bill-info">
          <div class="bill-title">${billName}</div>
          ${billDescription ? `<div class="bill-description">${billDescription}</div>` : ''}
        </div>

        <div class="amount-card">
          <div class="amount-label">Số tiền đã được miễn trừ</div>
          <div class="amount">${amount.toLocaleString('vi-VN')}₫</div>
        </div>

        <p class="action-text">
          Bạn sẽ không còn chịu trách nhiệm thanh toán cho hóa đơn này nữa. ${creditorName} đã được thông báo về việc từ chối của bạn.
        </p>

        <div class="footer">
          <p>Trân trọng,<br><strong>Splitly Team</strong></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Email to creditor (the bill creator)
    const creditorHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .email-wrapper {
      background-color: #e2e8f0;
      padding: 40px 20px;
      width: 100%;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .bill-info {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .bill-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .bill-description {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 15px;
    }
    .amount-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
      border: 2px solid rgba(245, 158, 11, 0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #d97706;
      margin: 10px 0;
    }
    .action-text {
      font-size: 16px;
      color: #475569;
      margin: 25px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">🚪</div>
        <h1>Thông báo từ chối tham gia</h1>
      </div>
      <div class="content">
        <p class="greeting">Xin chào <strong>${creditorName}</strong>,</p>
        <p class="message">
          <strong>${debtorName}</strong> đã từ chối tham gia hóa đơn "<strong>${billName}</strong>".
        </p>

        <div class="bill-info">
          <div class="bill-title">${billName}</div>
          ${billDescription ? `<div class="bill-description">${billDescription}</div>` : ''}
        </div>

        <div class="amount-card">
          <div class="amount-label">Số tiền đã được miễn trừ</div>
          <div class="amount">${amount.toLocaleString('vi-VN')}₫</div>
        </div>

        <p class="action-text">
          ${debtorName} sẽ không còn chịu trách nhiệm thanh toán cho hóa đơn này nữa. Bạn có thể cập nhật hóa đơn hoặc tạo hóa đơn mới nếu cần.
        </p>

        <div class="footer">
          <p>Trân trọng,<br><strong>Splitly Team</strong></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Send emails to both debtor and creditor using SMTP
    const [debtorResult, creditorResult] = await Promise.allSettled([
      NodemailerProvider.sendEmail(
        debtorEmail,
        `🚪 Đã từ chối tham gia "${billName}" - Splitly`,
        'Splitly - Quản lý chi tiêu nhóm dễ dàng',
        debtorHtmlContent
      ),
      NodemailerProvider.sendEmail(
        creditorEmail,
        `🚪 ${debtorName} đã từ chối tham gia "${billName}" - Splitly`,
        'Splitly - Quản lý chi tiêu nhóm dễ dàng',
        creditorHtmlContent
      ),
    ])

    const debtorSuccess = debtorResult.status === 'fulfilled'
    const creditorSuccess = creditorResult.status === 'fulfilled'

    if (debtorSuccess && creditorSuccess) {
      console.log(`Opt-out emails sent successfully to ${debtorEmail} and ${creditorEmail}`)
      return true
    } else {
      console.error('Failed to send some opt-out emails:', {
        debtor: debtorSuccess ? 'sent' : debtorResult.reason?.message,
        creditor: creditorSuccess ? 'sent' : creditorResult.reason?.message,
      })
      return false
    }
  } catch (error) {
    console.error('Failed to send opt-out email:', error)
    return false
  }
}
