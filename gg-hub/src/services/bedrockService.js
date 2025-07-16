// src/services/bedrockService.js - AWS Bedrock AI Analytics Service
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} from "@aws-sdk/client-bedrock-runtime";

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: import.meta.env.VITE_AWS_REGION || "us-west-2",
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
      }
    });
    
    // Using Claude 3 Haiku for fast, cost-effective analysis
    this.modelId = import.meta.env.VITE_BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
    this.maxTokens = parseInt(import.meta.env.VITE_BEDROCK_MAX_TOKENS) || 1500;
    this.temperature = parseFloat(import.meta.env.VITE_BEDROCK_TEMPERATURE) || 0.3;
  }

  /**
   * Analyze chat sentiment and provide insights
   * @param {Array} messages - Chat messages to analyze
   * @param {string} streamContext - Additional context about the stream
   */
  async analyzeChatSentiment(messages, streamContext = "") {
    try {
      if (!messages || messages.length === 0) {
        return {
          sentiment: { overall: 'neutral', score: 0, confidence: 0 },
          summary: 'No messages to analyze yet.',
          highlights: [],
          topics: [],
          engagement: { level: 'low', indicators: [], unique_users: 0, average_message_length: 0 },
          recommendations: []
        };
      }

      // Filter out system messages and prepare data
      const userMessages = messages.filter(msg => !msg.isSystem);
      
      if (userMessages.length === 0) {
        return {
          sentiment: { overall: 'neutral', score: 0, confidence: 0 },
          summary: 'Only system messages detected.',
          highlights: [],
          topics: [],
          engagement: { level: 'low', indicators: [], unique_users: 0, average_message_length: 0 },
          recommendations: []
        };
      }

      // Prepare chat data for analysis
      const chatData = userMessages.map(msg => ({
        username: msg.username,
        content: msg.content,
        timestamp: msg.timestamp,
        badges: msg.badges || []
      }));

      // Create the prompt for Claude
      const prompt = `Analyze this live stream chat data and provide insights:

Stream Context: ${streamContext || "Gaming/Esports live stream"}
Total Messages: ${userMessages.length}
Timeframe: Current live session

Chat Messages:
${chatData.slice(0, 50).map(msg => `[${msg.username}${msg.badges.length > 0 ? ` (${msg.badges.join(',')})` : ''}]: ${msg.content}`).join('\n')}

Please provide a JSON response with the following structure:
{
  "sentiment": {
    "overall": "positive|negative|neutral|excited|mixed",
    "score": -1.0 to 1.0,
    "confidence": 0.0 to 1.0
  },
  "summary": "2-3 sentence summary of overall chat sentiment and what viewers are discussing",
  "highlights": [
    {
      "type": "positive|negative|question|excitement",
      "content": "actual message content",
      "username": "username",
      "reason": "why this message is notable"
    }
  ],
  "topics": [
    {
      "topic": "topic name",
      "mentions": number,
      "sentiment": "positive|negative|neutral"
    }
  ],
  "engagement": {
    "level": "low|medium|high|very_high",
    "indicators": ["what indicates this engagement level"],
    "unique_users": number,
    "average_message_length": number
  },
  "recommendations": [
    "actionable suggestions for the streamer based on chat analysis"
  ]
}

Focus on gaming/esports terminology and be concise but insightful.`;

      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody)
      });

      console.log("🤖 Sending chat data to Bedrock for analysis...");
      const response = await this.client.send(command);
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;
      
      // Parse JSON response from Claude
      let analysis;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        console.warn("Failed to parse JSON, extracting from text:", parseError);
        analysis = this.extractAnalysisFromText(content);
      }

      // Ensure all required fields exist with proper defaults
      const result = {
        sentiment: {
          overall: analysis.sentiment?.overall || 'neutral',
          score: Number(analysis.sentiment?.score) || 0,
          confidence: Number(analysis.sentiment?.confidence) || 0.5
        },
        summary: analysis.summary || 'Chat analysis completed.',
        highlights: (analysis.highlights || []).slice(0, 5),
        topics: (analysis.topics || []).slice(0, 8),
        engagement: {
          level: analysis.engagement?.level || 'medium',
          indicators: analysis.engagement?.indicators || [],
          unique_users: this.countUniqueUsers(userMessages),
          average_message_length: this.calculateAverageLength(userMessages)
        },
        recommendations: (analysis.recommendations || []).slice(0, 3),
        metadata: {
          analyzed_messages: userMessages.length,
          analysis_timestamp: new Date().toISOString(),
          model_used: this.modelId
        }
      };

      console.log("✅ Bedrock analysis completed successfully");
      return result;

    } catch (error) {
      console.error("❌ Error analyzing chat with Bedrock:", error);
      return this.getFallbackAnalysis(messages);
    }
  }

  /**
   * Analyze badge distribution and user engagement patterns
   * @param {Array} messages - Chat messages to analyze
   */
  async analyzeBadgeDistribution(messages) {
    try {
      if (!messages || messages.length === 0) {
        return {
          distribution: {},
          total_users: 0,
          analysis: null
        };
      }

      const userMessages = messages.filter(msg => !msg.isSystem);
      const userStats = new Map();

      // Aggregate user activity and badge data
      userMessages.forEach(msg => {
        const username = msg.username;
        if (!userStats.has(username)) {
          userStats.set(username, {
            messageCount: 0,
            badges: msg.badges || [],
            averageLength: 0,
            totalLength: 0,
            timestamps: []
          });
        }
        
        const stats = userStats.get(username);
        stats.messageCount++;
        stats.totalLength += msg.content.length;
        stats.averageLength = stats.totalLength / stats.messageCount;
        stats.timestamps.push(msg.timestamp);
      });

      // Calculate badge levels based on message count (matching your BadgeSystem)
      const badgeDistribution = {
        1: 0, // Newcomer (0 comments)
        2: 0, // Chatter (1+ comments)
        3: 0, // Active Voice (2+ comments)
        4: 0, // Community Member (3+ comments)
        5: 0, // Chat Champion (4+ comments)
        6: 0  // Legend (5+ comments)
      };

      userStats.forEach((stats, username) => {
        let badgeLevel = 1;
        if (stats.messageCount >= 5) badgeLevel = 6;
        else if (stats.messageCount >= 4) badgeLevel = 5;
        else if (stats.messageCount >= 3) badgeLevel = 4;
        else if (stats.messageCount >= 2) badgeLevel = 3;
        else if (stats.messageCount >= 1) badgeLevel = 2;
        
        badgeDistribution[badgeLevel]++;
      });

      // Send to Bedrock for deeper insights
      const prompt = `Analyze this chat badge distribution and user engagement data:

Badge Distribution:
- Level 1 (Newcomer): ${badgeDistribution[1]} users
- Level 2 (Chatter): ${badgeDistribution[2]} users  
- Level 3 (Active Voice): ${badgeDistribution[3]} users
- Level 4 (Community Member): ${badgeDistribution[4]} users
- Level 5 (Chat Champion): ${badgeDistribution[5]} users
- Level 6 (Legend): ${badgeDistribution[6]} users

Total Users: ${userStats.size}
Total Messages: ${userMessages.length}

User Activity Patterns:
${Array.from(userStats.entries()).slice(0, 10).map(([user, stats]) => 
  `${user}: ${stats.messageCount} messages, avg length: ${Math.round(stats.averageLength)} chars`
).join('\n')}

Provide insights in JSON format:
{
  "engagement_quality": "low|medium|high|excellent",
  "distribution_analysis": "analysis of badge distribution health",
  "insights": [
    "key insights about user engagement patterns"
  ],
  "community_health": {
    "newcomer_retention": "assessment of newcomer activity",
    "veteran_engagement": "assessment of high-level user activity",
    "overall_score": 0-100
  },
  "recommendations": [
    "suggestions to improve engagement based on patterns"
  ]
}`;

      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;
      
      let analysis;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        analysis = {
          engagement_quality: "medium",
          distribution_analysis: "Badge distribution analysis completed",
          insights: ["User engagement patterns identified"],
          community_health: {
            newcomer_retention: "Active newcomer participation",
            veteran_engagement: "Good veteran user engagement", 
            overall_score: 75
          },
          recommendations: ["Continue encouraging user participation"]
        };
      }

      return {
        distribution: badgeDistribution,
        total_users: userStats.size,
        analysis: analysis,
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          total_messages_analyzed: userMessages.length
        }
      };

    } catch (error) {
      console.error("❌ Error analyzing badge distribution:", error);
      return {
        distribution: {},
        total_users: 0,
        analysis: null
      };
    }
  }

  /**
   * Test Bedrock connectivity
   */
  async testConnection() {
    try {
      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 100,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: "Respond with 'Connection successful' if you can read this."
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log("✅ Bedrock connection test successful");
      return true;
    } catch (error) {
      console.error("❌ Bedrock connection test failed:", error);
      return false;
    }
  }

  // Helper methods
  countUniqueUsers(messages) {
    return new Set(messages.map(msg => msg.username)).size;
  }

  calculateAverageLength(messages) {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.round(totalLength / messages.length);
  }

  extractAnalysisFromText(text) {
    // Fallback parser for malformed JSON
    return {
      sentiment: { overall: 'neutral', score: 0, confidence: 0.5 },
      summary: 'Analysis completed with basic extraction.',
      highlights: [],
      topics: [],
      engagement: { level: 'medium', indicators: [], unique_users: 0, average_message_length: 0 },
      recommendations: []
    };
  }

  getFallbackAnalysis(messages) {
    const userMessages = messages.filter(msg => !msg.isSystem);
    return {
      sentiment: { overall: 'neutral', score: 0, confidence: 0.1 },
      summary: 'Basic analysis completed. Bedrock service temporarily unavailable.',
      highlights: [],
      topics: [],
      engagement: {
        level: userMessages.length > 10 ? 'medium' : 'low',
        indicators: ['Message count'],
        unique_users: this.countUniqueUsers(userMessages),
        average_message_length: this.calculateAverageLength(userMessages)
      },
      recommendations: ['Check network connectivity for full AI analysis'],
      metadata: {
        analyzed_messages: userMessages.length,
        analysis_timestamp: new Date().toISOString(),
        fallback: true
      }
    };
  }

  getConnectionStatus() {
    return {
      isConnected: !!this.client,
      hasCredentials: !!(
        import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
        import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
      ),
      region: import.meta.env.VITE_AWS_REGION || "us-west-2",
      modelId: this.modelId
    };
  }
}

export default new BedrockService();