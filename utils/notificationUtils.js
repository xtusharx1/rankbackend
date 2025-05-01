const axios = require('axios');
const admin = require('../config/firebase');

/**
 * Get user tokens from external API
 * @param {Array|Number} userIds - Array of user IDs or single user ID
 * @returns {Promise<Array>} - Array of FCM tokens
 */
async function getUserTokens(userIds) {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const tokens = [];

    for (let userId of ids) {
      const response = await axios.get(`http://ec2-13-202-53-68.ap-south-1.compute.amazonaws.com:3002/api/device-tokens/${userId}`);
      
      if (response && response.data && response.data.data && response.data.data.length > 0) {
        const userTokens = response.data.data.map(tokenObj => tokenObj.token);
        tokens.push(...userTokens); // Spread all tokens
      } else {
        console.log(`No tokens found for user ${userId}`);
      }
    }

    return tokens;
  } catch (error) {
    console.error('Error fetching user tokens from API:', error);
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
    console.log('Fetched tokens:', tokens); // Log tokens to ensure they are correct

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
    };

    // Send notification to each token individually
    const responsePromises = tokens.map((token) =>
      admin.messaging().send({ ...message, token })
    );

    const responses = await Promise.all(responsePromises);

    const successCount = responses.filter((response) => response.success).length;
    const failureCount = responses.filter((response) => !response.success).length;

    console.log('Successfully sent notifications:', successCount);
    console.log('Failed notifications:', failureCount);

    return {
      success: successCount,
      failure: failureCount,
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
    // Get all tokens from external API (for simplicity, use hardcoded userIds for now)
    const userIds = [1, 2, 3];  // Example user IDs for all users
    const tokens = await getUserTokens(userIds);
    
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
      failure: response.failureCount,
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
