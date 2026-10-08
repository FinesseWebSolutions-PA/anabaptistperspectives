import { createContext, useContext, type ReactNode } from 'react';
import type { ContentRecord } from '../data/catalog';

const CatalogContext = createContext<ContentRecord[]>([]);
export function CatalogProvider({ records, children }: { records: ContentRecord[]; children: ReactNode }) {
  return <CatalogContext.Provider value={records}>{children}</CatalogContext.Provider>;
}
export function usePublicCatalog() { return useContext(CatalogContext); }
