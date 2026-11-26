import React, { createContext, useContext } from 'react';
import type { GeneralPropsState } from '../types/erp';

const ReportPropsContext = createContext<GeneralPropsState | null>(null);

export const ReportPropsProvider: React.FC<{
  value: GeneralPropsState | null;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <ReportPropsContext.Provider value={value}>{children}</ReportPropsContext.Provider>
);

export const useReportProps = (): GeneralPropsState | null => useContext(ReportPropsContext);
