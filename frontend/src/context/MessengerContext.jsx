import { createContext, useContext, useEffect, useState } from 'react';
import { configApi } from '../lib/api';

const MessengerContext = createContext({ pageId: '', loading: true });

export function MessengerProvider({ children }) {
  const [pageId, setPageId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configApi
      .getMessenger()
      .then((json) => {
        setPageId(json?.data?.pageId || '');
      })
      .catch(() => {
        setPageId('');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <MessengerContext.Provider value={{ pageId, loading }}>
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  return useContext(MessengerContext);
}
