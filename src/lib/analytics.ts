// Basic Analytics Wrapper

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // In a real production environment, this would send data to Mixpanel, Google Analytics, etc.
  console.log(`[Analytics Event]: ${eventName}`, properties || {});
};

export const trackPageView = (pageName: string) => {
  console.log(`[Analytics Page View]: ${pageName}`);
};
