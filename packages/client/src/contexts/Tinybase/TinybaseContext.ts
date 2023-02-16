import { createContext } from 'react';
import type { Queries, Store } from 'tinybase';

export type TTinybaseContext = {
  store: Store
  queries: Queries,
};

const TinybaseContext = createContext<TTinybaseContext>(null!);

export default TinybaseContext;
