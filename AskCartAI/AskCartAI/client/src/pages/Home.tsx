import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";
import AdminDashboard from "@/components/AdminDashboard";
import type { WidgetConfig } from "@shared/schema";

export default function Home() {
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // Fetch widget configuration
  const { data: widgetConfig, isLoading } = useQuery<WidgetConfig>({
    queryKey: ['/api/widget-config', 'demo-store']
  });

  const sampleProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro",
      price: "$999",
      description: "Latest flagship smartphone",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    },
    {
      id: 2,
      name: "MacBook Pro 14\"",
      price: "$1,999",
      description: "Professional laptop for creators",
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    },
    {
      id: 3,
      name: "AirPods Pro",
      price: "$249",
      description: "Wireless noise-cancelling earbuds",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">TechStore</h1>
              <div className="hidden md:flex space-x-8">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Electronics
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Computers
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mobile
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowAdminDashboard(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-admin-dashboard"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleProducts.map((product) => (
            <Card key={product.id} className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-card-foreground">{product.price}</span>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Information */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">AskCart AI Demo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is a demonstration of the AskCart AI chatbot widget. The chat widget in the bottom-right corner 
            is powered by Google Gemini AI and can help customers find products, compare items, and get support.
            Try asking questions like "I need a laptop under $2000" or "Compare iPhone vs Android phones".
          </p>
        </div>
      </div>

      {/* Chat Widget */}
      {!isLoading && widgetConfig && (
        <ChatWidget 
          storeId="demo-store"
          primaryColor={widgetConfig.primaryColor}
          position={widgetConfig.position}
          welcomeMessage={widgetConfig.welcomeMessage}
          autoOpen={widgetConfig.autoOpen}
        />
      )}

      {/* Admin Dashboard */}
      <AdminDashboard 
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
        storeId="demo-store"
      />
    </div>
  );
}
