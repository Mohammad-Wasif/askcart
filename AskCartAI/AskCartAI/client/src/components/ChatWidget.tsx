import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Minus, Send, Bot, User, Star } from "lucide-react";
import type { Message, Product } from "@shared/schema";

interface ChatWidgetProps {
  storeId?: string;
  primaryColor?: string;
  position?: string;
  welcomeMessage?: string;
  autoOpen?: boolean;
}

interface ChatMessage extends Message {
  productRecommendations?: Product[];
}

export default function ChatWidget({
  storeId = "demo-store",
  primaryColor = "#3b82f6",
  position = "bottom-right",
  welcomeMessage = "Hi! I'm AskCart AI. How can I help you find the perfect product today?",
  autoOpen = false
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (autoOpen && !isOpen) {
      setTimeout(() => setIsOpen(true), 3000);
    }
  }, [autoOpen, isOpen]);

  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log("Connected to chat server");
      wsRef.current?.send(JSON.stringify({
        type: 'join',
        sessionId
      }));
      
      // Add welcome message if no messages exist
      if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          conversationId: '',
          content: welcomeMessage,
          role: 'assistant',
          metadata: null,
          createdAt: new Date()
        }]);
      }
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'history':
          if (data.messages.length > 0) {
            setMessages(data.messages);
          }
          break;
          
        case 'message':
          setMessages(prev => [...prev, data.message]);
          setIsTyping(false);
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
          break;
          
        case 'error':
          console.error('Chat error:', data.content);
          setIsTyping(false);
          break;
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsTyping(false);
    };

    wsRef.current.onclose = () => {
      console.log("Disconnected from chat server");
      wsRef.current = null;
    };
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !wsRef.current) return;

    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId: '',
      content: inputValue,
      role: 'user',
      metadata: null,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: inputValue,
      sessionId
    }));

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const renderProductCard = (product: Product) => (
    <div key={product.id} className="bg-secondary rounded-lg p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer">
      {product.imageUrl && (
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-20 object-cover rounded mb-2"
        />
      )}
      <h4 className="font-semibold text-xs text-card-foreground">{product.name}</h4>
      <p className="text-xs text-muted-foreground">${(product.price / 100).toFixed(2)}</p>
      <div className="flex items-center mt-1">
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-current" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">4.8 (2.1k)</span>
      </div>
    </div>
  );

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-50`}>
      {/* Chat Button */}
      <Button
        onClick={toggleWidget}
        className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: primaryColor }}
        data-testid="button-chat-toggle"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center animate-pulse">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={`absolute ${position?.includes('top') ? 'top-20' : 'bottom-20'} right-0 w-96 h-[500px] shadow-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : ''}`}>
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">AskCart AI</h3>
                <p className="text-xs opacity-90">Your shopping assistant</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 text-white p-1"
                data-testid="button-minimize"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleWidget}
                className="hover:bg-white/20 text-white p-1"
                data-testid="button-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 h-80 overflow-y-auto p-4 space-y-4 bg-secondary/30">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start space-x-3'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback style={{ backgroundColor: primaryColor }}>
                          <Bot className="w-4 h-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-xs ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'} rounded-lg p-3 shadow-sm`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {message.role === 'assistant' && message.metadata && typeof message.metadata === 'object' && 'productRecommendations' in message.metadata && (message.metadata as any).productRecommendations && (
                        <div className="mt-3 space-y-2">
                          {((message.metadata as any).productRecommendations as Product[]).map(renderProductCard)}
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" className="text-xs" data-testid="button-compare">
                              Compare
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" data-testid="button-details">
                              View Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback style={{ backgroundColor: primaryColor }}>
                        <Bot className="w-4 h-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card rounded-lg p-3 shadow-sm border">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 bg-card">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Ask me anything about products..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button 
                    onClick={sendMessage}
                    style={{ backgroundColor: primaryColor }}
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputValue("Compare laptops")}
                    data-testid="button-quick-compare"
                  >
                    Compare laptops
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputValue("Show me best deals")}
                    data-testid="button-quick-deals"
                  >
                    Best deals
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputValue("Track my order")}
                    data-testid="button-quick-track"
                  >
                    Track order
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
