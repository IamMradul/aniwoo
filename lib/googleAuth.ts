// Google Authentication Service using Google Identity Services
// This is separate from Supabase OAuth

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type: string;
              theme: string;
              size: string;
              text: string;
              shape: string;
              logo_alignment: string;
            }
          ) => void;
        };
      };
    };
  }
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const initializeGoogleAuth = (
  clientId: string,
  callback: (response: GoogleCredentialResponse) => void
) => {
  if (!window.google?.accounts?.id) {
    console.error('Google Identity Services not loaded');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: callback,
  });
};

export const decodeGoogleToken = (credential: string): {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
} => {
  try {
    // JWT token has 3 parts separated by dots
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const decoded = JSON.parse(atob(base64));

    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
      picture: decoded.picture,
      email_verified: decoded.email_verified,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
    };
  } catch (error) {
    console.error('Error decoding Google token:', error);
    throw error;
  }
};
