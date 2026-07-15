
/**
 * Client-side conversion tracking utility
 * Use this to track user events throughout the conversion funnel
 */

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Try to get from localStorage
  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem('conversion_session_id');
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = `session_${globalThis.crypto.randomUUID()}`;
      localStorage.setItem('conversion_session_id', sessionId);
    }
  } else {
    // Fallback for SSR
    sessionId = `session_${globalThis.crypto.randomUUID()}`;
  }
  
  return sessionId;
}

export async function trackConversion(
  eventType: 'landing' | 'view_cohort' | 'start_checkout' | 'complete_payment',
  cohortId?: string,
  eventData?: any
) {
  try {
    const sid = getSessionId();
    
    await fetch('/api/track-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        eventType,
        cohortId,
        eventData,
      }),
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}
