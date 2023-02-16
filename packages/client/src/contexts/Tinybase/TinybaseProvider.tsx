import React, { useEffect, useMemo, useState } from 'react';
import {
  createStore, createLocalPersister, Store, Persister, Queries, createQueries,
} from 'tinybase';

import TinybaseContext, { TTinybaseContext } from './TinybaseContext';

type TTinybaseState = {
  store: Store | undefined,
  persister: Persister | undefined,
  queries: Queries | undefined,
  autoSaveReady: boolean,
  tinybaseReady: boolean,
};

function TinybaseProvider({ children }: { children: React.ReactNode }) {
  const [tinybaseState, setTinybaseState] = useState<TTinybaseState>({
    store: undefined,
    persister: undefined,
    queries: undefined,
    autoSaveReady: false,
    tinybaseReady: false,
  });

  useEffect(() => {
    const { tinybaseReady } = tinybaseState;

    const setupTinybase = async () => {
      let { store, persister, queries } = tinybaseState;

      if (!store) {
        store = createStore();
        store.setTablesSchema({
          packets: {
            id: { type: 'string' },
            data: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
          byteRanges: {
            id: { type: 'string' },
            packetId: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
            foregroundColor: { type: 'string' },
          },
        });
      }

      if (!queries) {
        queries = createQueries(store);
      }

      if (!persister) {
        persister = createLocalPersister(store, 'vortexPacketAnalyzer');
      }

      await persister.load();
      await persister.startAutoSave();

      setTinybaseState({
        store,
        persister,
        queries,
        autoSaveReady: true,
        tinybaseReady: true,
      });
    };

    if (!tinybaseReady) {
      setupTinybase();
    }
  }, [tinybaseState]);

  const value = useMemo(() => {
    const { tinybaseReady, store, queries } = tinybaseState;

    if (!tinybaseReady || !store || !queries) {
      return null;
    }

    const tinybaseContextValue: TTinybaseContext = {
      store,
      queries,
    };

    return tinybaseContextValue;
  }, [tinybaseState]);

  if (!value) {
    return (
      <progress />
    );
  }

  return (
    <TinybaseContext.Provider value={value}>
      {children}
    </TinybaseContext.Provider>
  );
}

export default TinybaseProvider;
