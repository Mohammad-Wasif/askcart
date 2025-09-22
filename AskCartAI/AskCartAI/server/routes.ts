import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { 
  insertConversationSchema, 
  insertMessageSchema, 
  insertProductSchema,
  insertWidgetConfigSchema 
} from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  sessionId?: string;
  conversationId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws: ExtendedWebSocket, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          content: 'Failed to process message' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  async function handleWebSocketMessage(ws: ExtendedWebSocket, message: any) {
    const { type, content, sessionId } = message;

    switch (type) {
      case 'join':
        ws.sessionId = sessionId;
        
        // Get or create conversation
        let conversation = await storage.getConversationBySessionId(sessionId);
        if (!conversation) {
          conversation = await storage.createConversation({
            sessionId,
            status: 'active'
          });
        }
        ws.conversationId = conversation.id;

        // Send conversation history
        const messages = await storage.getMessagesByConversationId(conversation.id);
        ws.send(JSON.stringify({
          type: 'history',
          messages: messages
        }));
        break;

      case 'message':
        if (!ws.conversationId) {
          ws.send(JSON.stringify({ type: 'error', content: 'No active conversation' }));
          return;
        }

        // Save user message
        await storage.createMessage({
          conversationId: ws.conversationId,
          content,
          role: 'user'
        });

        // Get conversation history for context
        const history = await storage.getMessagesByConversationId(ws.conversationId);
        const conversationHistory = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Get available products for recommendations
        const products = await storage.getProducts();

        // Generate AI response
        const aiResponse = await geminiService.generateChatResponse(
          content,
          conversationHistory,
          products
        );

        // Save AI response
        const aiMessage = await storage.createMessage({
          conversationId: ws.conversationId,
          content: aiResponse.content,
          role: 'assistant',
          metadata: {
            productRecommendations: aiResponse.productRecommendations,
            intent: aiResponse.intent
          }
        });

        // Send response to client
        ws.send(JSON.stringify({
          type: 'message',
          message: aiMessage
        }));

        // Track analytics
        await storage.createAnalyticsEvent({
          conversationId: ws.conversationId,
          event: 'message_sent',
          metadata: { intent: aiResponse.intent }
        });

        if (aiResponse.productRecommendations && aiResponse.productRecommendations.length > 0) {
          await storage.createAnalyticsEvent({
            conversationId: ws.conversationId,
            event: 'product_recommended',
            metadata: { 
              productIds: aiResponse.productRecommendations.map(p => p.id),
              count: aiResponse.productRecommendations.length
            }
          });
        }
        break;
    }
  }

  // REST API routes
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
      }
      
      const products = await storage.searchProducts(q);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: 'Invalid product data' });
    }
  });

  // Widget Configuration
  app.get('/api/widget-config/:storeId', async (req, res) => {
    try {
      const { storeId } = req.params;
      let config = await storage.getWidgetConfig(storeId);
      
      if (!config) {
        // Create default config
        config = await storage.createWidgetConfig({
          storeId,
          primaryColor: '#3b82f6',
          position: 'bottom-right',
          welcomeMessage: "Hi! I'm AskCart AI. How can I help you find the perfect product today?",
          autoOpen: false,
          isActive: true
        });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch widget configuration' });
    }
  });

  app.put('/api/widget-config/:storeId', async (req, res) => {
    try {
      const { storeId } = req.params;
      const updates = req.body;
      
      const config = await storage.updateWidgetConfig(storeId, updates);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update widget configuration' });
    }
  });

  // Analytics
  app.get('/api/analytics/summary', async (req, res) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  });

  app.get('/api/conversations/recent', async (req, res) => {
    try {
      const conversations = await storage.getRecentConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent conversations' });
    }
  });

  // Product comparison
  app.post('/api/products/compare', async (req, res) => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length < 2) {
        return res.status(400).json({ error: 'At least 2 product IDs required for comparison' });
      }

      const products = await Promise.all(
        productIds.map(id => storage.getProduct(id))
      );

      const validProducts = products.filter(p => p !== undefined);
      if (validProducts.length < 2) {
        return res.status(404).json({ error: 'Some products not found' });
      }

      const comparison = await geminiService.generateProductComparison(validProducts);
      res.json({ comparison, products: validProducts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate product comparison' });
    }
  });

  return httpServer;
}
