import Layout from '~/components/Layout'
import { useEffect, useState } from 'react'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchHistoryFilterAPI } from '~/apis'
import { getCategoryLabel } from '~/utils/formatters'
import {
  Box,
  TextField,
  Pagination,
  Avatar,
  AvatarGroup,
  InputAdornment,
  CircularProgress,
  Typography,
  Popover,
  Button,
  FormControlLabel,
  Checkbox,
  Chip,
  Card,
  CardContent,
} from '@mui/material'
import { FilterAlt as FilterListIcon, Search as SearchIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'

const History = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [totalPage, setTotalPage] = useState(1)
  const [totalBills, setTotalBills] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all') // all, paid, unpaid, pending

  // Filter states
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterByPayer, setFilterByPayer] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    fromDate: '',
    toDate: '',
    payer: false,
  })

  // Status tabs configuration
  const statusTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'paid', label: 'Đã thanh toán' },
    { id: 'unpaid', label: 'Chưa thanh toán' },
  ]

  const currentUser = useSelector(selectCurrentUser)
  const currentUserId = currentUser?._id

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
      setPage(1) // Reset to page 1 when search changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchText])

  // Fetch history data when page, search, or filters change
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true)

        // Use unified filter API with all parameters
        const responseData = await fetchHistoryFilterAPI(
          currentUserId,
          page,
          6,
          activeFilters.fromDate,
          activeFilters.toDate,
          activeFilters.payer,
          debouncedSearch,
          statusFilter
        )

        setHistoryData(responseData.bills || [])
        setTotalPage(responseData.pagination?.totalPages || 1)
        setTotalBills(responseData.pagination?.total || 0)
        console.log(responseData.bills)

        setError(null)
      } catch (err) {
        console.error('Error fetching history data', err)
        setError('Failed to load history data')
        setHistoryData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [currentUserId, page, debouncedSearch, activeFilters, statusFilter])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('vi-VN')
  }

  const handlePageChange = (event, value) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (event) => {
    setSearchText(event.target.value)
  }

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleApplyFilters = () => {
    setActiveFilters({
      fromDate,
      toDate,
      payer: filterByPayer,
    })
    setPage(1)
    handleFilterClose()
  }

  const handleResetFilters = () => {
    setFromDate('')
    setToDate('')
    setFilterByPayer(false)
    setActiveFilters({
      fromDate: '',
      toDate: '',
      payer: false,
    })
    setPage(1)
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const [day, month, year] = dateString.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const formatDateForAPI = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status)
    setPage(1)
  }

  const getStatusBadge = (bill) => {
    const isOwner = bill.payer?._id === currentUserId || bill.payer?.id === currentUserId

    if (isOwner) {
      if (bill.settled) {
        return { label: 'Đã thanh toán', color: '#10B981', bgColor: '#D1FAE5' }
      }
      return { label: 'Chưa thanh toán', color: '#F59E0B', bgColor: '#FEF3C7' }
    } else {
      const currentUserPayment = bill.paymentStatus?.find((participant) => participant.userId === currentUserId)
      if (currentUserPayment?.paidDate) {
        return { label: 'Đã thanh toán', color: '#10B981', bgColor: '#D1FAE5' }
      }
      return { label: 'Chưa thanh toán', color: '#F59E0B', bgColor: '#FEF3C7' }
    }
  }


  // No longer need client-side filtering since backend handles it
  const filteredHistoryData = historyData
  const openFilterPopover = Boolean(filterAnchorEl)
  const hasActiveFilters = activeFilters.fromDate || activeFilters.toDate || activeFilters.payer
  const hoverGradient = 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)'

  if (error) {
    return (
      <Layout>
        <Box className="p-6 md:p-10 min-h-screen bg-gray-50 flex items-center justify-center">
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box className="@container main-container">
        {/* Header */}
        <Box className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Hóa đơn của tôi</h1>
          <Typography className="text-sm sm:text-base text-gray-500">Quản lý tất cả hóa đơn chi tiêu</Typography>
        </Box>

        {/* Search and Filter Bar */}
        <Box className="mb-6 bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <Box className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <TextField
              fullWidth
              placeholder="Tìm kiếm hóa đơn..."
              value={searchText}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: '#9CA3AF',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#F9FAFB',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '& fieldset': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover fieldset': {
                    borderColor: hoverGradient,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: hoverGradient,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: { xs: '10px 14px', sm: '12px 14px' },
                },
              }}
            />
            <Button
              onClick={handleFilterClick}
              startIcon={<FilterListIcon />}
              sx={{
                color: hasActiveFilters ? '#FFF' : '#0A0A0A',
                backgroundColor: hasActiveFilters ? '#0A0A0A' : '#F3F4F6',
                '&:hover': {
                  backgroundColor: hasActiveFilters ? '#463A7A' : '#E5E7EB',
                },
                borderRadius: '12px',
                padding: { xs: '10px 16px', sm: '12px 20px' },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                whiteSpace: 'nowrap',
                minWidth: { xs: 'auto', sm: '180px' },
              }}
            >
              Bộ lọc nâng cao
            </Button>
          </Box>
        </Box>

        {/* Filter Popover */}
        <Popover
          open={openFilterPopover}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              minWidth: '320px',
              p: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#1F2937',
                mb: 3,
              }}
            >
              Bộ lọc nâng cao
            </Typography>

            {/* Date Range Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1,
                }}
              >
                Từ ngày
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={formatDateForInput(fromDate)}
                onChange={(e) => setFromDate(formatDateForAPI(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1,
                }}
              >
                Đến ngày
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={formatDateForInput(toDate)}
                onChange={(e) => setToDate(formatDateForAPI(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>

            {/* Payer Filter */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterByPayer}
                    onChange={(e) => setFilterByPayer(e.target.checked)}
                    sx={{
                      color: '#D1D5DB',
                      '&.Mui-checked': {
                        color: '#574D98',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.875rem', color: '#374151' }}>
                    Chỉ hiển thị hóa đơn tôi là người ứng tiền
                  </Typography>
                }
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleResetFilters}
                sx={{
                  color: '#6B7280',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                  },
                }}
              >
                Đặt lại
              </Button>
              <Button
                onClick={handleApplyFilters}
                variant="contained"
                sx={{
                  background: hoverGradient,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  px: 3,
                  color: '#ffff',
                  '&:hover': {
                    backgroundColor: '#463A7A',
                  },
                }}
              >
                Áp dụng
              </Button>
            </Box>
          </Box>
        </Popover>

        {/* Status Tabs */}
        <Box className="mb-6 flex gap-2 sm:gap-3 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => handleStatusFilterChange(tab.id)}
              sx={{
                background: statusFilter === tab.id ? hoverGradient : '#FFF',
                color: statusFilter === tab.id ? '#FFF' : '#6B7280',
                borderRadius: '20px',
                padding: { xs: '6px 16px', sm: '8px 20px' },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.813rem', sm: '0.938rem' },
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: statusFilter === tab.id ? hoverGradient : '#F9FAFB',
                  opacity: statusFilter === tab.id ? 0.9 : 1,
                },
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* Results Count */}
        <Box className="mb-4">
          <Typography className="text-sm sm:text-base text-gray-600">
            Tìm thấy tổng cộng {totalBills} hóa đơn
          </Typography>
        </Box>

        {/* Bills Card List */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
            }}
          >
            <CircularProgress sx={{ color: '#574D98' }} />
          </Box>
        ) : filteredHistoryData.length === 0 ? (
          <Box className="flex flex-col items-center justify-center py-16">
            <SearchIcon sx={{ fontSize: 80, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" className="text-gray-500 mb-2">
              {debouncedSearch ? `Không tìm thấy hóa đơn cho "${debouncedSearch}"` : 'Không có hóa đơn nào'}
            </Typography>
            {debouncedSearch && (
              <Typography variant="body2" className="text-gray-400">
                Thử tìm kiếm với từ khóa khác
              </Typography>
            )}
          </Box>
        ) : (
          <Box className="grid @5xl:grid-cols-2 gap-4">
            {filteredHistoryData.map((bill) => {
              const statusBadge = getStatusBadge(bill)
              return (
                <Card
                  key={bill.id}
                  onClick={() => navigate(`/bills/${bill._id || bill.id}`)}
                  sx={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box className="flex flex-col sm:flex-row justify-between gap-4">
                      {/* Left: Avatar */}
                      <div className="flex gap-4">
                        <Box className="flex-shrink-0">
                          <Avatar
                            sx={{
                              width: { xs: 48, sm: 56 },
                              height: { xs: 48, sm: 56 },
                              background: hoverGradient,
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                              fontWeight: 700,
                            }}
                          >
                            {bill.payer.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Box>

                        {/* Middle: Bill Info */}
                        <Box className="flex-grow">
                          {/* Bill Name and Status */}
                          <Box className="flex flex-wrap items-center gap-2 mb-2">
                            <Typography
                              sx={{
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                fontWeight: 700,
                                color: '#1F2937',
                              }}
                            >
                              {bill.billName}
                            </Typography>
                            <Chip
                              label={statusBadge.label}
                              size="small"
                              sx={{
                                backgroundColor: statusBadge.bgColor,
                                color: statusBadge.color,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: '24px',
                              }}
                            />
                          </Box>

                          {/* Date, Category, and Participants */}
                          <Box className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 mb-3">
                            {/* Date */}
                            <Box className="flex items-center gap-1">
                              <CalendarIcon sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
                              <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(bill.createdAt)}</Typography>
                            </Box>

                            {/* Category */}
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: '#6B7280',
                              }}
                            >
                              • {getCategoryLabel(bill.category)}
                            </Typography>

                            {/* Participants */}
                            <Box className="flex items-center gap-1">
                              <AvatarGroup
                                max={4}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.75rem',
                                    backgroundColor: '#D1D5DB',
                                    color: '#6B7280',
                                    border: '2px solid white',
                                  },
                                }}
                              >
                                {bill.participants.map((participant, idx) => (
                                  <Avatar key={idx}>{participant.name.charAt(0)}</Avatar>
                                ))}
                              </AvatarGroup>
                              {bill.participants.length > 1 && (
                                <Typography sx={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                                  +{bill.participants.length - 1}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </div>

                      {/* Right: Amount and Payer */}
                      <Box className="flex flex-col  justify-between items-end ">
                        <p className="md:text-xl font-bold text-[#1F2937]">{formatCurrency(bill.totalAmount)} đ</p>
                        <Box className="text-right">
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: '#9CA3AF',
                              mb: 0.5,
                            }}
                          >
                            Người trả:
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#6B7280',
                            }}
                          >
                            {bill.payer.name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}

        {/* Pagination */}
        {!loading && filteredHistoryData.length > 0 && totalPage > 1 && (
          <Box className="flex justify-center mt-8">
            <Pagination
              count={totalPage}
              page={page}
              onChange={handlePageChange}
              color="primary"
              // shape="rounded"
              // size="medium"
              // siblingCount={{ xs: 0, sm: 1 }}
              boundaryCount={2}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '&.Mui-selected': {
                    color: '#FFF',
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Layout>
  )
}

export default History
