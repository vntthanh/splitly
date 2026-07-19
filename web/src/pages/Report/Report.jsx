import Layout from '~/components/Layout'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AutoAwesome as AutoAwesomeIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { COLORS } from '~/theme'
import { fetchMonthlyReportAPI, fetchAIAnalysisAPI } from '~/apis'
import { toast } from 'react-toastify'
import SpendingTrendChart from '~/components/charts/SpendingTrendChart'
import CategorySpendingChart from '~/components/charts/CategorySpendingChart'

// Metric Card Component
const MetricCard = ({ icon, title, value, subtitle, iconBgColor, iconColor }) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        backgroundColor: 'background.paper',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: iconBgColor,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '24px', sm: '28px' },
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '12px',
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  )
}

// AI Insight Card Component
const AIInsightCard = ({ title, description, suggestion }) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        mb: 3,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: COLORS.gradientPrimary,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              Gợi ý từ AI
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '13px',
              }}
            >
              Phân tích thông minh và đề xuất cải thiện từ TingTing AI
            </Typography>
          </Box>
        </Box>

        {/* Insight Content */}
        <Card
          sx={{
            borderRadius: '12px',
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  flexShrink: 0,
                }}
              >
                <TrendingUpIcon sx={{ color: '#2196F3', fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'text.primary',
                    mb: 1,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px',
                    mb: 1.5,
                    lineHeight: 1.6,
                  }}
                >
                  {description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    backgroundColor: 'rgba(239, 154, 154, 0.08)',
                    borderRadius: '8px',
                    p: 1.5,
                    border: '1px solid rgba(239, 154, 154, 0.2)',
                  }}
                >
                  <LightbulbIcon
                    sx={{
                      color: COLORS.primary,
                      fontSize: 18,
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Gợi ý:</strong> {suggestion}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

const Report = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const currentUser = useSelector((state) => state.user.currentUser)
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [reportData, setReportData] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)

  // Fetch report data when month changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (!currentUser?._id) return

      try {
        setLoading(true)
        const year = selectedMonth.year()
        const month = selectedMonth.month() + 1 // dayjs months are 0-indexed

        const data = await fetchMonthlyReportAPI(currentUser._id, year, month)
        setReportData(data)
      } catch (error) {
        console.error('Error fetching report data:', error)
        toast.error('Không thể tải dữ liệu báo cáo', { theme: 'colored' })
        setReportData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [selectedMonth, currentUser])

  // Fetch AI analysis once when component mounts
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (!currentUser?._id) return

      try {
        setLoadingAI(true)
        const analysis = await fetchAIAnalysisAPI(currentUser._id)
        setAiAnalysis(analysis)
      } catch (error) {
        console.error('Error fetching AI analysis:', error)
        // Don't show error toast for AI analysis - it's not critical
        setAiAnalysis(null)
      } finally {
        setLoadingAI(false)
      }
    }

    fetchAIAnalysis()
  }, [currentUser])

  const handleMonthChange = (newValue) => {
    setSelectedMonth(newValue)
  }

  // Format the date range for display
  const getDateRangeText = () => {
    if (!selectedMonth) return ''
    const startOfMonth = selectedMonth.startOf('month').format('DD/MM/YYYY')
    const endOfMonth = selectedMonth.endOf('month').format('DD/MM/YYYY')
    return `${startOfMonth} - ${endOfMonth}`
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `${Math.round(amount || 0).toLocaleString('vi-VN')} ₫`
  }

  // Format percentage with sign
  const formatPercentage = (value) => {
    const rounded = Math.round(value * 10) / 10
    return rounded > 0 ? `+${rounded}%` : `${rounded}%`
  }

  // Prepare metrics data from API response
  const getMetricsData = () => {
    if (!reportData) {
      return [
        {
          icon: <TrendingUpIcon sx={{ color: '#E91E63', fontSize: 20 }} />,
          title: 'Tổng chi tiêu',
          value: '0 ₫',
          subtitle: '0% so với kỳ trước',
          iconBgColor: 'rgba(233, 30, 99, 0.1)',
        },
        {
          icon: <ReceiptIcon sx={{ color: '#9C27B0', fontSize: 20 }} />,
          title: 'Số hóa đơn',
          value: '0',
          subtitle: '0% so với kỳ trước',
          iconBgColor: 'rgba(156, 39, 176, 0.1)',
        },
        {
          icon: <ScheduleIcon sx={{ color: '#FF9800', fontSize: 20 }} />,
          title: 'Hóa đơn quá hạn',
          value: '0',
          subtitle: 'Không có hóa đơn quá hạn',
          iconBgColor: 'rgba(255, 152, 0, 0.1)',
        },
        {
          icon: <CheckCircleIcon sx={{ color: '#00BCD4', fontSize: 20 }} />,
          title: 'Nợ chưa thanh toán',
          value: '0 ₫',
          subtitle: 'Tất cả đã thanh toán',
          iconBgColor: 'rgba(0, 188, 212, 0.1)',
        },
      ]
    }

    const { metrics } = reportData
    
    return [
      {
        icon: <TrendingUpIcon sx={{ color: '#E91E63', fontSize: 20 }} />,
        title: 'Tổng chi tiêu',
        value: formatCurrency(metrics.totalSpending.amount),
        subtitle: `${formatPercentage(metrics.totalSpending.change)} so với kỳ trước`,
        iconBgColor: 'rgba(233, 30, 99, 0.1)',
      },
      {
        icon: <ReceiptIcon sx={{ color: '#9C27B0', fontSize: 20 }} />,
        title: 'Số hóa đơn',
        value: `${metrics.billCount.count}`,
        subtitle: `${formatPercentage(metrics.billCount.change)} so với kỳ trước`,
        iconBgColor: 'rgba(156, 39, 176, 0.1)',
      },
      {
        icon: <ScheduleIcon sx={{ color: '#FF9800', fontSize: 20 }} />,
        title: 'Hóa đơn quá hạn',
        value: `${metrics.overdueBills.count}`,
        subtitle:
          metrics.overdueBills.count > 0
            ? `Tổng ${formatCurrency(metrics.overdueBills.amount)}`
            : 'Không có hóa đơn quá hạn',
        iconBgColor: 'rgba(255, 152, 0, 0.1)',
      },
      {
        icon: <CheckCircleIcon sx={{ color: '#00BCD4', fontSize: 20 }} />,
        title: 'Nợ chưa thanh toán',
        value: formatCurrency(metrics.unpaidDebt.amount),
        subtitle:
          metrics.unpaidDebt.amount === 0 ? 'Tất cả đã thanh toán' : 'Cần thanh toán',
        iconBgColor: 'rgba(0, 188, 212, 0.1)',
      },
    ]
  }

  // Mock data - replace with actual API data
  const metrics = getMetricsData()

  // Prepare spending trend data for line chart
  const getSpendingTrendData = () => {
    if (!reportData?.spendingTrend) return []

    return reportData.spendingTrend.map((dayData) => ({
      date: dayData.date.split('T')[0], // Get YYYY-MM-DD format
      totalAmount: dayData.amount || 0,
      billCount: dayData.count || 0,
    }))
  }

  // Prepare category spending data for pie chart
  const getCategorySpendingData = () => {
    if (!reportData?.categoryBreakdown) return []
    return reportData.categoryBreakdown
  }

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '24px', sm: '28px', md: '32px' },
              color: 'text.primary',
              mb: 1,
            }}
          >
            Báo cáo &amp; Phân tích
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '13px', sm: '14px' },
            }}
          >
            Tổng quan chi tiêu ý từ AI
          </Typography>
        </Box>

        {/* Period Selector Card */}
        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            mb: 3,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
              >
                <CalendarIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Kỳ báo cáo:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'text.primary',
                  }}
                >
                  {getDateRangeText()}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                  <DatePicker
                    views={['month', 'year']}
                    label="Chọn tháng"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: {
                          minWidth: { xs: '100%', sm: 220 },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'background.default',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: 'divider',
                              transition: 'border-color 0.3s ease',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(239, 154, 154, 0.02)',
                              '& fieldset': {
                                borderColor: COLORS.primary,
                              },
                              '& .MuiSvgIcon-root': {
                                transform: 'scale(1.1)',
                              },
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'rgba(239, 154, 154, 0.03)',
                              '& fieldset': {
                                borderColor: COLORS.primary,
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'text.secondary',
                            '&.Mui-focused': {
                              color: COLORS.primary,
                              fontWeight: 600,
                            },
                          },
                          '& .MuiInputBase-input': {
                            padding: '8.5px 14px',
                            color: 'text.primary',
                          },
                          '& .MuiSvgIcon-root': {
                            color: COLORS.primary,
                            fontSize: 22,
                            transition: 'transform 0.3s ease',
                          },
                        },
                      },
                      popper: {
                        sx: {
                          '& .MuiPaper-root': {
                            borderRadius: '16px',
                            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
                            border: '1px solid',
                            borderColor: 'divider',
                            mt: 1,
                            overflow: 'hidden',
                          },
                          '& .MuiPickersCalendarHeader-root': {
                            paddingTop: 2,
                            paddingBottom: 1,
                          },
                          '& .MuiPickersCalendarHeader-label': {
                            fontWeight: 600,
                            fontSize: '15px',
                            color: 'text.primary',
                          },
                          '& .MuiPickersYear-yearButton': {
                            borderRadius: '10px',
                            fontWeight: 500,
                            fontSize: '14px',
                            margin: '4px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 154, 154, 0.12)',
                              transform: 'scale(1.05)',
                            },
                            '&.Mui-selected': {
                              background: COLORS.gradientPrimary,
                              color: 'white',
                              fontWeight: 600,
                              boxShadow: '0px 2px 8px rgba(239, 154, 154, 0.4)',
                              '&:hover': {
                                background: COLORS.gradientPrimary,
                                transform: 'scale(1.05)',
                              },
                            },
                          },
                          '& .MuiPickersMonth-monthButton': {
                            borderRadius: '10px',
                            fontWeight: 500,
                            fontSize: '14px',
                            margin: '4px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 154, 154, 0.12)',
                              transform: 'scale(1.05)',
                            },
                            '&.Mui-selected': {
                              background: COLORS.gradientPrimary,
                              color: 'white',
                              fontWeight: 600,
                              boxShadow: '0px 2px 8px rgba(239, 154, 154, 0.4)',
                              '&:hover': {
                                background: COLORS.gradientPrimary,
                                transform: 'scale(1.05)',
                              },
                            },
                          },
                          '& .MuiPickersCalendarHeader-switchViewButton': {
                            color: COLORS.primary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 154, 154, 0.1)',
                              transform: 'scale(1.1)',
                            },
                          },
                          '& .MuiPickersArrowSwitcher-button': {
                            color: COLORS.primary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 154, 154, 0.1)',
                              transform: 'scale(1.1)',
                            },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, sm: 2.5, md: 3 },
            mb: 4,
          }}
        >
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </Box>

        {/* AI Insight Section */}
        {loadingAI ? (
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              mb: 3,
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircularProgress sx={{ color: COLORS.primary }} size={30} />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Đang phân tích dữ liệu...</Typography>
          </Card>
        ) : aiAnalysis ? (
          <>
            {aiAnalysis.monthlyAdvice?.description && (
              <AIInsightCard
                title="Dự đoán chi tiêu tháng tới"
                description={aiAnalysis.monthlyAdvice.description}
                suggestion={aiAnalysis.monthlyAdvice.suggestion}
              />
            )}
            {aiAnalysis.productAdvice?.description && (
              <AIInsightCard
                title="Phân tích chi tiêu theo danh mục"
                description={aiAnalysis.productAdvice.description}
                suggestion={aiAnalysis.productAdvice.suggestion}
              />
            )}
            {aiAnalysis.debtAdvice?.description && (
              <AIInsightCard
                title="Quản lý khoản nợ của bạn"
                description={aiAnalysis.debtAdvice.description}
                suggestion={aiAnalysis.debtAdvice.suggestion}
              />
            )}
            {aiAnalysis.oweAdvice?.description && (
              <AIInsightCard
                title="Quản lý khoản cho vay"
                description={aiAnalysis.oweAdvice.description}
                suggestion={aiAnalysis.oweAdvice.suggestion}
              />
            )}
          </>
        ) : reportData?.aiInsights && reportData.aiInsights.length > 0 ? (
          reportData.aiInsights.map((insight, index) => (
            <AIInsightCard key={index} {...insight} />
          ))
        ) : (
          <AIInsightCard
            title="Phân tích chi tiêu trung bình"
            description="Chưa có đủ dữ liệu để phân tích trong kỳ này."
            suggestion="Tiếp tục ghi lại các chi tiêu để nhận được phân tích chi tiết hơn."
          />
        )}

        {/* Charts Section */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          <SpendingTrendChart data={getSpendingTrendData()} />
          <CategorySpendingChart data={getCategorySpendingData()} />
        </Box>
      </Box>
    </Layout>
  )
}

export default Report
