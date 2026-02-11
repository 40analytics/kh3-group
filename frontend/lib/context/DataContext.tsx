'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Lead, Client } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MOCK_LEADS, MOCK_CLIENTS } from '../constants';

interface DataContextType {
  leads: Lead[];
  setLeads: (leads: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  clients: Client[];
  setClients: (
    clients: Client[] | ((prev: Client[]) => Client[])
  ) => void;
}

const DataContext = createContext<DataContextType | undefined>(
  undefined
);

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useLocalStorage<Lead[]>(
    'crm_leads',
    MOCK_LEADS
  );
  const [clients, setClients] = useLocalStorage<Client[]>(
    'crm_clients',
    MOCK_CLIENTS
  );

  return (
    <DataContext.Provider
      value={{ leads, setLeads, clients, setClients }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
