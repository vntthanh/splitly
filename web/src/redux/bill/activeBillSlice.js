import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createBillAPI, fetchUsersAPI, fetchGroupsAPI } from '~/apis'

const initialState = {
  // Form data
  billName: '',
  category: 'food',
  notes: '',
  creationDate: new Date().toISOString(),
  paymentDeadline: '',
  payer: null,
  splitType: 'equal',
  totalAmount: 0,

  // Participants
  participants: [],

  // Items for item-based split
  items: [
    {
      id: Date.now(),
      name: '',
      quantity: 1,
      amount: 0,
      allocatedTo: [],
    },
  ],

  // Available users and groups
  availablePeople: [],
  availableGroups: [],
  searchedUsers: [],
  searchedGroups: [],

  // Pagination
  searchPagination: {
    users: { currentPage: 1, totalPages: 1, total: 0, limit: 10 },
    groups: { currentPage: 1, totalPages: 1, total: 0, limit: 10 },
  },
  normalPagination: {
    users: { currentPage: 1, totalPages: 1, total: 0, limit: 10 },
    groups: { currentPage: 1, totalPages: 1, total: 0, limit: 10 },
  },

  // Loading states
  isLoading: false,
  isLoadingData: false,
  isLoadingSearch: false,
  submitError: null,
}

// Async thunks
export const fetchInitialDataThunk = createAsyncThunk('activeBill/fetchInitialData', async (_, { rejectWithValue }) => {
  try {
    const [usersResponse, groupsResponse] = await Promise.all([
      fetchUsersAPI(1, 10, '').catch((err) => {
        console.error('Error fetching users:', err)
        return { users: [], pagination: { currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 } }
      }),
      fetchGroupsAPI(1, 10, '').catch((err) => {
        console.error('Error fetching groups:', err)
        return { groups: [], pagination: { page: 1, totalPages: 1, total: 0, limit: 10 } }
      }),
    ])

    return { usersResponse, groupsResponse }
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const loadMoreDataThunk = createAsyncThunk(
  'activeBill/loadMoreData',
  async ({ page, limit, type }, { rejectWithValue }) => {
    try {
      let usersResponse = null
      let groupsResponse = null

      if (type === 'users' || type === 'both') {
        usersResponse = await fetchUsersAPI(page, limit, '').catch((err) => {
          console.error('Error fetching users:', err)
          return { users: [], pagination: { currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 } }
        })
      }

      if (type === 'groups' || type === 'both') {
        groupsResponse = await fetchGroupsAPI(page, limit, '').catch((err) => {
          console.error('Error fetching groups:', err)
          return { groups: [], pagination: { page: 1, totalPages: 1, total: 0, limit: 10 } }
        })
      }

      return { usersResponse, groupsResponse, type }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// function use to search users and groups
export const searchDataThunk = createAsyncThunk(
  'activeBill/searchData',
  async ({ page, limit, search, type, append = false }, { rejectWithValue }) => {
    try {
      const searchType = type || 'both'
      let usersResponse = null
      let groupsResponse = null

      if (searchType === 'users' || searchType === 'both') {
        usersResponse = await fetchUsersAPI(page, limit, search).catch((err) => {
          console.error('Error fetching users:', err)
          return { users: [], pagination: { currentPage: 1, totalPages: 1, totalUsers: 0, limit } }
        })
      }

      if (searchType === 'groups' || searchType === 'both') {
        groupsResponse = await fetchGroupsAPI(page, limit, search).catch((err) => {
          console.error('Error fetching groups:', err)
          return { groups: [], pagination: { page: 1, totalPages: 1, total: 0, limit } }
        })
      }

      return { usersResponse, groupsResponse, type: searchType, append }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// function use to submit bill
export const submitBillThunk = createAsyncThunk('activeBill/submitBill', async (billData, { rejectWithValue }) => {
  try {
    const response = await createBillAPI(billData)
    return response
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tạo hóa đơn. Vui lòng thử lại.'
    return rejectWithValue(errorMessage)
  }
})

// Redux slice
export const activeBillSlice = createSlice({
  name: 'activeBill',
  initialState,
  reducers: {
    // Form field updates
    updateField: (state, action) => {
      const { field, value } = action.payload
      state[field] = value
    },

    // Participant management
    addParticipants: (state, action) => {
      const newParticipants = action.payload.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        amount: 0,
        usedAmount: 0,
        groups: p.groups || [],
      }))

      const existingIds = state.participants.map((p) => p.id)
      const uniqueParticipants = newParticipants.filter((p) => !existingIds.includes(p.id))

      state.participants = [...state.participants, ...uniqueParticipants]
    },

    removeParticipant: (state, action) => {
      const removedParticipant = state.participants.find((p) => p.id === action.payload)
      state.participants = state.participants.filter((p) => p.id !== action.payload)

      // check if any groups are now incomplete
      if (removedParticipant && removedParticipant.groups && removedParticipant.groups.length > 0) {
        removedParticipant.groups.forEach((groupName) => {
          const group = state.availableGroups.find((g) => g.name === groupName)
          if (group) {
            const allMembersStillPresent = group.members.every(
              (member) => member.id === action.payload || state.participants.some((p) => p.id === member.id)
            )

            if (!allMembersStillPresent) {
              // Remove this group from all remaining participants
              state.participants = state.participants.map((p) => {
                if (p.groups && p.groups.includes(groupName)) {
                  return {
                    ...p,
                    groups: p.groups.filter((g) => g !== groupName),
                  }
                }
                return p
              })
            }
          }
        })
      }
    },

    updateParticipantAmount: (state, action) => {
      const { id, amount } = action.payload
      const participant = state.participants.find((p) => p.id === id)
      if (participant) {
        participant.usedAmount = amount
      }
    },

    // Item management
    addItem: (state, action) => {
      const itemData = action.payload || {}
      state.items.push({
        id: itemData.id || Date.now() + Math.random(), // Ensure unique ID
        name: itemData.name || '',
        quantity: itemData.quantity || 1,
        amount: itemData.amount || 0,
        allocatedTo: itemData.allocatedTo || [],
      })
    },

    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },

    updateItem: (state, action) => {
      const { id, field, value } = action.payload
      const item = state.items.find((item) => item.id === id)
      if (item) {
        item[field] = value
      }
    },

    toggleItemAllocation: (state, action) => {
      const { itemId, participantId } = action.payload
      const item = state.items.find((item) => item.id === itemId)
      if (item) {
        if (item.allocatedTo.includes(participantId)) {
          item.allocatedTo = item.allocatedTo.filter((id) => id !== participantId)
        } else {
          item.allocatedTo.push(participantId)
        }
      }
    },

    // Calculate amounts
    calculateAmounts: (state) => {
      const total = parseFloat(state.totalAmount) || 0

      if (state.splitType === 'equal' && state.participants.length > 0) {
        // Equal split
        const perPerson = total / state.participants.length
        state.participants.forEach((p) => {
          p.amount = perPerson
        })
      } else if (state.splitType === 'by-person') {
        const totalUsed = state.participants.reduce((sum, p) => sum + (parseFloat(p.usedAmount) || 0), 0)
        if (totalUsed > 0 && state.participants.length > 0) {
          // Calculate proportional amounts for each participant
          const proportionalAmounts = state.participants.map((p) => {
            const usedAmount = parseFloat(p.usedAmount) || 0
            return (usedAmount / totalUsed) * total // RULE
          })

          // Apply rounding rules to handle remainder
          const roundedAmounts = []
          let sumRounded = 0

          // Find the payer index (person who will get the remainder)
          const payerIndex = state.participants.findIndex((p) => p.id === state.payer)
          const payerIdx = payerIndex >= 0 ? payerIndex : state.participants.length - 1

          // Round all amounts except the payer
          proportionalAmounts.forEach((amount, index) => {
            if (index !== payerIdx) {
              // Round based on whether total > totalUsed or total < totalUsed
              let rounded
              if (total >= totalUsed) {
                // Round up for amounts when total is greater
                rounded = Math.ceil(amount)
              } else {
                // Round down for amounts when total is less
                rounded = Math.floor(amount)
              }
              roundedAmounts.push(rounded)
              sumRounded += rounded
            } else {
              roundedAmounts.push(null) // Placeholder for payer
            }
          })

          // Payer gets the remainder (ensure non-negative)
          const payerAmount = Math.max(0, total - sumRounded)
          roundedAmounts[payerIdx] = payerAmount

          state.participants.forEach((p, index) => {
            p.amount = roundedAmounts[index]
          })
        }
      } else if (state.splitType === 'by-item') {
        const participantUsedAmounts = {}
        state.participants.forEach((p) => {
          participantUsedAmounts[p.id] = 0
        })

        state.items.forEach((item) => {
          const quantity = parseFloat(item.quantity) || 0
          const unitPrice = parseFloat(item.amount) || 0
          const itemTotalAmount = quantity * unitPrice
          const allocatedCount = item.allocatedTo.length
          if (allocatedCount > 0) {
            const perPerson = itemTotalAmount / allocatedCount
            item.allocatedTo.forEach((participantId) => {
              if (participantUsedAmounts[participantId] !== undefined) {
                participantUsedAmounts[participantId] += perPerson
              }
            })
          }
        })

        // Calculate total used amount from items
        const totalUsedFromItems = Object.values(participantUsedAmounts).reduce((sum, amount) => sum + amount, 0)

        if (totalUsedFromItems > 0 && state.participants.length > 0) {
          // Calculate proportional amounts
          const proportionalAmounts = state.participants.map((p) => {
            const usedAmount = participantUsedAmounts[p.id] || 0
            return (usedAmount / totalUsedFromItems) * total
          })

          // Apply rounding rules
          const roundedAmounts = []
          let sumRounded = 0

          // Find the payer index (person who will get the remainder)
          const payerIndex = state.participants.findIndex((p) => p.id === state.payer)
          const payerIdx = payerIndex >= 0 ? payerIndex : 0

          // Round all amounts except the payer
          proportionalAmounts.forEach((amount, index) => {
            if (index !== payerIdx) {
              // Round based on whether total > totalUsedFromItems or total < totalUsedFromItems
              let rounded
              if (total >= totalUsedFromItems) {
                // Round up when total is greater
                rounded = Math.ceil(amount)
              } else {
                // Round down when total is less
                rounded = Math.floor(amount)
              }
              roundedAmounts.push(rounded)
              sumRounded += rounded
            } else {
              roundedAmounts.push(null)
            }
          })

          // Payer gets the remainder (ensure non-negative)
          const payerAmount = Math.max(0, total - sumRounded)
          roundedAmounts[payerIdx] = payerAmount

          // Assign rounded amounts to participants
          state.participants.forEach((p, index) => {
            p.amount = roundedAmounts[index]
          })
        } else {
          // If no items allocated, set all amounts to 0
          state.participants.forEach((p) => {
            p.amount = 0
          })
        }
      }
    },

    // Reset bill
    resetBill: (state) => {
      Object.assign(state, initialState)
      state.creationDate = new Date().toISOString()
      state.items = [
        {
          id: Date.now(),
          name: '',
          quantity: 1,
          amount: 0,
          allocatedTo: [],
        },
      ]
    },

    initializeBill: (state, action) => {
      const { currentUserId } = action.payload
      state.payer = currentUserId
      state.participants = [
        {
          id: currentUserId,
          name: action.payload.currentUserName || '',
          email: action.payload.currentUserEmail || '',
          amount: 0,
          usedAmount: 0,
        },
      ]
    },

    // Replace the editable bill fields with an AI-generated draft. This never submits a bill.
    hydrateBillDraft: (state, action) => {
      const draft = action.payload

      state.billName = draft.billName || ''
      state.category = draft.category || 'food'
      state.notes = draft.notes || ''
      state.creationDate = draft.creationDate || new Date().toISOString()
      state.paymentDeadline = draft.paymentDeadline || ''
      state.payer = draft.payer || null
      state.splitType = draft.splitType || 'equal'
      state.totalAmount = Number(draft.totalAmount) || 0
      state.participants = (draft.participants || []).map((participant) => ({
        id: participant.id || participant._id,
        name: participant.name || '',
        email: participant.email || '',
        amount: Number(participant.amount) || 0,
        usedAmount: Number(participant.usedAmount) || 0,
        groups: participant.groups || [],
      }))
      state.items =
        draft.splitType === 'by-item' && draft.items?.length
          ? draft.items.map((item) => ({
              id: item.id || `${Date.now()}-${Math.random()}`,
              name: item.name || '',
              quantity: Number(item.quantity) || 1,
              amount: Number(item.unitPrice ?? item.amount) || 0,
              allocatedTo: item.allocatedTo || [],
            }))
          : [
              {
                id: Date.now(),
                name: '',
                quantity: 1,
                amount: 0,
                allocatedTo: [],
              },
            ]
    },

    setSubmitError: (state, action) => {
      state.submitError = action.payload
    },
  },

  extraReducers: (builder) => {
    // Fetch initial data
    builder.addCase(fetchInitialDataThunk.pending, (state) => {
      state.isLoadingData = true
    })
    builder.addCase(fetchInitialDataThunk.fulfilled, (state, action) => {
      const { usersResponse, groupsResponse } = action.payload

      // Transform users
      state.availablePeople = usersResponse.users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        userType: user.userType,
        isGuest: user.isGuest,
      }))

      // Transform groups
      state.availableGroups = groupsResponse.groups.map((group) => ({
        id: group._id,
        name: group.groupName || group.name,
        members: (group.members || []).map((member) => ({
          id: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          userType: member.userType,
          isGuest: member.isGuest,
        })),
      }))

      // Update pagination
      state.normalPagination.users = {
        currentPage: usersResponse.pagination.currentPage || usersResponse.pagination.page || 1,
        totalPages: usersResponse.pagination.totalPages || 1,
        total: usersResponse.pagination.totalUsers || usersResponse.pagination.total || 0,
        limit: usersResponse.pagination.limit || 10,
      }

      state.normalPagination.groups = {
        currentPage: groupsResponse.pagination.page || groupsResponse.pagination.currentPage || 1,
        totalPages: groupsResponse.pagination.totalPages || 1,
        total: groupsResponse.pagination.total || groupsResponse.pagination.totalGroups || 0,
        limit: groupsResponse.pagination.limit || 10,
      }

      state.isLoadingData = false
    })
    builder.addCase(fetchInitialDataThunk.rejected, (state, action) => {
      state.isLoadingData = false
      state.submitError = action.payload || 'Không thể tải danh sách nhóm và thành viên'
    })

    // Load more data
    builder.addCase(loadMoreDataThunk.fulfilled, (state, action) => {
      const { usersResponse, groupsResponse, type } = action.payload

      if (usersResponse && (type === 'users' || type === 'both')) {
        const transformedUsers = usersResponse.users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          userType: user.userType,
          isGuest: user.isGuest,
        }))
        state.availablePeople = [...state.availablePeople, ...transformedUsers]
        state.normalPagination.users = {
          currentPage: usersResponse.pagination.currentPage || usersResponse.pagination.page || 1,
          totalPages: usersResponse.pagination.totalPages || 1,
          total: usersResponse.pagination.totalUsers || usersResponse.pagination.total || 0,
          limit: usersResponse.pagination.limit || 10,
        }
      }

      if (groupsResponse && (type === 'groups' || type === 'both')) {
        const transformedGroups = groupsResponse.groups.map((group) => ({
          id: group._id,
          name: group.groupName || group.name,
          members: (group.members || []).map((member) => ({
            id: member._id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            userType: member.userType,
            isGuest: member.isGuest,
          })),
        }))
        state.availableGroups = [...state.availableGroups, ...transformedGroups]
        state.normalPagination.groups = {
          currentPage: groupsResponse.pagination.page || groupsResponse.pagination.currentPage || 1,
          totalPages: groupsResponse.pagination.totalPages || 1,
          total: groupsResponse.pagination.total || groupsResponse.pagination.totalGroups || 0,
          limit: groupsResponse.pagination.limit || 10,
        }
      }
    })

    // Search data
    builder.addCase(searchDataThunk.pending, (state) => {
      state.isLoadingSearch = true
    })
    builder.addCase(searchDataThunk.fulfilled, (state, action) => {
      const { usersResponse, groupsResponse, type, append } = action.payload

      if (usersResponse && (type === 'users' || type === 'both')) {
        const transformedUsers = usersResponse.users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          userType: user.userType,
          isGuest: user.isGuest,
        }))
        // Append to existing results if append is true, otherwise replace
        state.searchedUsers = append ? [...state.searchedUsers, ...transformedUsers] : transformedUsers
        state.searchPagination.users = {
          currentPage: usersResponse.pagination.currentPage || usersResponse.pagination.page || 1,
          totalPages: usersResponse.pagination.totalPages || 1,
          total: usersResponse.pagination.totalUsers || usersResponse.pagination.total || 0,
          limit: usersResponse.pagination.limit || 10,
        }
      }

      if (groupsResponse && (type === 'groups' || type === 'both')) {
        const transformedGroups = groupsResponse.groups.map((group) => ({
          id: group._id,
          name: group.groupName || group.name,
          members: (group.members || []).map((member) => ({
            id: member._id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            userType: member.userType,
            isGuest: member.isGuest,
          })),
        }))
        // Append to existing results if append is true, otherwise replace
        state.searchedGroups = append ? [...state.searchedGroups, ...transformedGroups] : transformedGroups
        state.searchPagination.groups = {
          currentPage: groupsResponse.pagination.page || groupsResponse.pagination.currentPage || 1,
          totalPages: groupsResponse.pagination.totalPages || 1,
          total: groupsResponse.pagination.total || groupsResponse.pagination.totalGroups || 0,
          limit: groupsResponse.pagination.limit || 10,
        }
      }

      state.isLoadingSearch = false
    })
    builder.addCase(searchDataThunk.rejected, (state) => {
      state.isLoadingSearch = false
    })

    // Submit bill
    builder.addCase(submitBillThunk.pending, (state) => {
      state.isLoading = true
      state.submitError = null
    })
    builder.addCase(submitBillThunk.fulfilled, (state) => {
      state.isLoading = false
      // Reset will be handled in the component after navigation
    })
    builder.addCase(submitBillThunk.rejected, (state, action) => {
      state.isLoading = false
      state.submitError = action.payload
    })
  },
})

export const {
  updateField,
  addParticipants,
  removeParticipant,
  updateParticipantAmount,
  addItem,
  removeItem,
  updateItem,
  toggleItemAllocation,
  calculateAmounts,
  resetBill,
  initializeBill,
  hydrateBillDraft,
  setSubmitError,
} = activeBillSlice.actions

// Selectors
export const selectActiveBill = (state) => state.activeBill
export const selectParticipants = (state) => state.activeBill.participants
export const selectItems = (state) => state.activeBill.items
export const selectAvailablePeople = (state) => state.activeBill.availablePeople
export const selectAvailableGroups = (state) => state.activeBill.availableGroups
export const selectSearchedUsers = (state) => state.activeBill.searchedUsers
export const selectSearchedGroups = (state) => state.activeBill.searchedGroups
export const selectIsLoading = (state) => state.activeBill.isLoading
export const selectIsLoadingData = (state) => state.activeBill.isLoadingData
export const selectIsLoadingSearch = (state) => state.activeBill.isLoadingSearch
export const selectSubmitError = (state) => state.activeBill.submitError

export const activeBillReducer = activeBillSlice.reducer
