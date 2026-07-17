import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { Box, Typography, Button, IconButton } from '@mui/material'
import { COLORS } from '~/theme'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import AddParticipantDialog from '~/components/Bills/AddParticipantDialog'
import SelectPayerDialog from '~/components/Bills/SelectPayerDialog'
import GeneralInformationSection from '~/components/Bills/GeneralInformationSection'
import ParticipantsSection from '~/components/Bills/ParticipantsSection'
import EqualSplitDetails from '~/components/Bills/BillTypeTab/EqualSplitDetails'
import ByPersonSplitDetails from '~/components/Bills/BillTypeTab/ByPersonSplitDetails'
import ByItemSplitDetails from '~/components/Bills/BillTypeTab/ByItemSplitDetails'
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
  hydrateBillDraft,
  resetBill,
  setSubmitError,
  fetchInitialDataThunk,
  loadMoreDataThunk,
  searchDataThunk,
  submitBillThunk,
} from '~/redux/bill/activeBillSlice'
import { useChatbot } from '~/context/ChatbotContext'

function BillCreate() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  // Redux state
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

  // Dialog states
  const [openParticipantDialog, setOpenParticipantDialog] = useState(false)
  const [openPayerDialog, setOpenPayerDialog] = useState(false)
  const [billDraftWarnings, setBillDraftWarnings] = useState([])

  // Chatbot
  const { updatePageContext } = useChatbot()

  // Initialize bill on mount
  useEffect(() => {
    dispatch(
      initializeBill({
        currentUserId: currentUser?._id,
        currentUserName: currentUser?.name,
        currentUserEmail: currentUser?.email,
      })
    )
    // fetch user list and group list
    dispatch(fetchInitialDataThunk())
    return () => {
      dispatch(resetBill())
    }
  }, [dispatch, currentUser])

  // Auto-fill form from payload (navigation state or URL params)
  useEffect(() => {
    // Check for form data in navigation state
    const stateData = window.history.state?.usr?.billFormData

    // Check for form data in URL params
    const searchParams = new URLSearchParams(window.location.search)
    const urlData = searchParams.get('billFormData')

    let formData = null

    if (stateData) {
      formData = stateData
    } else if (urlData) {
      try {
        formData = JSON.parse(decodeURIComponent(urlData))
      } catch (error) {
        console.error('Error parsing billFormData from URL:', error)
      }
    }

    if (formData) {
      dispatch(hydrateBillDraft(formData))
      dispatch(calculateAmounts())
      setBillDraftWarnings(stateData?.billDraftWarnings || [])

      // Clear the payload to prevent re-filling on future navigations
      if (stateData) {
        window.history.replaceState({}, document.title)
      }
      if (urlData) {
        searchParams.delete('billFormData')
        const newSearch = searchParams.toString()
        const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`
        window.history.replaceState({}, document.title, newUrl)
      }
    }
  }, [dispatch])

  useEffect(() => {
    updatePageContext({
      page: 'Create New Bill',
      formData: {
        billName: billState.billName,
        category: billState.category,
        notes: billState.notes,
        totalAmount: billState.totalAmount,
        splitType: billState.splitType,
        payer: billState.payer,
        paymentDeadline: billState.paymentDeadline,
        creationDate: billState.creationDate,
      },
      participants: participants,
      items: items,
    })
  }, [billState, participants, items, updatePageContext])

  // Handle form field updates
  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch(updateField({ field, value }))

      // Auto-calculate on totalAmount or splitType change
      if (field === 'totalAmount' || field === 'splitType') {
        // Debounce calculation for totalAmount
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

      // If deleted participant was payer, reset to current user
      if (billState.payer === id) {
        dispatch(updateField({ field: 'payer', value: currentUser?._id || '' }))
      }
      dispatch(calculateAmounts())
    },
    [dispatch, billState.payer, currentUser]
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

  const handleMarkAsPayer = useCallback(
    (id) => {
      dispatch(updateField({ field: 'payer', value: id }))
    },
    [dispatch]
  )

  // Item handlers
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
      // For quantity and amount, validate that it's a valid number after calculation
      if (field === 'quantity' || field === 'amount') {
        const numValue = parseFloat(value)

        // If it's not a valid number or negative, don't update
        if (isNaN(numValue) || numValue < 0) {
          // Allow empty string or intermediate input
          if (value === '' || value === '0') {
            dispatch(updateItem({ id, field, value }))
          }
          return
        }

        // For quantity, ensure it's at least 1
        if (field === 'quantity' && numValue < 1) {
          dispatch(updateItem({ id, field: 'quantity', value: 1 }))
          return
        }
      }

      dispatch(updateItem({ id, field, value }))

      // Calculate on amount or quantity change after short delay
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

  // Get payer name
  const getPayerName = useCallback(() => {
    const payer = participants.find((p) => p.id === billState.payer)
    return payer ? payer.name : 'Chọn người ứng tiền'
  }, [participants, billState.payer])

  // Submit handler
  const handleSubmit = async () => {
    dispatch(setSubmitError(null))

    if (!billState.totalAmount || billState.totalAmount <= 0) {
      dispatch(setSubmitError('Vui lòng nhập số tiền hợp lệ'))
      return
    }

    // Build bill data
    const billData = {
      billName: billState.billName,
      creatorId: currentUser?._id,
      payerId: billState.payer,
      totalAmount: parseFloat(billState.totalAmount),
      creationDate: billState.creationDate,
      paymentDeadline: billState.paymentDeadline,
      description: billState.notes,
      category: billState.category,
      participants: participants.map((p) => String(p.id)),
    }

    // Add split type specific data
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

    // Submit
    const result = await dispatch(submitBillThunk(billData))

    if (submitBillThunk.fulfilled.match(result)) {
      navigate('/history')
    }
  }

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return (
    <Box
      sx={(theme) => ({
        height: '100vh',
        overflow: 'auto',
        backgroundColor: theme.palette.background.default,
      })}
    >
      <Box
        sx={{
          padding: '32px',
          maxWidth: '963px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <IconButton
            sx={(theme) => ({
              width: '36px',
              height: '36px',
              borderRadius: '16px',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            })}
            onClick={handleCancel}
          >
            <ArrowBackIcon sx={{ width: '16px', height: '16px' }} />
          </IconButton>
          <Box>
            <Typography
              sx={(theme) => ({
                fontFamily: "'Nunito Sans', sans-serif",
                lineHeight: '36px',
                color: theme.palette.text.primary,
                marginBottom: '4px',
              })}
              style={{ fontSize: '24px', fontWeight: 'bold' }}
            >
              Tạo hóa đơn mới
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '24px',
                color: theme.palette.text.secondary,
              })}
            >
              Nhập thông tin thủ công
            </Typography>
          </Box>
        </Box>

        {submitError && <FieldErrorAlert message={submitError} />}

        {billDraftWarnings.length > 0 && (
          <Box
            sx={(theme) => ({
              mb: 2,
              p: 2,
              borderRadius: '12px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.12)' : '#FFF8E1',
              border: '1px solid',
              borderColor: 'warning.light',
            })}
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5, color: 'warning.main' }}>Cần kiểm tra lại</Typography>
            {billDraftWarnings.map((warning) => (
              <Typography key={warning} sx={{ fontSize: '14px', color: 'text.secondary' }}>
                {warning}
              </Typography>
            ))}
          </Box>
        )}

        {/* General Information Section */}
        <GeneralInformationSection
          formData={billState}
          onFieldChange={handleFieldChange}
          getPayerName={getPayerName}
          onOpenPayerDialog={() => setOpenPayerDialog(true)}
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
          left: { xs: '0', md: 'var(--sidebar-width, 256px)' },
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
          {isLoading ? 'Đang xử lý...' : 'Lưu hóa đơn'}
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
        onMarkAsPayer={handleMarkAsPayer}
      />

      {/* Select Payer Dialog */}
      <SelectPayerDialog
        open={openPayerDialog}
        onClose={() => setOpenPayerDialog(false)}
        onSelect={(person) => dispatch(updateField({ field: 'payer', value: person.id }))}
        availablePeople={participants}
        isLoading={isLoadingData}
      />
    </Box>
  )
}

export default BillCreate
