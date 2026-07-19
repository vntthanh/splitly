import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from './redux/user/userSlice'
import {
  Auth,
  AccountVerification,
  Profile,
  Dashboard,
  Landing,
  Bills,
  Ocr,
  BillDetail,
  BillEdit,
  OptOut,
  Group,
  GroupDetails,
  Board,
  Debt,
  Payment,
  PaymentSuccess,
  PaymentConfirmation,
  History,
  Activity,
  Report,
  NotFound,
} from './utils/LazyComponents'

const ProtectedRoute = ({ user }) => {
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  const currentUser = useSelector(selectCurrentUser)

  return (
    <Routes>
      <Route element={<ProtectedRoute user={currentUser} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/groups" element={<Group />} />
        <Route path="/groups/:groupId" element={<GroupDetails />} />
        <Route path="/history" element={<History />} />
        <Route path="/debt" element={<Debt />} />
        <Route path="/boards/:boardId" element={<Board />} />
        <Route path="/create" element={<Bills />} />
        <Route path="/ocr" element={<Ocr />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/bills/:billId" element={<BillDetail />} />
        <Route path="/bills/:billId/edit" element={<BillEdit />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reports" element={<Report />} />
      </Route>

      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/account/verification" element={<AccountVerification />} />

      <Route path="/payment/confirm" element={<PaymentConfirmation />} />
      <Route path="/payment/pay" element={<Payment />} />
      <Route path="/payment/pay/success" element={<PaymentSuccess />} />
      <Route path="/bill/opt-out" element={<OptOut />} />

      <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App