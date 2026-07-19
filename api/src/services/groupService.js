/* eslint-disable no-useless-catch */
import { groupModel } from '~/models/groupModel.js'
import { activityModel } from '~/models/activityModel.js'
import { notificationService } from '~/services/notificationService.js'
import { userModel } from '~/models/userModel.js'
import ApiError from '~/utils/APIError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { pickUser } from '~/utils/formatters'

const getAudienceUserIds = (userIds = [], actorId) => [...new Set(
  userIds.filter(Boolean).map((userId) => userId.toString()).filter((userId) => userId !== actorId?.toString())
)]

/**
 * Create a new group with activity logging
 * @param {Object} reqBody - Group data
 * @param {string} creatorId - Creator user ID
 * @returns {Promise<Object>} Created group
 */
const createNew = async (creatorId, reqBody) => {
  try {
    // Ensure creator is in members list
    const members = reqBody.members || []
    if (!members.includes(creatorId)) {
      members.push(creatorId)
    }
    const creatorObjectId = new ObjectId(creatorId)
    const memberObjectIds = members.map((memberId) => new ObjectId(memberId))

    const groupData = {
      ...reqBody,
      creatorId: creatorObjectId,
      members: memberObjectIds,
      createdAt: Date.now(),
    }

    const createdGroup = await groupModel.createNew(groupData)
    // insertedId is already an ObjectId, convert to string properly
    const insertedId = createdGroup.insertedId
    const groupIdString = insertedId instanceof ObjectId ? insertedId.toString() : String(insertedId)
    const newGroup = await groupModel.findOneById(groupIdString)

    // Log group creation activity
    try {
      await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_CREATED, creatorId, groupIdString, {
        groupName: reqBody.groupName,
        audienceUserIds: getAudienceUserIds(members, creatorId),
        description: `Created new group: ${reqBody.groupName}`,
      })
    } catch (activityError) {
      console.warn('Failed to log group creation activity:', activityError.message)
    }

    // Send notifications to members (except creator)
    try {
      const creator = await userModel.findOneById(creatorId)
      const creatorName = creator?.name || 'Someone'
      const otherMembers = members.filter(id => id !== creatorId)
      if (otherMembers.length > 0) {
        await notificationService.notifyGroupInvited(
          creatorId,
          creatorName,
          otherMembers,
          groupIdString,
          reqBody.groupName
        )
      }
    } catch (notifError) {
      console.warn('Failed to send group creation notifications:', notifError.message)
    }

    return newGroup
  } catch (error) {
    throw error
  }
}

/**
 * Get all groups
 * @returns {Promise<Array>} Array of groups
 */
const getAll = async () => {
  try {
    return await groupModel.getAll()
  } catch (error) {
    throw error
  }
}

/**
 * Get groups by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of groups
 */
const getGroupsByUser = async (userId) => {
  try {
    return await groupModel.getGroupsByUser(userId)
  } catch (error) {
    throw error
  }
}

/**
 * Get group by ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} Group object
 */
const findOneById = async (groupId) => {
  try {
    const group = await groupModel.findOneById(groupId)
    if (!group) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found')
    }
    return group
  } catch (error) {
    throw error
  }
}

const update = async (groupId, updateData, updatedBy) => {
  try {
    // Get original group data for activity logging
    const originalGroup = await groupModel.findOneById(groupId)

    const result = await groupModel.update(groupId, updateData)

    // Log activity if updatedBy is provided
    if (updatedBy && originalGroup) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_UPDATED, updatedBy, groupId, {
          groupName: originalGroup.groupName,
          previousValue: {
            groupName: originalGroup.groupName,
            description: originalGroup.description,
          },
          newValue: updateData,
          audienceUserIds: getAudienceUserIds(originalGroup.members, updatedBy),
          description: `Updated group: ${originalGroup.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group update activity:', activityError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Add member to group with activity logging
 * @param {string} groupId - Group ID
 * @param {string} memberId - Member user ID to add
 * @param {string} addedBy - User ID who adds the member
 * @param {string} memberEmail - Member email (optional, for logging)
 * @returns {Promise<Object>} Updated group
 */
const addMember = async (groupId, memberId, addedBy, memberEmail) => {
  try {
    const group = await groupModel.findOneById(groupId)

    const result = await groupModel.addMember(groupId, memberId)

    // Log activity if addedBy is provided
    if (addedBy) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_MEMBER_ADDED, addedBy, groupId, {
          groupName: group.groupName,
          memberId: memberId,
          memberEmail: memberEmail,
          audienceUserIds: getAudienceUserIds([...group.members, memberId], addedBy),
          description: `Added member to group: ${group.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group member addition activity:', activityError.message)
      }

      // Send notification to new member
      try {
        const actor = await userModel.findOneById(addedBy)
        const actorName = actor?.name || 'Someone'
        await notificationService.notifyGroupInvited(addedBy, actorName, memberId, groupId, group.groupName)
      } catch (notifError) {
        console.warn('Failed to send group invite notification:', notifError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Remove member from group with activity logging
 * @param {string} groupId - Group ID
 * @param {string} memberId - Member user ID to remove
 * @param {string} removedBy - User ID who removes the member
 * @param {string} memberEmail - Member email (optional, for logging)
 * @returns {Promise<Object>} Updated group
 */
const removeMember = async (groupId, memberId, removedBy, memberEmail) => {
  try {
    const group = await groupModel.findOneById(groupId)

    const result = await groupModel.removeMember(groupId, memberId)

    // Log activity if removedBy is provided
    if (removedBy) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_MEMBER_REMOVED, removedBy, groupId, {
          groupName: group.groupName,
          memberId: memberId,
          memberEmail: memberEmail,
          audienceUserIds: getAudienceUserIds([...group.members, memberId], removedBy),
          description: `Removed member from group: ${group.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group member removal activity:', activityError.message)
      }

      // Send notification to removed member
      try {
        const actor = await userModel.findOneById(removedBy)
        const actorName = actor?.name || 'Someone'
        await notificationService.notifyGroupMemberRemoved(removedBy, actorName, memberId, groupId, group.groupName)
      } catch (notifError) {
        console.warn('Failed to send group removal notification:', notifError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Add bill to group with activity logging
 * @param {string} groupId - Group ID
 * @param {string} billId - Bill ID to add
 * @param {string} addedBy - User ID who adds the bill
 * @param {string} billName - Bill name (optional, for logging)
 * @returns {Promise<Object>} Updated group
 */
const addBill = async (groupId, billId, addedBy, billName) => {
  try {
    const group = await groupModel.findOneById(groupId)

    const result = await groupModel.addBill(groupId, billId)

    // Log activity if addedBy is provided
    if (addedBy) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_BILL_ADDED, addedBy, groupId, {
          groupName: group.groupName,
          billName: billName,
          audienceUserIds: getAudienceUserIds(group.members, addedBy),
          description: `Added bill "${billName || 'Unknown'}" to group: ${group.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group bill addition activity:', activityError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Delete group by ID with activity logging
 * @param {string} groupId - Group ID
 * @param {string} deletedBy - User ID who deletes
 * @returns {Promise<Object>} Delete result
 */
const deleteOneById = async (groupId, deletedBy) => {
  try {
    const group = await groupModel.findOneById(groupId)

    const result = await groupModel.deleteOneById(groupId)

    // Log deletion activity
    if (deletedBy && group) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_DELETED, deletedBy, groupId, {
          groupName: group.groupName,
          audienceUserIds: getAudienceUserIds(group.members, deletedBy),
          description: `Deleted group: ${group.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group deletion activity:', activityError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

const getGroupAndMembers = async (groupId) => {
  try {
    const groupWithMembers = await groupModel.getGroupAndMembers(groupId)
    if (!groupWithMembers) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found')
    }
    if (groupWithMembers.members && Array.isArray(groupWithMembers.members)) {
      groupWithMembers.members = groupWithMembers.members.map((member) => pickUser(member))
    }

    return groupWithMembers
  } catch (error) {
    throw error
  }
}

const getAllGroupsAndMembers = async () => {
  try {
    const groupsWithMembers = await groupModel.getAllGroupsAndMembers()
    return groupsWithMembers.map((group) => {
      if (group.members && Array.isArray(group.members)) {
        group.members = group.members.map((member) => pickUser(member))
      }
      return group
    })
  } catch (error) {
    throw error
  }
}

const getGroupsByUserId = async (userId) => {
  try {
    const groups = await groupModel.getGroupsByUser(userId)
    return groups.map((group) => {
      if (group.members && Array.isArray(group.members)) {
        group.members = group.members.map((member) => pickUser(member))
      }
      return group
    })
  } catch (error) {
    throw error
  }
}

const fetchGroups = async (page = 1, limit = 10, search = '') => {
  try {
    const result = await groupModel.fetchGroups(page, limit, search)
    return {
      groups: result.groups,
      pagination: result.pagination,
    }
  } catch (error) {
    throw error
  }
}

const updateGroup = async (groupId, reqBody, updatedBy) => {
  try {
    // Get original group data for activity logging
    const originalGroup = await groupModel.findOneById(groupId)

    const updateData = {
      ...reqBody,
    }
    // Convert member IDs to ObjectId if members array is provided
    if (updateData.members && Array.isArray(updateData.members)) {
      updateData.members = updateData.members.map((memberId) => new ObjectId(memberId))
    }
    const updatedGroup = await groupModel.update(groupId, updateData)

    // Log activity if updatedBy is provided
    if (updatedBy && originalGroup) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_UPDATED, updatedBy, groupId, {
          groupName: originalGroup.groupName,
          previousValue: {
            groupName: originalGroup.groupName,
            description: originalGroup.description,
          },
          newValue: updateData,
          audienceUserIds: getAudienceUserIds(originalGroup.members, updatedBy),
          description: `Updated group: ${originalGroup.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group update activity:', activityError.message)
      }
    }

    if (Array.isArray(updateData.members)) {
      const originalMemberIds = originalGroup.members.map((memberId) => memberId.toString())
      const updatedMemberIds = updateData.members.map((memberId) => memberId.toString())
      const addedMemberIds = updatedMemberIds.filter((memberId) => !originalMemberIds.includes(memberId))
      const removedMemberIds = originalMemberIds.filter((memberId) => !updatedMemberIds.includes(memberId))
      const membershipAudience = [...new Set([...originalMemberIds, ...updatedMemberIds])]

      await Promise.all([
        ...addedMemberIds.map((memberId) => activityModel.logGroupActivity(
          activityModel.ACTIVITY_TYPES.GROUP_MEMBER_ADDED,
          updatedBy,
          groupId,
          {
            groupName: originalGroup.groupName,
            memberId,
            audienceUserIds: getAudienceUserIds(membershipAudience, updatedBy),
            description: 'Added a member to group: ' + originalGroup.groupName,
          }
        )),
        ...removedMemberIds.map((memberId) => activityModel.logGroupActivity(
          activityModel.ACTIVITY_TYPES.GROUP_MEMBER_REMOVED,
          updatedBy,
          groupId,
          {
            groupName: originalGroup.groupName,
            memberId,
            audienceUserIds: getAudienceUserIds(membershipAudience, updatedBy),
            description: 'Removed a member from group: ' + originalGroup.groupName,
          }
        ))
      ])
    }
    return updatedGroup
  } catch (error) {
    throw error
  }
}

const deleteGroup = async (groupId, deletedBy) => {
  try {
    // Get group data for activity logging before deletion
    const group = await groupModel.findOneById(groupId)

    await groupModel.deleteOneById(groupId)

    // Log deletion activity
    if (deletedBy && group) {
      try {
        await activityModel.logGroupActivity(activityModel.ACTIVITY_TYPES.GROUP_DELETED, deletedBy, groupId, {
          groupName: group.groupName,
          audienceUserIds: getAudienceUserIds(group.members, deletedBy),
          description: `Deleted group: ${group.groupName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log group deletion activity:', activityError.message)
      }

      // Send notifications to all members (except deleter)
      try {
        const actor = await userModel.findOneById(deletedBy)
        const actorName = actor?.name || 'Someone'
        const otherMembers = group.members
          ?.filter(m => m.toString() !== deletedBy)
          ?.map(m => m.toString()) || []
        if (otherMembers.length > 0) {
          await notificationService.notifyGroupDeleted(deletedBy, actorName, otherMembers, groupId, group.groupName)
        }
      } catch (notifError) {
        console.warn('Failed to send group deletion notifications:', notifError.message)
      }
    }
  } catch (error) {
    throw error
  }
}

export const groupService = {
  createNew,
  getAll,
  getGroupsByUser,
  findOneById,
  update,
  addMember,
  removeMember,
  addBill,
  deleteOneById,
  getGroupAndMembers,
  getAllGroupsAndMembers,
  getGroupsByUserId,
  fetchGroups,
  updateGroup,
  deleteGroup,
}
