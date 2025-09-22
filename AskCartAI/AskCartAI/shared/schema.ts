import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  imageUrl: text("image_url"),
  category: text("category"),
  specifications: jsonb("specifications"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  customerName: text("customer_name"),
  status: text("status").notNull().default("active"), // active, resolved, abandoned
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // user, assistant
  metadata: jsonb("metadata"), // product recommendations, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const widgetConfigs = pgTable("widget_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: text("store_id").notNull().unique(),
  primaryColor: text("primary_color").notNull().default("#3b82f6"),
  position: text("position").notNull().default("bottom-right"),
  welcomeMessage: text("welcome_message").notNull().default("Hi! I'm AskCart AI. How can I help you find the perfect product today?"),
  autoOpen: boolean("auto_open").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  event: text("event").notNull(), // conversation_started, message_sent, product_recommended, conversion
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  analytics: many(analytics),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  conversation: one(conversations, {
    fields: [analytics.conversationId],
    references: [conversations.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertWidgetConfigSchema = createInsertSchema(widgetConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type WidgetConfig = typeof widgetConfigs.$inferSelect;
export type InsertWidgetConfig = z.infer<typeof insertWidgetConfigSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
