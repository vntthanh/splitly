import Layout from '~/components/Layout'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { useSelector } from 'react-redux'
import { fetchBillByIdAPI } from '~/apis'
import { getCategoryLabel } from '~/utils/formatters'
import colors from 'tailwindcss/colors'
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  NotificationsActive as NotificationsActiveIcon,
  Create as Edit,
} from '@mui/icons-material'
import { getInitials } from '~/utils/formatters'
// import { useColorScheme } from '@mui/material/styles'
import ConfirmPaymentDialog from '~/pages/Debt/ConfirmPaymentDialog'
import PaymentDialog from '~/pages/Debt/PaymentDialog'
import RemindDialog from '~/pages/Debt/RemindDialog'

const BillDetail = () => {
  const { billId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useSelector(selectCurrentUser)
  const [billData, setBillData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hoverGradient = 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)'

  // States for ConfirmPaymentDialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState(null)

  // States for PaymentDialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedCreditor, setSelectedCreditor] = useState(null)

  // States for RemindDialog
  const [remindDialogOpen, setRemindDialogOpen] = useState(false)
  const [selectedRemindDebtor, setSelectedRemindDebtor] = useState(null)


  useEffect(() => {
    const fetchBillDetail = async () => {
      try {
        setLoading(true)
        const response = await fetchBillByIdAPI(billId)
        setBillData(response)
        setError(null)
      } catch (err) {
        console.error('Error fetching bill detail:', err)
        setError('Không thể tải thông tin hóa đơn')
      } finally {
        setLoading(false)
      }
    }

    if (billId) {
      fetchBillDetail()
    }
  }, [billId])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateProgress = () => {
    if (!billData) return 0
    const paidParticipants = billData.participants.filter((p) => p.paid).length
    return (paidParticipants / billData.participants.length) * 100
  }

  const getTotalPaid = () => {
    if (!billData) return 0
    return billData.participants.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0)
  }

  const getTotalUnpaid = () => {
    if (!billData) return 0
    return billData.participants.filter((p) => !p.paid).reduce((sum, p) => sum + p.amount, 0)
  }

  const handleBack = () => {
    navigate(`/history`)
  }

  const handleEditBill = () => {
    navigate(`/bills/${billId}/edit`)
  }

  const handleConfirmPayment = (participant) => {
    setSelectedParticipant(participant)
    setConfirmDialogOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('confirmPayment') !== '1' || !billData || !isBillOwner()) return
    const participant = billData.participants.find((entry) => entry._id === searchParams.get('debtorId') && !entry.paid)
    if (participant) {
      setSelectedParticipant(participant)
      setConfirmDialogOpen(true)
    }
    setSearchParams({}, { replace: true })
  }, [billData, currentUser, searchParams, setSearchParams])

  const handleRemind = (debtor, billId) => {
    setSelectedRemindDebtor(debtor)
    setRemindDialogOpen(true)
  }

  const refetchBillData = async () => {
    const response = await fetchBillByIdAPI(billId)
    setBillData(response)
  }

  const handlePayment = (participant) => {
    setSelectedCreditor({
      userId: billData.payer._id,
      userName: billData.payer.name,
      totalAmount: participant.amount
    })
    setPaymentDialogOpen(true)
  }

  const isBillOwner = () => {
    return currentUser?._id === billData?.payerId
  }

  const isBillPayer = () => {
    return currentUser?._id === billData?.payerId
  }

  if (loading) {
    return (
      <Layout>
        <Box className="flex items-center justify-center min-h-screen">
          <CircularProgress sx={{ color: '#EF9A9A' }} />
        </Box>
      </Layout>
    )
  }

  if (error || !billData) {
    return (
      <Layout>
        <Box className="flex flex-col items-center justify-center min-h-screen">
          <Typography variant="h6" color="error" className="mb-4">
            {error || 'Không tìm thấy hóa đơn'}
          </Typography>
          <Button variant="contained" onClick={handleBack} sx={{ bgcolor: '#EF9A9A' }}>
            Quay lại
          </Button>
        </Box>
      </Layout>
    )
  }

  const paidCount = billData.participants.filter((p) => p.paid).length
  const totalPaid = getTotalPaid()
  const totalUnpaid = getTotalUnpaid()
  const progress = calculateProgress()

  return (
    <Layout>
      <Box className="@container main-container">
        {/* Header */}
            
        <Box className = '@3xl: justify-between'
          sx={{
            mb: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: {  sm: 'row' },
            gap: { xs: 2, sm: 0 },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Box className="flex items-center gap-3">
            <IconButton
              onClick={handleBack}
              sx={{
                color: '#0A0A0A',
                '&:hover': {
                  backgroundColor: colors.purple[50],
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>

            <Box>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{billData.billName}</h1>
              <Typography className="text-sm sm:text-base text-gray-500">Chi tiết hóa đơn</Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}
          >
            {isBillPayer() && (
              <Button
                variant="contained"
                onClick={handleEditBill}
                className='flex gap-2'
                sx={{
                  background: 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)',
                  color: '#ffff',
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                  whiteSpace: 'nowrap',
                  flex: {  sm: 'none' },
                  '&:hover': {
                    bgcolor: '#E57373',
                  },
                }}
              >
                <Edit />
                Chỉnh sửa hóa đơn
              </Button>
            )}
          </Box>
        </Box>

        {/* Summary Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: { xs: 3, sm: 2, md: 4 },
            mb: { xs: 4, md: 6 },
          }}
        >
          {/* Total Amount */}
          <Card
            sx={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)',
              color: '#1A1A1A',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 }, color: 'white' }}>
              <Box className="flex items-center gap-2 mb-2">
                <AttachMoneyIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: 'white' }}
                >
                  Tổng tiền
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, color: 'white' }}
              >
                {formatCurrency(billData.totalAmount)} đ
              </Typography>
            </CardContent>
          </Card>

          {/* Paid Amount */}
          <Card
            sx={{
              borderRadius: '16px',
              background: (theme) => (theme.palette.mode === 'dark' ? '#2D2D2D' : '#FFFFFF'),
              border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '1px solid #E5E7EB'),
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box className="flex items-center gap-2 mb-2">
                <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#4CAF50' }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  color="text.secondary"
                >
                  Đã thanh toán
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#4CAF50', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
              >
                {formatCurrency(totalPaid)} đ
              </Typography>
            </CardContent>
          </Card>

          {/* Unpaid Amount */}
          <Card
            sx={{
              borderRadius: '16px',
              background: (theme) => (theme.palette.mode === 'dark' ? '#2D2D2D' : '#FFFFFF'),
              border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '1px solid #E5E7EB'),
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box className="flex items-center gap-2 mb-2">
                <AccessTimeIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#FF9800' }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  color="text.secondary"
                >
                  Còn lại
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#FF9800', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
              >
                {formatCurrency(totalUnpaid)} đ
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content */}
        <Box className="grid grid-cols-1 @3xl:grid-cols-[2fr_1fr] gap-4 @md:gap-6">
          {/* Left Column - Bill Information */}
          <Box>
            <Card
              sx={{
                borderRadius: '16px',
                background: (theme) => (theme.palette.mode === 'dark' ? '#2D2D2D' : '#FFFFFF'),
                border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '1px solid #E5E7EB'),
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Thông tin hóa đơn
                </Typography>

                {/* Payer */}
                <Box className="mb-4">
                  <Box className="flex items-center gap-2 mb-2">
                    <PersonIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Người thanh toán
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
                    <Avatar
                      sx={{
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        background: 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(billData.payer.name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {billData.payer.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {billData.payer.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Date Created and Payment Deadline - Same Row */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: { xs: 3, sm: 4 },
                    mb: 4,
                  }}
                >
                  {/* Date Created */}
                  <Box>
                    <Box className="flex items-center gap-2 mb-2">
                      <CalendarIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Ngày tạo
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {formatDateTime(billData.createdAt)}
                    </Typography>
                  </Box>

                  {/* Payment Deadline */}
                  <Box>
                    <Box className="flex items-center gap-2 mb-2">
                      <AccessTimeIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Hạn thanh toán
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {billData.paymentDeadline ? formatDate(billData.paymentDeadline) : ''}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Status and Category - Same Row */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: { xs: 3, sm: 4 },
                    mb: 4,
                  }}
                >
                  {/* Status */}
                  <Box>
                    <Box className="flex items-center gap-2 mb-2">
                      <ReceiptIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Trạng thái
                      </Typography>
                    </Box>
                    <Chip
                      label={billData.settled ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      sx={{
                        bgcolor: billData.settled ? '#D1FAE5' : '#FEF3C7',
                        color: billData.settled ? '#10B981' : '#F59E0B',
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        height: { xs: 28, sm: 32 },
                      }}
                    />
                  </Box>

                  {/* Category */}
                  <Box>
                    <Box className="flex items-center gap-2 mb-2">
                      <DescriptionIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Danh mục
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {getCategoryLabel(billData.category)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Payment Progress */}
                <Box className="mb-4">
                  <Box className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Tiến độ thanh toán
                    </Typography>
                  </Box>
                  <Box className="flex justify-between items-center mb-2">
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      {paidCount}/{billData.participants.length} người đã thanh toán
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        color: hoverGradient,
                      }}
                    >
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: { xs: 8, sm: 10 },
                      borderRadius: 5,
                      bgcolor: hoverGradient,
                    }}
                  />
                </Box>

                {/* Description */}
                {billData.description && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                      <Box className="flex items-center gap-2 mb-2">
                        <DescriptionIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          Ghi chú
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          fontSize: { xs: '0.85rem', sm: '1rem' },
                          lineHeight: 1.6,
                        }}
                      >
                        {billData.description}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Participants */}
          <Box>
            <Card
              sx={{
                borderRadius: '16px',
                background: (theme) => (theme.palette.mode === 'dark' ? '#2D2D2D' : '#FFFFFF'),
                border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '1px solid #E5E7EB'),
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Người tham gia
                </Typography>

                {/* Progress */}
                <Box className="mb-4">
                  <Box className="flex justify-between items-center mb-2">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Tiến độ thanh toán
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {paidCount}/{billData.participants.length} người
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: { xs: 6, sm: 8 },
                      borderRadius: 4,
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#3D3D3D' : '#E5E7EB'),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#4CAF50',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Participants List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                  {billData.participants.map((participant) => (
                    <Box
                      key={participant._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: '12px',
                        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1A1A1A' : '#F9FAFB'),
                        gap: { xs: 2, sm: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1.5, sm: 2 },
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 36, sm: 40 },
                            height: { xs: 36, sm: 40 },
                            background: participant.paid
                              ? 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)'
                              : 'linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)',
                            color: '#1A1A1A',
                            fontSize: { xs: '0.85rem', sm: '1rem' },
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(participant.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {participant.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              color: participant.paid ? '#4CAF50' : '#FF9800',
                            }}
                          >
                            {formatCurrency(participant.amount)} đ
                          </Typography>
                        </Box>
                      </Box>

                      {/* Payment Status or Action Button */}
                      {participant.paid ? (
                        // Show green badge if participant has paid
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                          label="Đã thanh toán"
                          size="small"
                          sx={{
                            bgcolor: '#D1FAE5',
                            color: '#10B981',
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            height: { xs: 30, sm: 32 },
                            minWidth: { xs: 'auto', sm: '120px' },
                            '& .MuiChip-icon': {
                              color: '#10B981',
                            },
                          }}
                        />
                      ) : (
                        // If not paid, show buttons
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          {isBillOwner() ? (
                            // Bill owner sees confirmation button
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                              onClick={() => handleConfirmPayment(participant)}
                              sx={{
                                background: 'linear-gradient(90deg, #00c950 0%, #00a63e 100%)',
                                color: 'white',
                                borderRadius: '16px',
                                textTransform: 'none',
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                fontWeight: 600,
                                height: { xs: 30, sm: 32 },
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  background: 'linear-gradient(90deg, #00a63e 0%, #008e34 100%)',
                                },
                              }}
                            >
                              Xác nhận
                            </Button>
                          ) : (
                            // Others see payment button
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<SendIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                              onClick={() => handlePayment(participant)}
                              disabled={participant._id !== currentUser?._id}
                              sx={{
                                background: participant._id === currentUser?._id ? 'linear-gradient(90deg, #ff6900 0%, #f54900 100%)' : 'grey.400',
                                color: 'white',
                                borderRadius: '16px',
                                textTransform: 'none',
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                fontWeight: 600,
                                height: { xs: 30, sm: 32 },
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  background: participant._id === currentUser?._id ? 'linear-gradient(90deg, #f54900 0%, #e03d00 100%)' : 'grey.400',
                                },
                                '&.Mui-disabled': {
                                  background: 'grey.300',
                                  color: 'grey.500',
                                },
                              }}
                            >
                              Thanh toán
                            </Button>
                          )}
                          {/* Remind button for all unpaid */}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<NotificationsActiveIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                            onClick={() => handleRemind(participant, billId)}
                            sx={{
                              borderColor: 'divider',
                              color: 'text.primary',
                              borderRadius: '16px',
                              textTransform: 'none',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              fontWeight: 600,
                              height: { xs: 30, sm: 32 },
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'rgba(0,0,0,0.02)',
                              },
                            }}
                          >
                            Nhắc nhở
                          </Button>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Summary */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                  <Box className="flex justify-between items-center">
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                      Tổng cộng:
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      {formatCurrency(billData.totalAmount)} đ
                    </Typography>
                  </Box>
                  <Box className="flex justify-between items-center">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: '#4CAF50', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                    >
                      Đã thanh toán:
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#4CAF50', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      {formatCurrency(totalPaid)} đ
                    </Typography>
                  </Box>
                  <Box className="flex justify-between items-center">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: '#FF9800', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                    >
                      Còn lại:
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#FF9800', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      {formatCurrency(totalUnpaid)} đ
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Confirm Payment Dialog */}
      <ConfirmPaymentDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        myId={currentUser?._id}
        debtor={selectedParticipant ? {
          userId: selectedParticipant._id,
          userName: selectedParticipant.name,
          totalAmount: selectedParticipant.amount,
          bills: [{
            billId: billId,
            billName: billData.billName,
            remainingAmount: selectedParticipant.amount
          }]
        } : null}
        defaultAmount={selectedParticipant?.amount}
        bills={selectedParticipant ? [{
          billId: billId,
          billName: billData.billName,
          remainingAmount: selectedParticipant.amount
        }] : []}
        refetch={refetchBillData}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        creditor={selectedCreditor}
        currentUserId={currentUser?._id}
        priorityBill={billId}
        refetch={refetchBillData}
      />

      {/* Remind Dialog */}
      <RemindDialog
        open={remindDialogOpen}
        onClose={() => setRemindDialogOpen(false)}
        debtor={selectedRemindDebtor}
        creditorId={billData.payer._id}
        bill={billId}
      />
    </Layout>
  )
}

export default BillDetail
