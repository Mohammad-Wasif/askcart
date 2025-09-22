import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Settings, 
  Plug, 
  MessageSquare, 
  Users, 
  ShoppingCart, 
  Clock, 
  Star,
  Copy,
  Download,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { WidgetConfig } from "@shared/schema";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
}

export default function AdminDashboard({ isOpen, onClose, storeId = "demo-store" }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("analytics");
  const queryClient = useQueryClient();

  // Fetch widget configuration
  const { data: widgetConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/widget-config', storeId],
    enabled: isOpen
  });

  // Fetch analytics summary
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/summary'],
    enabled: isOpen && activeTab === "analytics"
  });

  // Fetch recent conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations/recent'],
    enabled: isOpen && activeTab === "conversations"
  });

  // Update widget configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<WidgetConfig>) => {
      const response = await apiRequest('PUT', `/api/widget-config/${storeId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/widget-config', storeId] });
      // Also invalidate any cached queries to ensure widget updates
      queryClient.invalidateQueries({ queryKey: ['/api/widget-config'] });
    }
  });

  const handleConfigUpdate = (field: string, value: any) => {
    updateConfigMutation.mutate({ [field]: value });
  };

  const copyIntegrationCode = () => {
    const code = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.setAttribute('data-api-key', 'your-api-key-here');
    script.setAttribute('data-store-id', '${storeId}');
    document.head.appendChild(script);
  })();
</script>`;
    
    navigator.clipboard.writeText(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">AskCart AI Dashboard</CardTitle>
              <p className="text-muted-foreground">Configure your AI shopping assistant</p>
            </div>
            <Button variant="ghost" onClick={onClose} data-testid="button-close-admin">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="configuration" className="flex items-center gap-2" data-testid="tab-configuration">
                <Settings className="w-4 h-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center gap-2" data-testid="tab-integration">
                <Plug className="w-4 h-4" />
                Integration
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-2" data-testid="tab-conversations">
                <MessageSquare className="w-4 h-4" />
                Conversations
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {analyticsLoading ? (
                <div className="text-center py-8">Loading analytics...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Conversations</p>
                            <p className="text-2xl font-bold" data-testid="text-total-conversations">
                              {(analytics as any)?.totalConversations || 0}
                            </p>
                          </div>
                          <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">+23% from last month</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                            <p className="text-2xl font-bold" data-testid="text-conversions">
                              {(analytics as any)?.conversions || 0}
                            </p>
                          </div>
                          <ShoppingCart className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">14.9% conversion rate</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                            <p className="text-2xl font-bold" data-testid="text-response-time">
                              {(analytics as any)?.avgResponseTime || 0}s
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">-0.3s improvement</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                            <p className="text-2xl font-bold" data-testid="text-satisfaction">
                              {(analytics as any)?.satisfaction || 0}
                            </p>
                          </div>
                          <Star className="w-8 h-8 text-yellow-400" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Based on 1,249 ratings</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              {configLoading ? (
                <div className="text-center py-8">Loading configuration...</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Widget Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position">Widget Position</Label>
                        <Select 
                          value={(widgetConfig as any)?.position || "bottom-right"}
                          onValueChange={(value) => handleConfigUpdate('position', value)}
                        >
                          <SelectTrigger data-testid="select-position">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={(widgetConfig as any)?.primaryColor || "#3b82f6"}
                            onChange={(e) => handleConfigUpdate('primaryColor', e.target.value)}
                            className="w-12 h-10"
                            data-testid="input-color"
                          />
                          <Input
                            type="text"
                            value={(widgetConfig as any)?.primaryColor || "#3b82f6"}
                            onChange={(e) => handleConfigUpdate('primaryColor', e.target.value)}
                            className="flex-1"
                            data-testid="input-color-text"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <Textarea
                          value={(widgetConfig as any)?.welcomeMessage || ""}
                          onChange={(e) => handleConfigUpdate('welcomeMessage', e.target.value)}
                          rows={2}
                          data-testid="textarea-welcome"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoOpen">Auto-Open Widget</Label>
                        <Switch
                          checked={(widgetConfig as any)?.autoOpen || false}
                          onCheckedChange={(checked) => handleConfigUpdate('autoOpen', checked)}
                          data-testid="switch-auto-open"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Integration Tab */}
            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Code</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Copy and paste this code snippet before the closing &lt;/body&gt; tag of your website:
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre data-testid="text-integration-code">{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.setAttribute('data-api-key', 'your-api-key-here');
    script.setAttribute('data-store-id', '${storeId}');
    document.head.appendChild(script);
  })();
</script>`}</pre>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={copyIntegrationCode} data-testid="button-copy-code">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button variant="outline" data-testid="button-download-guide">
                      <Download className="w-4 h-4 mr-2" />
                      Download Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="text-center py-8">Loading conversations...</div>
                  ) : (
                    <div className="space-y-4">
                      {(conversations as any)?.map((conversation: any) => (
                        <div key={conversation.id} className="flex items-start space-x-3 p-3 bg-secondary rounded-lg">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium" data-testid={`text-customer-${conversation.id}`}>
                                {conversation.customerName || "Anonymous User"}
                              </h4>
                              <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${conversation.id}`}>
                                {new Date(conversation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1" data-testid={`text-message-${conversation.id}`}>
                              {conversation.lastMessage}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge 
                                variant={conversation.status === 'resolved' ? 'default' : 'secondary'}
                                data-testid={`badge-status-${conversation.id}`}
                              >
                                {conversation.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {conversation.messageCount} messages
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
