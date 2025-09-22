import { 
  users, products, conversations, messages, widgetConfigs, analytics,
  type User, type InsertUser, type Product, type InsertProduct,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type WidgetConfig, type InsertWidgetConfig, type Analytics, type InsertAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  searchProducts(query: string): Promise<Product[]>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationStatus(id: string, status: string): Promise<void>;

  // Messages
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Widget Config
  getWidgetConfig(storeId: string): Promise<WidgetConfig | undefined>;
  createWidgetConfig(config: InsertWidgetConfig): Promise<WidgetConfig>;
  updateWidgetConfig(storeId: string, updates: Partial<InsertWidgetConfig>): Promise<WidgetConfig>;

  // Analytics
  createAnalyticsEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalyticsSummary(): Promise<{
    totalConversations: number;
    conversions: number;
    avgResponseTime: number;
    satisfaction: number;
  }>;
  getRecentConversations(): Promise<Array<Conversation & { messageCount: number; lastMessage: string }>>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.name} ILIKE ${`%${query}%`} OR ${products.description} ILIKE ${`%${query}%`}`
      )
      .limit(20);
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .orderBy(desc(conversations.createdAt));
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversationStatus(id: string, status: string): Promise<void> {
    await db
      .update(conversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  // Messages
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Widget Config
  async getWidgetConfig(storeId: string): Promise<WidgetConfig | undefined> {
    const [config] = await db
      .select()
      .from(widgetConfigs)
      .where(eq(widgetConfigs.storeId, storeId));
    return config || undefined;
  }

  async createWidgetConfig(config: InsertWidgetConfig): Promise<WidgetConfig> {
    const [newConfig] = await db.insert(widgetConfigs).values(config).returning();
    return newConfig;
  }

  async updateWidgetConfig(storeId: string, updates: Partial<InsertWidgetConfig>): Promise<WidgetConfig> {
    const [updatedConfig] = await db
      .update(widgetConfigs)
      .set(updates)
      .where(eq(widgetConfigs.storeId, storeId))
      .returning();
    return updatedConfig;
  }

  // Analytics
  async createAnalyticsEvent(event: InsertAnalytics): Promise<Analytics> {
    const [newEvent] = await db.insert(analytics).values(event).returning();
    return newEvent;
  }

  async getAnalyticsSummary(): Promise<{
    totalConversations: number;
    conversions: number;
    avgResponseTime: number;
    satisfaction: number;
  }> {
    const [totalConversations] = await db
      .select({ count: count() })
      .from(conversations);

    const [conversions] = await db
      .select({ count: count() })
      .from(analytics)
      .where(eq(analytics.event, 'conversion'));

    return {
      totalConversations: totalConversations.count,
      conversions: conversions.count,
      avgResponseTime: 1.2, // Mock for now
      satisfaction: 4.8, // Mock for now
    };
  }

  async getRecentConversations(): Promise<Array<Conversation & { messageCount: number; lastMessage: string }>> {
    const recentConversations = await db
      .select({
        id: conversations.id,
        sessionId: conversations.sessionId,
        customerName: conversations.customerName,
        status: conversations.status,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        messageCount: count(messages.id),
        lastMessage: sql<string>`COALESCE((
          SELECT content FROM ${messages} 
          WHERE ${messages.conversationId} = ${conversations.id} 
          ORDER BY created_at DESC LIMIT 1
        ), 'No messages')`
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt))
      .limit(10);

    return recentConversations;
  }
}

export const storage = new DatabaseStorage();
