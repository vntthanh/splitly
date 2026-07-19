import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { Box, Typography, Button, IconButton, CircularProgress, Alert } from '@mui/material'
import { COLORS } from '~/theme'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Layout from '~/components/Layout'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import AddParticipantDialog from '~/components/Bills/AddParticipantDialog'
import GeneralInformationSection from '~/components/Bills/GeneralInformationSection'
import ParticipantsSection from '~/components/Bills/ParticipantsSection'
import EqualSplitDetails from '~/components/Bills/BillTypeTab/EqualSplitDetails'
import ByPersonSplitDetails from '~/components/Bills/BillTypeTab/ByPersonSplitDetails'
import ByItemSplitDetails from '~/components/Bills/BillTypeTab/ByItemSplitDetails'
import { fetchBillByIdAPI, updateBillAPI } from '~/apis'
import colors from 'tailwindcss/colors'
import {
  selectActiveBill,
  selectParticipants,
  selectItems,
  selectAvailablePeople,
  selectAvailableGroups,
  selectSearchedUsers,
  selectSearchedGroups,
  selectIsLoading,
  selectIsLoadingData,
  selectIsLoadingSearch,
  selectSubmitError,
  updateField,
  addParticipants,
  removeParticipant,
  updateParticipantAmount,
  addItem,
  removeItem,
  updateItem,
  toggleItemAllocation,
  calculateAmounts,
  initializeBill,
  resetBill,
  setSubmitError,
  loadMoreDataThunk,
  searchDataThunk,
} from '~/redux/bill/activeBillSlice'

function BillEdit() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { billId } = useParams()
  const currentUser = useSelector(selectCurrentUser)

  const billState = useSelector(selectActiveBill)
  const participants = useSelector(selectParticipants)
  const items = useSelector(selectItems)
  const availablePeople = useSelector(selectAvailablePeople)
  const availableGroups = useSelector(selectAvailableGroups)
  const searchedUsers = useSelector(selectSearchedUsers)
  const searchedGroups = useSelector(selectSearchedGroups)
  const isLoading = useSelector(selectIsLoading)
  const isLoadingData = useSelector(selectIsLoadingData)
  const isLoadingSearch = useSelector(selectIsLoadingSearch)
  const submitError = useSelector(selectSubmitError)

  const [openParticipantDialog, setOpenParticipantDialog] = useState(false)

  const [fetchingBill, setFetchingBill] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    const loadBillData = async () => {
      if (!billId) {
        setFetchError('Không tìm thấy ID hóa đơn')
        setFetchingBill(false)
        return
      }

      try {
        setFetchingBill(true)
        setFetchError(null)
        dispatch(resetBill())

        const billData = await fetchBillByIdAPI(billId)
        console.log(billData)

        dispatch(updateField({ field: 'billName', value: billData.billName || '' }))
        dispatch(updateField({ field: 'category', value: billData.category || '' }))
        dispatch(updateField({ field: 'notes', value: billData.description || '' }))
        dispatch(updateField({ field: 'totalAmount', value: billData.totalAmount || 0 }))
        dispatch(updateField({ field: 'creationDate', value: billData.creationDate || new Date().toISOString() }))
        dispatch(updateField({ field: 'paymentDeadline', value: billData.paymentDeadline || '' }))
        dispatch(updateField({ field: 'payer', value: billData.payer }))

        let splitType = 'equal'
        if (billData.splittingMethod === 'item-based') {
          splitType = 'by-item'
        } else if (billData.splittingMethod === 'people-based') {
          splitType = 'by-person'
        }
        dispatch(updateField({ field: 'splitType', value: splitType }))

        if (billData.participants && Array.isArray(billData.participants)) {
          const formattedParticipants = billData.participants.map((p) => {
            const paymentStatus = billData.paymentStatus?.find((ps) => ps.userId?._id === p._id || ps.userId === p._id)
            return {
              id: p._id,
              name: p.name || '',
              email: p.email || '',
              amount: paymentStatus?.amountOwed || 0,
              usedAmount: 0,
            }
          })
          dispatch(addParticipants(formattedParticipants))
        }

        if (splitType === 'by-item' && billData.items && Array.isArray(billData.items)) {
          dispatch(
            initializeBill({
              currentUserId: currentUser?._id,
              currentUserName: currentUser?.name,
              currentUserEmail: currentUser?.email,
            })
          )

          billData.items.forEach((itemData) => {
            dispatch(
              addItem({
                name: itemData.name || '',
                amount: itemData.amount || 0,
                quantity: itemData.quantity || 1,
                allocatedTo: itemData.allocatedTo?.map((user) => user._id || user) || [],
              })
            )
          })
        }
        dispatch(calculateAmounts())
        setFetchingBill(false)
      } catch (error) {
        console.error('Error fetching bill:', error)
        setFetchError('Không thể tải dữ liệu hóa đơn. Vui lòng thử lại.')
        setFetchingBill(false)
      }
    }

    loadBillData()
  }, [billId, dispatch, currentUser])

  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch(updateField({ field, value }))

      if (field === 'totalAmount' || field === 'splitType') {
        if (field === 'totalAmount') {
          const timer = setTimeout(() => {
            dispatch(calculateAmounts())
          }, 300)
          return () => clearTimeout(timer)
        } else {
          dispatch(calculateAmounts())
        }
      }
    },
    [dispatch]
  )

  const handleAddParticipants = useCallback(
    (newParticipants) => {
      dispatch(addParticipants(newParticipants))
      dispatch(calculateAmounts())
    },
    [dispatch]
  )

  const handleDeleteParticipant = useCallback(
    (id) => {
      dispatch(removeParticipant(id))
      dispatch(calculateAmounts())
    },
    [dispatch]
  )

  const handleParticipantAmountChange = useCallback(
    (id, amount) => {
      dispatch(updateParticipantAmount({ id, amount }))
    },
    [dispatch]
  )

  const handleParticipantAmountBlur = useCallback(() => {
    dispatch(calculateAmounts())
  }, [dispatch])

  const handleAddItem = useCallback(() => {
    dispatch(addItem())
  }, [dispatch])

  const handleDeleteItem = useCallback(
    (id) => {
      dispatch(removeItem(id))
      dispatch(calculateAmounts())
    },
    [dispatch]
  )

  const handleItemChange = useCallback(
    (id, field, value) => {
      if (field === 'quantity' || field === 'amount') {
        const numValue = parseFloat(value)

        if (isNaN(numValue) || numValue < 0) {
          if (value === '' || value === '0') {
            dispatch(updateItem({ id, field, value }))
          }
          return
        }
        if (field === 'quantity' && numValue < 1) {
          dispatch(updateItem({ id, field: 'quantity', value: 1 }))
          return
        }
      }

      dispatch(updateItem({ id, field, value }))
      if (field === 'amount' || field === 'quantity') {
        const timer = setTimeout(() => {
          dispatch(calculateAmounts())
        }, 300)
        return () => clearTimeout(timer)
      }
    },
    [dispatch]
  )

  const handleItemAllocationToggle = useCallback(
    (itemId, participantId) => {
      dispatch(toggleItemAllocation({ itemId, participantId }))
      dispatch(calculateAmounts())
    },
    [dispatch]
  )

  // Load more and search handlers
  const handleLoadMore = useCallback(
    async (page, limit, append, type) => {
      await dispatch(loadMoreDataThunk({ page, limit, type }))
    },
    [dispatch]
  )

  const handleSearch = useCallback(
    async (page, limit, search, append, type) => {
      await dispatch(searchDataThunk({ page, limit, search, type, append }))
    },
    [dispatch]
  )

  const getPayerName = useCallback(() => {
    return billState.payer.name
  }, [billState.payer])

  const handleSubmit = async () => {
    dispatch(setSubmitError(null))

    if (!billState.totalAmount || billState.totalAmount <= 0) {
      dispatch(setSubmitError('Vui lòng nhập số tiền hợp lệ'))
      return
    }

    const billData = {
      billName: billState.billName,
      creatorId: currentUser?._id,
      payerId: billState.payer._id,
      totalAmount: parseFloat(billState.totalAmount),
      creationDate: billState.creationDate,
      paymentDeadline: billState.paymentDeadline,
      description: billState.notes,
      category: billState.category,
      participants: participants.map((p) => String(p.id)),
    }

    if (billState.splitType === 'equal') {
      billData.splittingMethod = 'equal'
    } else if (billState.splitType === 'by-item') {
      billData.splittingMethod = 'item-based'
      billData.items = items
        .filter((item) => item.name && item.amount > 0 && item.allocatedTo.length > 0)
        .map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount),
          quantity: parseFloat(item.quantity) || 1,
          allocatedTo: item.allocatedTo.map((id) => String(id)),
        }))

      if (billData.items.length === 0) {
        dispatch(setSubmitError('Vui lòng thêm ít nhất một món hàng cho phương thức chia theo món'))
        return
      }
    } else if (billState.splitType === 'by-person') {
      billData.splittingMethod = 'people-based'
      billData.paymentStatus = participants.map((p) => ({
        userId: String(p.id),
        amountOwed: parseFloat(p.amount || 0),
      }))
    }

    // Submit update
    try {
      dispatch(updateField({ field: 'isLoading', value: true }))
      const response = await updateBillAPI(billId, billData)
      console.log(response)
      navigate(`/bills/${billId}`)
    } catch (error) {
      console.error('Error updating bill:', error)
      dispatch(setSubmitError(error.response?.data?.message || 'Không thể cập nhật hóa đơn. Vui lòng thử lại.'))
    } finally {
      dispatch(updateField({ field: 'isLoading', value: false }))
    }
  }

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Loading state while fetching bill data
  if (fetchingBill) {
    return (
      <Layout>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Đang tải dữ liệu hóa đơn...
            </Typography>
          </Box>
        </Box>
      </Layout>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <Layout>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: '400px', px: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {fetchError}
            </Alert>
            <Button variant="contained" onClick={() => navigate('/history')}>
              Quay lại
            </Button>
          </Box>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box 
        className="@container main-container"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 12 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            mb: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Box className="flex items-center gap-3">
            <IconButton
              sx={{
                color: '#0A0A0A',
                '&:hover': {
                  backgroundColor: colors.purple[50],
                },
              }}
              onClick={handleCancel}
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            <Box>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Chỉnh sửa hóa đơn</h1>
              <Typography className="text-sm sm:text-base text-gray-500">Cập nhật thông tin hóa đơn</Typography>
            </Box>
          </Box>
        </Box>

        {submitError && <FieldErrorAlert message={submitError} />}

        {/* General Information Section */}
        <GeneralInformationSection
          formData={billState}
          onFieldChange={handleFieldChange}
          getPayerName={getPayerName}
          onOpenPayerDialog={() => {}} // Disabled - payer is read-only
        />

        {/* Participants Section */}
        <ParticipantsSection
          participants={participants}
          splitType={billState.splitType}
          onOpenParticipantDialog={() => setOpenParticipantDialog(true)}
          onDeleteParticipant={handleDeleteParticipant}
          onParticipantAmountChange={handleParticipantAmountChange}
          onParticipantAmountBlur={handleParticipantAmountBlur}
          availableGroups={availableGroups}
        />

        {/* Split Details Section */}
        {billState.splitType === 'equal' && (
          <EqualSplitDetails
            formData={billState}
            onFieldChange={handleFieldChange}
            participants={participants}
            totalAmount={billState.totalAmount}
          />
        )}

        {billState.splitType === 'by-person' && (
          <ByPersonSplitDetails
            formData={billState}
            onFieldChange={handleFieldChange}
            participants={participants}
            totalAmount={billState.totalAmount}
          />
        )}

        {billState.splitType === 'by-item' && (
          <ByItemSplitDetails
            formData={billState}
            onFieldChange={handleFieldChange}
            participants={participants}
            totalAmount={billState.totalAmount}
            items={items}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onItemChange={handleItemChange}
            onItemAllocationToggle={handleItemAllocationToggle}
          />
        )}
      </Box>

      {/* Fixed Action Buttons */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          bottom: '0',
          left: { xs: '0', md: '256px' },
          right: '0',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `0.8px solid ${theme.palette.divider}`,
          borderRadius: '16px 16px 0 0',
          padding: { xs: '12px', sm: '16px' },
          gap: { xs: '8px', sm: '12px' },
          zIndex: 1000,
          boxShadow: theme.palette.mode === 'dark' ? '0 -2px 10px rgba(0,0,0,0.3)' : '0 -2px 10px rgba(0,0,0,0.05)',
        })}
      >
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isLoading}
          sx={{
            borderRadius: '16px',
            textTransform: 'none',
            fontSize: { xs: '13px', sm: '14px' },
            fontWeight: 500,
            border: (theme) => `0.8px solid ${theme.palette.divider}`,
            color: 'text.primary',
            minWidth: { xs: '80px', sm: 'auto' },
            px: { xs: 1.5, sm: 2 },
            '&:hover': {
              border: (theme) => `0.8px solid ${theme.palette.divider}`,
            },
          }}
        >
          Hủy
        </Button>
        <Button
          startIcon={<CheckCircleIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{
            background: COLORS.gradientPrimary,
            color: '#FAFAFA',
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 500,
            padding: '6px 12px',
            height: '36px',
            px: { xs: 1.5, sm: 2 },
            minWidth: { xs: '120px', sm: 'auto' },
            fontSize: { xs: '13px', sm: '14px' },
            '&:hover': {
              background: COLORS.gradientPrimary,
              opacity: 0.9,
            },
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Cập nhật hóa đơn'}
        </Button>
      </Box>

      {/* Add Participant Dialog */}
      <AddParticipantDialog
        open={openParticipantDialog}
        onClose={() => setOpenParticipantDialog(false)}
        onAdd={handleAddParticipants}
        onRemove={handleDeleteParticipant}
        currentParticipants={participants}
        availablePeople={availablePeople}
        availableGroups={availableGroups}
        isLoading={isLoadingData}
        onSearch={handleSearch}
        onLoadMore={handleLoadMore}
        searchedUsers={searchedUsers}
        searchedGroups={searchedGroups}
        searchPagination={billState.searchPagination}
        normalPagination={billState.normalPagination}
        isLoadingSearch={isLoadingSearch}
        currentPayerId={billState.payer}
        onMarkAsPayer={() => {}}
      />
    </Layout>
  )
}

export default BillEdit
