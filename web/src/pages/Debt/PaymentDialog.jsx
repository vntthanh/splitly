import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material'
import { Close as CloseIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material'
import { formatCurrency } from '~/utils/formatters'
import { submitPaymentRequestAPI, fetchMutualBillsAPI, balanceDebtsAPI } from '~/apis'

const PaymentDialog = ({ open, onClose, creditor, currentUserId, priorityBill, refetch }) => {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // New state for debt balancing
  const [paymentType, setPaymentType] = useState('pay') // 'pay' or 'balance'
  const [mutualBills, setMutualBills] = useState(null)
  const [loadingBills, setLoadingBills] = useState(false)

  // Set amount when dialog opens or creditor changes
  useEffect(() => {
    if (open && creditor?.totalAmount) {
      setAmount(creditor.totalAmount.toString())
    }
  }, [open, creditor])

  // Generate QR code URL when amount or creditor changes
  useEffect(() => {
    if (creditor?.bankName && creditor?.bankAccount && amount) {
      const amountValue = parseFloat(amount) || 0
      if (amountValue > 0) {
        setQrLoading(true)
        const qrUrl = `https://img.vietqr.io/image/${creditor.bankName}-${creditor.bankAccount}-qr_only.png?amount=${amountValue}`
        setQrCodeUrl(qrUrl)
      } else {
        setQrCodeUrl('')
        setQrLoading(false)
      }
    } else {
      setQrCodeUrl('')
      setQrLoading(false)
    }
  }, [amount, creditor?.bankName, creditor?.bankAccount])

  // Fetch mutual bills when dialog opens
  useEffect(() => {
    if (open && creditor?.userId) {
      fetchMutualBills()
    }
  }, [open, creditor?.userId])

  // Set default payment type based on balance availability
  useEffect(() => {
    if (open && mutualBills) {
      setPaymentType(mutualBills.canBalance ? 'balance' : 'pay')
    }
  }, [open, mutualBills])

  const fetchMutualBills = async () => {
    try {
      setLoadingBills(true)
      const data = await fetchMutualBillsAPI(currentUserId, creditor.userId || creditor._id)
      setMutualBills(data)
    } catch (error) {
      console.error('Error fetching mutual bills:', error)
      setMutualBills(null)
    } finally {
      setLoadingBills(false)
    }
  }

  const handleAmountChange = (e) => {
    // Remove all non-digit characters
    const value = e.target.value.replace(/[^0-9]/g, '')
    setAmount(value)
    if (errors.amount) {
      setErrors({ ...errors, amount: '' })
    }
  }

  // Format amount with thousand separators for display
  const formatAmountDisplay = (value) => {
    if (!value) return ''
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!amount || amount === '0') {
      newErrors.amount = 'Vui lòng nhập số tiền'
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePaymentClick = () => {
    if (!validateForm()) return
    setShowConfirmation(true)
  }

  const handleConfirmPayment = async () => {
    setLoading(true)
    try {
      await submitPaymentRequestAPI(currentUserId, {
        creditorId: creditor._id || creditor.userId,
        amount: parseFloat(amount),
        note: note.trim(),
        priorityBill: priorityBill || null
      })
      await refetch()
      
      // Reset form
      setAmount('')
      setNote('')
      setErrors({})
      setShowConfirmation(false)
      onClose()
    } catch (error) {
      console.error('Payment submission error:', error)
      setErrors({ submit: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.' })
      setShowConfirmation(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }

  const handlePaymentTypeChange = (event) => {
    setPaymentType(event.target.value)
    setErrors({})
    setShowConfirmation(false)
  }

  const handleBalanceClick = () => {
    setShowConfirmation(true)
  }

  const handleConfirmBalance = async () => {
    setLoading(true)
    try {
      await balanceDebtsAPI(currentUserId, creditor.userId || creditor._id)
      await refetch()
      setAmount('')
      setNote('')
      setErrors({})
      setShowConfirmation(false)
      onClose()
    } catch (error) {
      console.error('Balance submission error:', error)
      setErrors({ submit: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.' })
      setShowConfirmation(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setAmount('')
      setNote('')
      setErrors({})
      setShowConfirmation(false)
      setPaymentType('pay')
      setMutualBills(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none'
        }
      }}
    >
      <DialogContent sx={{ p: 3, position: 'relative' }}>
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            opacity: 0.7,
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              opacity: 1
            }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Conditional Content: Payment Info or Confirmation */}
        {!showConfirmation ? (
          <>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '18px',
                  fontFamily: "'Nunito Sans', sans-serif",
                  mb: 0.5
                }}
              >
                {paymentType === 'pay' ? 'Thông tin chuyển khoản' : 'Cân bằng nợ'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                {paymentType === 'pay' 
                  ? `Chuyển khoản cho ${creditor?.userName || ''}`
                  : `Cân bằng nợ với ${creditor?.userName || ''}`
                }
              </Typography>
            </Box>

            {/* Payment Type Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, mb: 1, fontSize: '14px' }}
              >
                Loại thanh toán
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={paymentType}
                  onChange={handlePaymentTypeChange}
                  disabled={loading || loadingBills}
                  sx={{
                    borderRadius: '18px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value="pay">Thanh toán nợ</MenuItem>
                  <MenuItem 
                    value="balance" 
                    disabled={!mutualBills?.canBalance}
                  >
                    Cân bằng nợ
                  </MenuItem>
                </Select>
              </FormControl>
              {loadingBills && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Đang tải dữ liệu...
                </Typography>
              )}
            </Box>

            {/* Conditional Content based on Payment Type */}
            {paymentType === 'pay' ? (
              <>
                {/* Amount Input */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, mb: 1, fontSize: '14px' }}
                  >
                    Số tiền thanh toán
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatAmountDisplay(amount)}
                    onChange={handleAmountChange}
                    placeholder="0"
                    error={!!errors.amount}
                    disabled={loading}
                    InputProps={{
                      endAdornment: <InputAdornment position="end" sx={{ color: 'text.secondary' }}>₫</InputAdornment>,
                      sx: {
                        borderRadius: '18px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        },
                        '& input': {
                          fontSize: '14px',
                          py: 1
                        }
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '12px' }}>
                    Tổng nợ: {formatCurrency(creditor?.totalAmount || 0)}
                  </Typography>
                </Box>

                {/* Bank Information Section - Conditionally Rendered */}
                {creditor?.bankName && creditor?.bankAccount && (
                  <Box 
                    sx={{ 
                      bgcolor: '#f5f5f5',
                      borderRadius: '18px',
                      p: 2,
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '16px' }}>
                        Ngân hàng:
                      </Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ fontSize: '16px' }}>
                        {creditor.bankName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '16px' }}>
                        Số tài khoản:
                      </Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ fontSize: '16px' }}>
                        {creditor.bankAccount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: qrCodeUrl ? 2 : 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '16px' }}>
                        Tên:
                      </Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ fontSize: '16px' }}>
                        {creditor.userName}
                      </Typography>
                    </Box>

                    {/* QR Code */}
                    {qrCodeUrl && (
                      <Box 
                        sx={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          minHeight: '220px'
                        }}
                      >
                        {qrLoading && (
                          <CircularProgress 
                            size={40} 
                            sx={{ 
                              color: 'primary.main',
                              position: 'absolute'
                            }} 
                          />
                        )}
                        <Box
                          component="img"
                          src={qrCodeUrl}
                          alt="QR Code thanh toán"
                          sx={{
                            width: '200px',
                            height: '200px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            bgcolor: 'white',
                            p: 1,
                            display: qrLoading ? 'none' : 'block'
                          }}
                          onLoad={() => setQrLoading(false)}
                          onError={(e) => {
                            console.error('Failed to load QR code')
                            setQrLoading(false)
                            e.target.style.display = 'none'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <>
                {/* Balance Debt Content */}
                {mutualBills && (
                  <>
                    {/* Bills You Owe */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 1, fontSize: '14px' }}
                      >
                        Hóa đơn bạn nợ
                      </Typography>
                      <Box sx={{ 
                        bgcolor: '#f5f5f5',
                        borderRadius: '12px',
                        p: 2,
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {mutualBills.user1Bills.length > 0 ? (
                          mutualBills.user1Bills.map((bill, index) => (
                            <Box key={bill._id} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              py: 0.5,
                              borderBottom: index < mutualBills.user1Bills.length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}>
                              <Typography variant="body2" sx={{ fontSize: '14px' }}>
                                {bill.billName}
                              </Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ fontSize: '14px' }}>
                                {formatCurrency(bill.remainingAmount)}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                            Không có hóa đơn nào
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Bills Creditor Owes */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 1, fontSize: '14px' }}
                      >
                        Hóa đơn {creditor?.userName} nợ
                      </Typography>
                      <Box sx={{ 
                        bgcolor: '#f5f5f5',
                        borderRadius: '12px',
                        p: 2,
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {mutualBills.user2Bills.length > 0 ? (
                          mutualBills.user2Bills.map((bill, index) => (
                            <Box key={bill._id} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              py: 0.5,
                              borderBottom: index < mutualBills.user2Bills.length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}>
                              <Typography variant="body2" sx={{ fontSize: '14px' }}>
                                {bill.billName}
                              </Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ fontSize: '14px' }}>
                                {formatCurrency(bill.remainingAmount)}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                            Không có hóa đơn nào
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Balance Result */}
                    <Box sx={{ 
                      bgcolor: '#fef3c7',
                      borderRadius: '12px',
                      p: 2,
                      mb: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '14px', color: '#92400e' }}>
                        {mutualBills.totalUser1Owes > mutualBills.totalUser2Owes
                          ? `Sau khi cân bằng nợ, bạn sẽ còn nợ ${creditor?.userName} ${formatCurrency(mutualBills.totalUser1Owes - mutualBills.totalUser2Owes)}`
                          : mutualBills.totalUser2Owes > mutualBills.totalUser1Owes
                          ? `Sau khi cân bằng nợ, ${creditor?.userName} sẽ còn nợ bạn ${formatCurrency(mutualBills.totalUser2Owes - mutualBills.totalUser1Owes)}`
                          : 'Sau khi cân bằng nợ, tất cả các hóa đơn sẽ được thanh toán hoàn toàn'
                        }
                      </Typography>
                    </Box>

                    {/* Auto Confirmation Notice */}
                    <Typography variant="body2" sx={{ fontSize: '13px', fontStyle: 'italic', color: 'gray', textAlign: 'center', mb: 2 }}>
                      Cân bằng nợ sẽ được xác nhận tự động và gửi email đến bạn và {creditor?.userName}
                    </Typography>
                  </>
                )}
              </>
            )}

        {/* Error Message */}
        {errors.submit && (
          <Typography
            variant="body2"
            sx={{
              color: '#d32f2f',
              textAlign: 'center',
              mb: 2,
              p: 1.5,
              bgcolor: '#ffebee',
              borderRadius: 2
            }}
          >
            {errors.submit}
          </Typography>
        )}
        {errors.amount && (
          <Typography
            variant="caption"
            sx={{
              color: '#d32f2f',
              display: 'block',
              mb: 2
            }}
          >
            {errors.amount}
          </Typography>
        )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleClose}
                disabled={loading}
                fullWidth
                sx={{
                  py: 1,
                  borderRadius: '18px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'text.primary',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                variant="outlined"
              >
                Để sau
              </Button>
              {paymentType === 'pay' ? (
                <Button
                  onClick={handlePaymentClick}
                  disabled={loading}
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    py: 1,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e57373 0%, #ba68c8 100%)'
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                  variant="contained"
                >
                  {loading ? 'Đang xử lý...' : 'Thanh toán'}
                </Button>
              ) : (
                <Button
                  onClick={handleBalanceClick}
                  disabled={loading || !mutualBills?.canBalance}
                  fullWidth
                  sx={{
                    py: 1,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e57373 0%, #ba68c8 100%)'
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                  variant="contained"
                >
                  {loading ? 'Đang xử lý...' : 'Cân bằng'}
                </Button>
              )}
            </Box>
          </>
        ) : (
          <>
            {/* Confirmation View */}
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '18px',
                    fontFamily: "'Nunito Sans', sans-serif",
                    mb: 2
                  }}
                >
                  {paymentType === 'pay' ? 'Xác nhận thanh toán' : 'Xác nhận cân bằng nợ'}
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '15px', color: 'text.primary', mb: 2 }}>
                  {paymentType === 'pay' 
                    ? `Bạn đã thanh toán ${formatCurrency(parseFloat(amount) || 0)} cho ${creditor?.userName}?`
                    : `Bạn có muốn cân bằng số tiền nợ không?`
                  }
                </Typography>
                {paymentType === 'balance' && mutualBills && (
                  <Typography variant="body1" sx={{ fontSize: '15px', color: 'text.primary' }}>
                    {mutualBills.totalUser1Owes > mutualBills.totalUser2Owes
                      ? `Sau khi cân bằng, bạn sẽ còn nợ ${creditor?.userName} ${formatCurrency(mutualBills.totalUser1Owes - mutualBills.totalUser2Owes)}.`
                      : mutualBills.totalUser2Owes > mutualBills.totalUser1Owes
                      ? `Sau khi cân bằng, ${creditor?.userName} sẽ còn nợ bạn ${formatCurrency(mutualBills.totalUser2Owes - mutualBills.totalUser1Owes)}.`
                      : 'Sau khi cân bằng, tất cả các hóa đơn sẽ được thanh toán hoàn toàn.'
                    }
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  onClick={handleCancelConfirmation}
                  disabled={loading}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'text.primary',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'divider',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  variant="outlined"
                >
                  {paymentType === 'pay' ? 'Chưa thanh toán' : 'Quay lại'}
                </Button>
                <Button
                  onClick={paymentType === 'pay' ? handleConfirmPayment : handleConfirmBalance}
                  disabled={loading}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #ef9a9a 0%, #ce93d8 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e57373 0%, #ba68c8 100%)'
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                  variant="contained"
                >
                  {loading ? 'Đang xử lý...' : (paymentType === 'pay' ? 'Đã thanh toán' : 'Xác nhận')}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PaymentDialog
