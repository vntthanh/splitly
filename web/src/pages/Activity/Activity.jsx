import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, Chip, CircularProgress, Container, Divider, Stack, Typography } from '@mui/material'
import {
  AddCircleOutline as AddIcon,
  CheckCircleOutline as CheckIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  GroupOutlined as GroupIcon,
  NotificationsActiveOutlined as ReminderIcon,
  PaidOutlined as PaidIcon,
  PersonAddAltOutlined as PersonAddIcon,
  PersonRemoveOutlined as PersonRemoveIcon,
  Refresh as RefreshIcon,
  ReceiptLongOutlined as ReceiptIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import Layout from '~/components/Layout'
import { fetchActivitiesAPI } from '~/apis'

const PAGE_SIZE = 20
const categories = {
  bill: ['bill_created', 'bill_updated', 'bill_deleted', 'bill_paid', 'bill_settled', 'bill_reminder_sent', 'bill_user_opted_out', 'bill_participation_declined'],
  payment: ['payment_initiated', 'payment_confirmation_requested', 'payment_confirmed', 'payment_rejected', 'debt_balanced'],
  group: ['group_created', 'group_updated', 'group_deleted', 'group_member_added', 'group_member_removed', 'group_bill_added'],
}
const config = {
  bill_created: [AddIcon, '#7E57C2', 'Created bill'], bill_updated: [EditIcon, '#FB8C00', 'Updated bill'],
  bill_deleted: [DeleteIcon, '#E53935', 'Deleted bill', true], bill_paid: [PaidIcon, '#43A047', 'Recorded payment'],
  bill_settled: [CheckIcon, '#43A047', 'Settled bill'], bill_reminder_sent: [ReminderIcon, '#EF6C00', 'Sent payment reminder'],
  bill_user_opted_out: [PersonRemoveIcon, '#E53935', 'Opted out of bill'],
  bill_participation_declined: [PersonRemoveIcon, '#E53935', 'Declined bill participation'], payment_initiated: [PaidIcon, '#1E88E5', 'Initiated payment'],
  payment_confirmation_requested: [ReminderIcon, '#1E88E5', 'Payment confirmation needed'],
  payment_confirmed: [CheckIcon, '#43A047', 'Confirmed payment'], payment_rejected: [DeleteIcon, '#E53935', 'Rejected payment'],
  debt_balanced: [PaidIcon, '#00897B', 'Balanced debts'], group_created: [GroupIcon, '#8E24AA', 'Created group'],
  group_updated: [EditIcon, '#8E24AA', 'Updated group'], group_deleted: [DeleteIcon, '#E53935', 'Deleted group', true],
  group_member_added: [PersonAddIcon, '#00ACC1', 'Added group member'], group_member_removed: [PersonRemoveIcon, '#EF6C00', 'Removed group member'],
  group_bill_added: [ReceiptIcon, '#43A047', 'Added bill to group'],
}

const describe = (activity) => {
  const { details = {}, activityType } = activity
  if (details.description) return details.description
    const bill = details.billName ? `"${details.billName}"` : 'a bill'
    const group = details.groupName ? `"${details.groupName}"` : 'a group'
  const amount = details.amountPaid ?? details.amount
    const money = Number.isFinite(amount) ? ` (${amount.toLocaleString('vi-VN')} VND)` : ''
  const descriptions = {
    bill_created: `Created ${bill}`, bill_updated: `Updated ${bill}`, bill_deleted: `Deleted ${bill}`,
    bill_paid: `Recorded a payment for ${bill}${money}`, bill_settled: `Settled ${bill}`,
    bill_reminder_sent: `Sent a payment reminder for ${bill}`, bill_user_opted_out: `Opted out of ${bill}`,
    payment_initiated: `Initiated a payment${money}`,
    payment_confirmation_requested: `${details.debtorName || 'A participant'} reported paying${money}. Your confirmation is pending.`,
    payment_confirmed: `Confirmed a payment${money}`,
    payment_rejected: `Rejected a payment${money}`, debt_balanced: 'Balanced debts', group_created: `Created ${group}`,
    group_updated: `Updated ${group}`, group_deleted: `Deleted ${group}`, group_member_added: `Added a member to ${group}`,
    group_member_removed: `Removed a member from ${group}`, group_bill_added: `Added ${bill} to ${group}`,
  }
  return descriptions[activityType] || 'Recorded an activity'
}

const ActivityCard = ({ activity }) => {
  const navigate = useNavigate()
  const [Icon = TimelineIcon, color = '#757575', title = 'Activity', deleted] = config[activity.activityType] || []
  const paymentBillId = activity.details?.billId || activity.details?.priorityBill ||
    (activity.resourceType === 'bill' && activity.resourceId !== activity.details?.paymentId ? activity.resourceId : null)
  const isPaymentActivity = categories.payment.includes(activity.activityType)
  const isConfirmationRequest = activity.activityType === 'payment_confirmation_requested'
  const canNavigate = !deleted && (paymentBillId || (!isPaymentActivity && activity.resourceId && ['bill', 'group'].includes(activity.resourceType)))
  const destination = paymentBillId
    ? `/bills/${paymentBillId}${isConfirmationRequest ? `?confirmPayment=1&debtorId=${activity.details?.debtorId || activity.resourceId}` : ''}`
    : activity.resourceType === 'bill' ? `/bills/${activity.resourceId}` : `/groups/${activity.resourceId}`
  return <Card onClick={() => canNavigate && navigate(destination)} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', cursor: canNavigate ? 'pointer' : 'default', '&:hover': canNavigate ? { borderColor: 'primary.main', boxShadow: 1 } : undefined }}>
    <Stack direction="row" spacing={2} sx={{ p: 2.25, alignItems: 'flex-start' }}>
      <Box sx={{ color, bgcolor: `${color}14`, borderRadius: '50%', display: 'grid', height: 40, placeItems: 'center', width: 40 }}><Icon fontSize="small" /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" spacing={2}><Typography fontWeight={700}>{title}</Typography><Typography color="text.secondary" sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(activity.createdAt))}</Typography></Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{describe(activity)}</Typography>
      </Box>
    </Stack>
  </Card>
}

export default function Activity() {
  const [activities, setActivities] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const types = useMemo(() => category === 'all' ? undefined : categories[category], [category])
  const load = useCallback(async (offset = 0) => {
    offset ? setLoadingMore(true) : setLoading(true)
    setError('')
    try {
      const response = await fetchActivitiesAPI({ limit: PAGE_SIZE, offset, types })
      const next = Array.isArray(response.activities) ? response.activities : []
      setActivities((current) => offset ? [...current, ...next] : next)
      setTotal(response.total || 0)
      setHasMore(Boolean(response.hasMore))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load activity history. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [types])
  useEffect(() => { load() }, [load])
  const groups = useMemo(() => {
    const result = new Map()
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt).toISOString().slice(0, 10)
      result.set(date, [...(result.get(date) || []), activity])
    })
    return [...result.entries()]
  }, [activities])

  return <Layout><Container maxWidth="md"><Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}><Box><Typography variant="h4" fontWeight={800}>{'Ho\u1ea1t \u0111\u1ed9ng'}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{'L\u1ecbch s\u1eed c\u00e1c thay \u0111\u1ed5i quan tr\u1ecdng trong t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n.'}</Typography></Box><Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load()} disabled={loading}>{'L\u00e0m m\u1edbi'}</Button></Stack>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>{[['all', 'T\u1ea5t c\u1ea3'], ['bill', 'H\u00f3a \u0111\u01a1n'], ['payment', 'Thanh to\u00e1n'], ['group', 'Nh\u00f3m']].map(([value, label]) => <Chip key={value} label={label} onClick={() => setCategory(value)} color={category === value ? 'primary' : 'default'} variant={category === value ? 'filled' : 'outlined'} />)}</Stack>
    {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => load()}>{'Th\u1eed l\u1ea1i'}</Button>} sx={{ mb: 3 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: 'grid', minHeight: 240, placeItems: 'center' }}><CircularProgress /></Box> : groups.length ? <Stack spacing={3}>{groups.map(([date, entries]) => <Box key={date}><Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}><Typography color="text.secondary" fontSize={13} fontWeight={700}>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`))}</Typography><Divider sx={{ flex: 1 }} /></Stack><Stack spacing={1.25}>{entries.map((activity) => <ActivityCard key={activity._id} activity={activity} />)}</Stack></Box>)}{hasMore && <Box textAlign="center"><Button onClick={() => load(activities.length)} disabled={loadingMore}>{loadingMore ? <CircularProgress size={20} /> : `T\u1ea3i th\u00eam (${Math.max(0, total - activities.length)})`}</Button></Box>}</Stack> : <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 3, p: 6, textAlign: 'center' }}><TimelineIcon color="disabled" sx={{ fontSize: 40 }} /><Typography fontWeight={700} sx={{ mt: 1 }}>{'Ch\u01b0a c\u00f3 ho\u1ea1t \u0111\u1ed9ng'}</Typography><Typography color="text.secondary">{'C\u00e1c thay \u0111\u1ed5i quan tr\u1ecdng s\u1ebd xu\u1ea5t hi\u1ec7n \u1edf \u0111\u00e2y.'}</Typography></Box>}
  </Box></Container></Layout>
}