import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, updateUserProfileAPI, refreshCurrentUserAPI } from '~/redux/user/userSlice'
import { toast } from 'react-toastify'
import { fetchBankListAPI } from '~/apis'
import Container from '@mui/material/Container'

// Layout
import Layout from '~/components/Layout'
import { Typography, IconButton, Autocomplete, TextField } from '@mui/material'
import { Box, Avatar } from '@mui/material'
import { Phone, Wallet, AccountBalance, Person, Create, Lock, Visibility, VisibilityOff } from '@mui/icons-material'

function Profile() {
  const hoverGradient = 'linear-gradient(135deg, #EF9A9A 0%, #CE93D8 100%)'
  const dispatch = useDispatch()
  const userFromStore = useSelector(selectCurrentUser)
  console.log(userFromStore);
  const [currentUser, setCurrentUser] = useState(userFromStore)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: userFromStore?.name || '',
    phone: userFromStore?.phone || '',
    bankAccount: userFromStore?.bankAccount || '',
    bankName: userFromStore?.bankName || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [bankList, setBankList] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)

  // Refresh user data on component mount to get latest fields (bankName, bankAccount, etc.)
  useEffect(() => {
    if (userFromStore?._id) {
      dispatch(refreshCurrentUserAPI(userFromStore._id))
    }
  }, [dispatch, userFromStore?._id])

  // Fetch bank list on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetchBankListAPI()
        if (response.code === '00' && response.data) {
          setBankList(response.data)
          // Set selected bank based on user's current bankName (which stores the code)
          if (userFromStore?.bankName) {
            const userBank = response.data.find((bank) => bank.code === userFromStore.bankName)
            setSelectedBank(userBank || null)
          }
        }
      } catch (error) {
        console.error('Error fetching bank list:', error)
      }
    }
    fetchBanks()
  }, [userFromStore?.bankName])

  useEffect(() => {
    setCurrentUser(userFromStore)
    setFormData({
      name: userFromStore?.name || '',
      phone: userFromStore?.phone || '',
      bankAccount: userFromStore?.bankAccount || '',
      bankName: userFromStore?.bankName || '',
    })
    // Update selected bank when user data changes
    if (userFromStore?.bankName && bankList.length > 0) {
      const userBank = bankList.find((bank) => bank.code === userFromStore.bankName)
      setSelectedBank(userBank || null)
    }
  }, [userFromStore, dispatch, bankList])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      bankAccount: currentUser?.bankAccount || '',
      bankName: currentUser?.bankName || '',
    })
    // Reset selected bank to current user's bank
    if (currentUser?.bankName && bankList.length > 0) {
      const userBank = bankList.find((bank) => bank.code === currentUser.bankName)
      setSelectedBank(userBank || null)
    } else {
      setSelectedBank(null)
    }
  }

  const handlePasswordCancel = () => {
    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
    })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
  }

  const handlePasswordInputChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validatePhone = (phone) => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
  }

  const validatePassword = (password) => {
    if (!password) return true // Password is optional when not changing
    // At least 8 characters, 1 lowercase, 1 uppercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,256}$/
    return passwordRegex.test(password)
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Họ tên không được để trống')
        return
      }

      // Validate phone number
      if (formData.phone && !validatePhone(formData.phone)) {
        toast.error('Số điện thoại phải có 10-11 chữ số')
        return
      }

      // Call API to update user profile
      const result = await dispatch(
        updateUserProfileAPI({
          profileData: formData,
        })
      ).unwrap()
      console.log(result)

      setIsEditing(false)
      toast.success('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const handlePasswordSave = async () => {
    try {
      // Validate password fields
      if (!passwordData.currentPassword) {
        toast.error('Vui lòng nhập mật khẩu hiện tại')
        return
      }

      if (!passwordData.newPassword) {
        toast.error('Vui lòng nhập mật khẩu mới')
        return
      }

      if (!validatePassword(passwordData.newPassword)) {
        toast.error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
        return
      }

      // Call API to update password
      const result = await dispatch(
        updateUserProfileAPI({
          profileData: {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          },
        })
      ).unwrap()
      console.log(result)

      handlePasswordCancel()
      toast.success('Đổi mật khẩu thành công!')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  return (
    <Layout>
      <Box
        sx={{
          padding: '32px',
          width: '100%',
          margin: '0 auto',
          height: '100%',
        }}
        className="bg-gray-50"
      >
        <Container maxWidth="lg">
          <Box className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Hồ sơ cá nhân</h1>
            <Typography className="text-sm sm:text-base text-gray-500">Quản lý thông tin cá nhân của bạn</Typography>
          </Box>

          <Box className="mb-6 bg-white rounded-2xl shadow-sm p-4 md:p-6">
            <Box className="flex flex-col items-center justify-center">
              <Avatar
                sx={{
                  width: { sm: 32, md: 64 },
                  height: { sm: 32, md: 64 },
                  background: hoverGradient,
                  fontSize: { sm: '1.25rem', md: '1.5rem' },
                  fontWeight: 700,
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
              <div className="text-[1.25rem] md:text-[1.5rem] font-bold">{currentUser?.name}</div>
              <div className="text-base md:text-lg text-gray-700">{currentUser?.email}</div>
            </Box>
          </Box>

          <Box className="mb-6 bg-white rounded-2xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base">Thông tin chi tiết</h3>
              {!isEditing && (
                <button onClick={handleEdit} className="flex gap-1 items-center font-bold">
                  <Create sx={{ color: 'black', width: 18, height: 18 }} />
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Họ tên */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <Person sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                  <p className="text-gray-500">Họ tên</p>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="p-2 border border-gray-200 rounded-4xl shadow-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={!isEditing}
                />
              </div>

              {/* Số điện thoại */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <Phone sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                  <p className="text-gray-500">Số điện thoại</p>
                </div>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="p-2 border border-gray-200 rounded-4xl shadow-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={!isEditing}
                />
              </div>

              {/* Số tài khoản */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <Wallet sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                  <p className="text-gray-500">Số tài khoản</p>
                </div>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  className="p-2 border border-gray-200 rounded-4xl shadow-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <AccountBalance sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                  <p className="text-gray-500">Ngân hàng</p>
                </div>
                <Autocomplete
                  disabled={!isEditing}
                  options={bankList}
                  value={selectedBank}
                  onChange={(_, newValue) => {
                    setSelectedBank(newValue)
                    handleInputChange('bankName', newValue?.code || '')
                  }}
                  getOptionLabel={(option) => option.shortName || ''}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props
                    return (
                      <Box
                        key={key}
                        component="li"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        {...otherProps}
                      >
                        <img loading="lazy" width="24" src={option.logo} alt={option.shortName} />
                        <span>{option.shortName}</span>
                      </Box>
                    )
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Chọn ngân hàng"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9999px',
                          backgroundColor: !isEditing ? '#f9fafb' : 'white',
                          '& fieldset': {
                            borderColor: '#e5e7eb',
                          },
                          '&:hover fieldset': {
                            borderColor: !isEditing ? '#e5e7eb' : '#60a5fa',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#60a5fa',
                          },
                        },
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.code === value?.code}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-lg font-bold text-white transition-all hover:shadow-lg"
                  style={{ background: hoverGradient }}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </Box>

          {/* Password Change Section */}
          <Box className="mb-6 bg-white rounded-2xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base">Bảo mật</h3>
              {!isChangingPassword && (
                <button onClick={() => setIsChangingPassword(true)} className="flex gap-1 items-center font-bold">
                  <Create sx={{ color: 'black', width: 18, height: 18 }} />
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {!isChangingPassword ? (
              <div className="flex items-center gap-3 text-gray-500">
                <Lock sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                <span>••••••••</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Password */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1 items-center">
                      <Lock sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                      <p className="text-gray-500">Mật khẩu hiện tại</p>
                    </div>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        className="w-full p-2 pr-10 border border-gray-200 rounded-4xl shadow-sm outline-none focus:border-blue-400"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                        size="small"
                      >
                        {showCurrentPassword ? (
                          <VisibilityOff sx={{ width: 20, height: 20 }} />
                        ) : (
                          <Visibility sx={{ width: 20, height: 20 }} />
                        )}
                      </IconButton>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1 items-center">
                      <Lock sx={{ color: '#9E9E9E', width: 24, height: 24 }} />
                      <p className="text-gray-500">Mật khẩu mới</p>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        className="w-full p-2 pr-10 border border-gray-200 rounded-4xl shadow-sm outline-none focus:border-blue-400"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                        size="small"
                      >
                        {showNewPassword ? (
                          <VisibilityOff sx={{ width: 20, height: 20 }} />
                        ) : (
                          <Visibility sx={{ width: 20, height: 20 }} />
                        )}
                      </IconButton>
                    </div>
                    <p className="text-xs text-gray-400">
                      Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
                    </p>
                  </div>
                </div>

                {/* Password Action Buttons */}
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePasswordCancel}
                    className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handlePasswordSave}
                    className="px-6 py-2 rounded-lg font-bold text-white transition-all hover:shadow-lg"
                    style={{ background: hoverGradient }}
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </>
            )}
          </Box>
        </Container>
      </Box>
    </Layout>
  )
}

export default Profile
