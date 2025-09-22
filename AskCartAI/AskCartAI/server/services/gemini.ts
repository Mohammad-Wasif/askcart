import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Product } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ChatResponse {
  content: string;
  productRecommendations?: Product[];
  intent?: string;
}

export interface ProductRecommendation {
  product: Product;
  reasoning: string;
  score: number;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  async generateChatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    availableProducts: Product[]
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = `You are AskCart AI, a helpful e-commerce shopping assistant. Your role is to:
1. Help customers find products that match their needs
2. Provide detailed product information and comparisons
3. Answer questions about shipping, returns, and policies
4. Offer personalized recommendations based on customer preferences

Available products in the catalog:
${availableProducts.map(p => `- ${p.name}: $${(p.price / 100).toFixed(2)} - ${p.description}`).join('\n')}

Guidelines:
- Be friendly, helpful, and conversational
- Always recommend specific products when relevant
- Provide clear reasoning for your recommendations
- Keep responses concise but informative
- If asked about products not in catalog, politely explain limitations

Conversation history:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current user message: ${userMessage}

Respond with helpful information and product recommendations if relevant.`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const content = response.text();

      // Extract product recommendations from response
      const recommendations = this.extractProductRecommendations(content, availableProducts);

      return {
        content,
        productRecommendations: recommendations,
        intent: this.detectIntent(userMessage)
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeProductQuery(query: string): Promise<{
    category?: string;
    priceRange?: { min: number; max: number };
    features: string[];
    intent: string;
  }> {
    try {
      const prompt = `Analyze this product search query and extract structured information:
Query: "${query}"

Return a JSON response with:
- category: product category if mentioned
- priceRange: {min, max} if price mentioned (in dollars)
- features: array of specific features or requirements mentioned
- intent: one of "search", "compare", "support", "general"

Example: "laptop under $1500 for gaming" -> {"category":"laptop","priceRange":{"min":0,"max":1500},"features":["gaming"],"intent":"search"}`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const response = await result.response;
      const analysis = JSON.parse(response.text());
      return analysis;
    } catch (error) {
      console.error('Query analysis error:', error);
      return {
        features: [],
        intent: "general"
      };
    }
  }

  async generateProductComparison(products: Product[]): Promise<string> {
    try {
      const productInfo = products.map(p => ({
        name: p.name,
        price: p.price / 100,
        description: p.description,
        specifications: p.specifications
      }));

      const prompt = `Compare these products and provide a helpful comparison for a customer:

${JSON.stringify(productInfo, null, 2)}

Provide a clear, concise comparison highlighting:
- Key differences in features and specifications
- Price value analysis
- Which product might be better for different use cases
- Pros and cons of each option

Format the response in a customer-friendly way.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Product comparison error:', error);
      throw new Error('Failed to generate product comparison');
    }
  }

  private extractProductRecommendations(response: string, availableProducts: Product[]): Product[] {
    // Simple product name matching - in production, use more sophisticated NLP
    const recommendations: Product[] = [];
    
    for (const product of availableProducts) {
      if (response.toLowerCase().includes(product.name.toLowerCase())) {
        recommendations.push(product);
      }
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('difference')) {
      return 'compare';
    }
    if (lowerMessage.includes('return') || lowerMessage.includes('shipping') || lowerMessage.includes('policy')) {
      return 'support';
    }
    if (lowerMessage.includes('looking for') || lowerMessage.includes('need') || lowerMessage.includes('want')) {
      return 'search';
    }
    
    return 'general';
  }
}

export const geminiService = new GeminiService();
