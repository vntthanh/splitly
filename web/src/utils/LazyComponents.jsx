import React, { Suspense, lazy } from 'react'
import LoadingSpinner from '../components/Loading/LoadingSpinner'
import { lazyMetrics } from './performanceMetrics'

/**
 * Enhanced lazy loading wrapper with error boundary and loading states
 * @param {React.ComponentType} Component - The lazy-loaded component
 * @param {string} loadingMessage - Custom loading message
 * @param {string} componentName - Component name for performance tracking
 * @returns {React.ComponentType} - Wrapped component with enhanced loading
 */
const Loadable = (Component, loadingMessage = 'Đang tải...', componentName = 'UnknownComponent') => {
  const WrappedComponent = (props) => {
    // Start performance tracking when component starts loading
    // lazyMetrics.startTracking(componentName)

    return (
      <Suspense
        fallback={
          <LoadingSpinner
            caption={loadingMessage}
            containerStyle={{
              minHeight: '60vh',
              flexDirection: 'column',
            }}
          />
        }
      >
        <ComponentWithTracking Component={Component} componentName={componentName} {...props} />
      </Suspense>
    )
  }

  WrappedComponent.displayName = `Loadable(${Component.name || componentName})`
  return WrappedComponent
}

/**
 * Wrapper component to track when lazy component finishes loading
 */
const ComponentWithTracking = ({ Component, componentName, ...props }) => {
  // End performance tracking when component is rendered
  React.useEffect(() => {
    lazyMetrics.endTracking(componentName)
  }, [componentName])

  return <Component {...props} />
}

// ======================
// AUTHENTICATION PAGES
// ======================
export const Auth = Loadable(
  lazy(() => import('../pages/Auth/Auth')),
  'Đang tải trang đăng nhập...',
  'Auth'
)

export const AccountVerification = Loadable(
  lazy(() => import('../pages/Auth/AccountVerification')),
  'Đang xác thực tài khoản...',
  'AccountVerification'
)

export const Profile = Loadable(
  lazy(() => import('../pages/Auth/Profile')),
  'Đang tải hồ sơ...',
  'Profile'
)

// ======================
// MAIN DASHBOARD PAGES
// ======================
export const Dashboard = Loadable(
  lazy(() => import('../pages/Dashboard')),
  'Đang tải bảng điều khiển...',
  'Dashboard'
)

export const Landing = Loadable(
  lazy(() => import('../pages/Landing/Landing')),
  'Đang tải trang chủ...',
  'Landing'
)

// ======================
// BILL MANAGEMENT
// ======================
export const Bills = Loadable(
  lazy(() => import('../pages/Bills').then((module) => ({ default: module.Bills }))),
  'Đang tải trang tạo hóa đơn...',
  'Bills'
)

export const Ocr = Loadable(
  lazy(() => import('../pages/Bills').then((module) => ({ default: module.Ocr }))),
  'Đang tải tính năng quét hóa đơn...',
  'Ocr'
)

export const BillDetail = Loadable(
  lazy(() => import('../pages/Bills/BillDetail')),
  'Đang tải chi tiết hóa đơn...',
  'BillDetail'
)

export const BillEdit = Loadable(
  lazy(() => import('../pages/Bills/BillEdit')),
  'Đang tải trang chỉnh sửa hóa đơn...',
  'BillEdit'
)
export const OptOut = Loadable(
  lazy(() => import('../pages/Bills/OptOut')),
  'Đang xử lý yêu cầu...',
  'OptOut'
)

// ======================
// GROUP MANAGEMENT
// ======================
export const Group = Loadable(
  lazy(() => import('../pages/Groups/Group')),
  'Đang tải danh sách nhóm...',
  'Group'
)

export const GroupDetails = Loadable(
  lazy(() => import('../pages/Groups/GroupDetails')),
  'Đang tải chi tiết nhóm...',
  'GroupDetails'
)

// ======================
// BOARD MANAGEMENT
// ======================
export const Board = Loadable(
  lazy(() => import('../pages/Boards/_id')),
  'Đang tải bảng nhóm...',
  'Board'
)

// ======================
// FINANCIAL FEATURES
// ======================
export const Debt = Loadable(
  lazy(() => import('../pages/Debt')),
  'Đang tải danh sách nợ...',
  'Debt'
)

export const Payment = Loadable(
  lazy(() => import('../pages/Payment/Payment')),
  'Đang tải trang thanh toán...',
  'Payment'
)

export const PaymentSuccess = Loadable(
  lazy(() => import('../pages/Payment/PaymentSuccess')),
  'Đang xác nhận thanh toán...',
  'PaymentSuccess'
)

export const PaymentConfirmation = Loadable(
  lazy(() => import('../pages/PaymentConfirmation/PaymentConfirmation')),
  'Đang xác nhận thanh toán...',
  'PaymentConfirmation'
)

// ======================
// TRACKING & ANALYTICS
// ======================
export const History = Loadable(
  lazy(() => import('../pages/History')),
  'Đang tải lịch sử giao dịch...',
  'History'
)

export const Activity = Loadable(
  lazy(() => import('../pages/Activity/Activity')),
  'Đang tải hoạt động gần đây...',
  'Activity'
)

export const Report = Loadable(
  lazy(() => import('../pages/Report/Report')),
  'Đang tải báo cáo...',
  'Report'
)

// ======================
// ERROR & UTILITY PAGES
// ======================
export const NotFound = Loadable(
  lazy(() => import('../pages/404/NotFound')),
  'Đang tải trang...',
  'NotFound'
)

export default Loadable
