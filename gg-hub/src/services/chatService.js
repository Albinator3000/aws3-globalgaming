// src/services/chatService.js - Updated with session support
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand,
  UpdateCommand 
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "GlobalGaming-LiveChat";

class ChatService {
  /**
   * Store a chat message in DynamoDB with session info
   * @param {Object} message - The chat message object
   * @param {string} streamId - The stream identifier
   */
  async saveMessage(message, streamId) {
    try {
      const item = {
        StreamId: streamId, // Partition key
        MessageId: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        Timestamp: message.timestamp.toISOString(),
        Username: message.username,
        Content: message.content,
        Badges: message.badges || [],
        IsOwnMessage: message.isOwnMessage || false,
        IsSystem: message.isSystem || false,
        SessionId: message.sessionId || null, // Track which session this message belongs to
        CreatedAt: new Date().toISOString(),
        TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
        MessageLength: message.content.length,
        // Additional metadata
        UserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        MessageType: message.isSystem ? 'system' : message.isOwnMessage ? 'user' : 'viewer'
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      });

      await docClient.send(command);
      console.log(`✅ Message saved: ${message.content.substring(0, 30)}...`);
      return item;
    } catch (error) {
      console.error("❌ Error saving message to DynamoDB:", error);
      throw error;
    }
  }

  /**
   * Retrieve all chat messages for a specific stream
   * @param {string} streamId - The stream identifier
   * @param {number} limit - Maximum number of messages to retrieve
   */
  async getMessages(streamId, limit = 50) {
    try {
      const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        ExpressionAttributeValues: {
          ":streamId": streamId
        },
        ScanIndexForward: false, // Get newest messages first
        Limit: limit
      };

      const command = new QueryCommand(queryParams);
      const response = await docClient.send(command);

      const messages = (response.Items || []).map(item => ({
        id: item.MessageId,
        username: item.Username,
        content: item.Content,
        timestamp: new Date(item.Timestamp),
        badges: item.Badges || [],
        isOwnMessage: item.IsOwnMessage || false,
        isSystem: item.IsSystem || false,
        sessionId: item.SessionId || null
      }));

      console.log(`✅ Retrieved ${messages.length} messages from DynamoDB`);
      
      return {
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: !!response.LastEvaluatedKey
      };
    } catch (error) {
      console.error("❌ Error retrieving messages from DynamoDB:", error);
      throw error;
    }
  }

  /**
   * Retrieve chat messages for a specific session
   * @param {string} streamId - The stream identifier
   * @param {string} sessionId - The session identifier
   * @param {number} limit - Maximum number of messages to retrieve
   */
  async getSessionMessages(streamId, sessionId, limit = 50) {
    try {
      const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        FilterExpression: "SessionId = :sessionId",
        ExpressionAttributeValues: {
          ":streamId": streamId,
          ":sessionId": sessionId
        },
        ScanIndexForward: false, // Get newest messages first
        Limit: limit * 2 // Get more items since we're filtering
      };

      const command = new QueryCommand(queryParams);
      const response = await docClient.send(command);

      const messages = (response.Items || [])
        .filter(item => item.SessionId === sessionId) // Additional filter for safety
        .map(item => ({
          id: item.MessageId,
          username: item.Username,
          content: item.Content,
          timestamp: new Date(item.Timestamp),
          badges: item.Badges || [],
          isOwnMessage: item.IsOwnMessage || false,
          isSystem: item.IsSystem || false,
          sessionId: item.SessionId
        }))
        .slice(0, limit); // Limit to requested amount

      console.log(`✅ Retrieved ${messages.length} session messages for ${sessionId}`);
      
      return {
        messages: messages.reverse(), // Reverse to show oldest first
        sessionId: sessionId,
        hasMore: messages.length === limit
      };
    } catch (error) {
      console.error("❌ Error retrieving session messages:", error);
      throw error;
    }
  }

  /**
   * Get message count for a stream
   * @param {string} streamId - The stream identifier
   */
  async getMessageCount(streamId) {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        ExpressionAttributeValues: {
          ":streamId": streamId
        },
        Select: "COUNT"
      });

      const response = await docClient.send(command);
      return response.Count || 0;
    } catch (error) {
      console.error("❌ Error getting message count:", error);
      return 0;
    }
  }

  /**
   * Get message count for a specific session
   * @param {string} streamId - The stream identifier
   * @param {string} sessionId - The session identifier
   */
  async getSessionMessageCount(streamId, sessionId) {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        FilterExpression: "SessionId = :sessionId",
        ExpressionAttributeValues: {
          ":streamId": streamId,
          ":sessionId": sessionId
        },
        Select: "COUNT"
      });

      const response = await docClient.send(command);
      return response.Count || 0;
    } catch (error) {
      console.error("❌ Error getting session message count:", error);
      return 0;
    }
  }

  /**
   * Get list of unique sessions for a stream
   * @param {string} streamId - The stream identifier
   */
  async getStreamSessions(streamId, limit = 10) {
    try {
      const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        FilterExpression: "attribute_exists(SessionId) AND SessionId <> :null",
        ExpressionAttributeValues: {
          ":streamId": streamId,
          ":null": null
        },
        ProjectionExpression: "SessionId, Timestamp, Username, MessageType",
        ScanIndexForward: false, // Get newest first
        Limit: limit * 10 // Get more items since we're looking for unique sessions
      };

      const command = new QueryCommand(queryParams);
      const response = await docClient.send(command);

      // Extract unique sessions with metadata
      const sessionMap = new Map();
      
      (response.Items || []).forEach(item => {
        const sessionId = item.SessionId;
        if (sessionId && !sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            sessionId: sessionId,
            startTime: new Date(item.Timestamp),
            lastActivity: new Date(item.Timestamp)
          });
        } else if (sessionId && sessionMap.has(sessionId)) {
          // Update last activity time
          const session = sessionMap.get(sessionId);
          const timestamp = new Date(item.Timestamp);
          if (timestamp > session.lastActivity) {
            session.lastActivity = timestamp;
          }
          if (timestamp < session.startTime) {
            session.startTime = timestamp;
          }
        }
      });

      const sessions = Array.from(sessionMap.values())
        .sort((a, b) => b.startTime - a.startTime) // Sort by start time, newest first
        .slice(0, limit);

      console.log(`✅ Found ${sessions.length} unique sessions for stream ${streamId}`);
      return sessions;
    } catch (error) {
      console.error("❌ Error getting stream sessions:", error);
      return [];
    }
  }

  /**
   * Get stream statistics including session info
   * @param {string} streamId - The stream identifier
   */
  async getStreamStats(streamId) {
    try {
      const [totalMessages, sessions] = await Promise.all([
        this.getMessageCount(streamId),
        this.getStreamSessions(streamId, 5)
      ]);

      return {
        totalMessages: totalMessages,
        totalSessions: sessions.length,
        recentSessions: sessions,
        streamId: streamId,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Error getting stream stats:", error);
      return {
        totalMessages: 0,
        totalSessions: 0,
        recentSessions: [],
        streamId: streamId,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Test the DynamoDB connection
   */
  async testConnection() {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "StreamId = :streamId",
        ExpressionAttributeValues: {
          ":streamId": "test-connection"
        },
        Limit: 1
      });

      await docClient.send(command);
      console.log("✅ DynamoDB connection test successful");
      return true;
    } catch (error) {
      console.error("❌ DynamoDB connection test failed:", error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: !!docClient,
      hasCredentials: !!(
        import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
        import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
      ),
      region: "us-west-2",
      tableName: TABLE_NAME
    };
  }
}

export default new ChatService();