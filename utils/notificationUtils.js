// utils/notificationUtils.js
const DeviceToken = require('../models/DeviceToken');
const admin = require('../config/firebase');

/**
 * Get user tokens from database
 * @param {Array|Number} userIds - Array of user IDs or single user ID
 * @returns {Promise<Array>} - Array of FCM tokens
 */
async function getUserTokens(userIds) {
  try {
    // Convert single ID to array if needed
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    
    // Get tokens from database
    const tokenRecords = await DeviceToken.findAll({
      where: {
        user_id: ids
      },
      attributes: ['token']
    });
    
    // Extract token strings from records
    return tokenRecords.map(record => record.token);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
}

/**
 * Send notification to specific user IDs
 * @param {Array|Number} userIds - Array of user IDs or single user ID
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} - FCM response
 */
async function sendNotificationToUsers(userIds, title, body, data = {}) {
  try {
    const tokens = await getUserTokens(userIds);
    
    if (!tokens || tokens.length === 0) {
      console.error('No tokens found for users:', userIds);
      return { success: 0, failure: 0 };
    }
    
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };
    
    // Send multicast message (more efficient than sending individual messages)
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages, failed to send ${response.failureCount} messages`);
    
    // Log failed tokens if any
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.error('Failed tokens:', failedTokens);
    }
    
    return {
      success: response.successCount,
      failure: response.failureCount
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: 0, failure: 0, error: error.message };
  }
}

/**
 * Send notification to all users
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} - FCM response
 */
async function sendNotificationToAll(title, body, data = {}) {
  try {
    // Get all tokens from database
    const tokenRecords = await DeviceToken.findAll({
      attributes: ['token']
    });
    
    const tokens = tokenRecords.map(record => record.token);
    
    if (tokens.length === 0) {
      console.error('No tokens found in the database');
      return { success: 0, failure: 0 };
    }
    
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };
    
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages, failed to send ${response.failureCount} messages`);
    
    return {
      success: response.successCount,
      failure: response.failureCount
    };
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
    return { success: 0, failure: 0, error: error.message };
  }
}

module.exports = {
  getUserTokens,
  sendNotificationToUsers,
  sendNotificationToAll
};