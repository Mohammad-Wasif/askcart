import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatWidget from "@/components/ChatWidget";
import type { WidgetConfig } from "@shared/schema";

// This page would be used for the embeddable widget
export default function EmbedWidget() {
  const [storeId, setStoreId] = useState<string>("");

  useEffect(() => {
    // Extract store ID from script tag attributes or URL params
    const scripts = document.querySelectorAll('script[data-store-id]');
    const lastScript = scripts[scripts.length - 1];
    const extractedStoreId = lastScript?.getAttribute('data-store-id') || 
                           new URLSearchParams(window.location.search).get('storeId') || 
                           'demo-store';
    setStoreId(extractedStoreId);
  }, []);

  // Fetch widget configuration
  const { data: config } = useQuery<WidgetConfig>({
    queryKey: ['/api/widget-config', storeId],
    enabled: !!storeId
  });

  if (!storeId || !config) {
    return null;
  }

  return (
    <div>
      <ChatWidget
        storeId={storeId}
        primaryColor={config.primaryColor}
        position={config.position}
        welcomeMessage={config.welcomeMessage}
        autoOpen={config.autoOpen}
      />
    </div>
  );
}
