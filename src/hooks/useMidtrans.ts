// Path: src/hooks/useMidtrans.ts

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    snap: any;
  }
}

export const useMidtrans = () => {
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  useEffect(() => {
    // Ganti URL sesuai mode (Sandbox/Production)
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'; 
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || ''; 

    const scriptId = 'midtrans-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.onload = () => setIsSnapLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsSnapLoaded(true);
    }
  }, []);

  const pay = (token: string, callbacks?: {
    onSuccess?: (result: any) => void;
    onPending?: (result: any) => void;
    onError?: (result: any) => void;
    onClose?: () => void;
  }) => {
    if (window.snap && isSnapLoaded) {
      window.snap.pay(token, {
        onSuccess: (result: any) => callbacks?.onSuccess?.(result),
        onPending: (result: any) => callbacks?.onPending?.(result),
        onError: (result: any) => callbacks?.onError?.(result),
        onClose: () => callbacks?.onClose?.(),
      });
    }
  };

  return { pay, isSnapLoaded };
};