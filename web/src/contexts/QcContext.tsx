import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { qcIssues as seedIssues, qcReworks as seedReworks } from '../data/production';
import type { QcDraft, QcInspectionRecord, QcIssue, QcRework, ReworkStep } from '../types';
import { useSharedState } from '../hooks/useSharedState';
interface QcContextValue {
  /** Every QC defect, rework and packing gap — shared so it survives role switches. */
  issues: QcIssue[];
  /** Measurement tolerance in inches (Settings → Workflow). */
  tolerance: number;
  setTolerance: (n: number) => void;
  addIssues: (list: QcIssue[]) => void;
  /** Closes open defects for a garment and records time and note. */
  closeRework: (orderId: string, garmentId: string, mins: number, note: string) => void;
  releaseHeld: (orderId: string, garmentId: string, status?: QcIssue['status']) => void;

  /** In-progress checklist + defect per garment, kept while moving between QC screens. */
  drafts: Record<string, QcDraft>;
  setDraft: (key: string, fn: (d: QcDraft) => QcDraft) => void;
  clearDraft: (key: string) => void;
  inspections: QcInspectionRecord[];
  addInspection: (r: QcInspectionRecord) => void;
  reworks: QcRework[];
  addRework: (r: QcRework) => void;
  advanceRework: (id: string, step: ReworkStep, by: string, at: string) => void;
  closeReworkRecord: (id: string, at: string) => void;
}
const QcContext = createContext<QcContextValue | null>(null);
const emptyDraft: QcDraft = {
  results: {},
  photos: {}
};
export function QcProvider({
  children


}: {children: React.ReactNode;}) {
  const [issues, setIssues] = useSharedState<QcIssue[]>('qcIssues', seedIssues);
  const [tolerance, setTolerance] = useState(0.5);
  const [drafts, setDrafts] = useState<Record<string, QcDraft>>({});
  const [inspections, setInspections] = useSharedState<QcInspectionRecord[]>('qcInspections', []);
  const [reworks, setReworks] = useSharedState<QcRework[]>('qcReworks', seedReworks);
  const addIssues = useCallback((list: QcIssue[]) => setIssues((prev) => [...list, ...prev]), []);
  const matches = (i: QcIssue, orderId: string, garmentId: string) => i.orderId === orderId && i.garmentId === garmentId;
  const closeRework = useCallback((orderId: string, garmentId: string, mins: number, note: string) => setIssues((prev) => prev.map((i) => matches(i, orderId, garmentId) && i.status === 'In rework' ? {
    ...i,
    status: 'Resolved',
    reworkMins: mins || i.reworkMins,
    reworkNote: note || i.reworkNote
  } : i)), []);
  const releaseHeld = useCallback((orderId: string, garmentId: string, status: QcIssue['status'] = 'Resolved') => setIssues((prev) => prev.map((i) => matches(i, orderId, garmentId) && i.status === 'With Production Head' ? {
    ...i,
    status
  } : i)), []);
  const setDraft = useCallback((key: string, fn: (d: QcDraft) => QcDraft) => setDrafts((p) => ({
    ...p,
    [key]: fn(p[key] ?? emptyDraft)
  })), []);
  const clearDraft = useCallback((key: string) => setDrafts((p) => {
    const next = {
      ...p
    };
    delete next[key];
    return next;
  }), []);
  const addInspection = useCallback((r: QcInspectionRecord) => setInspections((p) => [r, ...p]), []);
  const addRework = useCallback((r: QcRework) => setReworks((p) => [r, ...p]), []);
  const advanceRework = useCallback((id: string, step: ReworkStep, by: string, at: string) => setReworks((p) => p.map((r) => r.id === id && !r.events.some((e) => e.step === step) ? {
    ...r,
    status: step,
    events: [...r.events, {
      step,
      at,
      by
    }]
  } : r)), []);
  const closeReworkRecord = useCallback((id: string, at: string) => setReworks((p) => p.map((r) => r.id === id ? {
    ...r,
    closedAt: at
  } : r)), []);
  const value = useMemo(() => ({
    issues,
    tolerance,
    setTolerance,
    addIssues,
    closeRework,
    releaseHeld,
    drafts,
    setDraft,
    clearDraft,
    inspections,
    addInspection,
    reworks,
    addRework,
    advanceRework,
    closeReworkRecord
  }), [issues, tolerance, addIssues, closeRework, releaseHeld, drafts, setDraft, clearDraft, inspections, addInspection, reworks, addRework, advanceRework, closeReworkRecord]);
  return <QcContext.Provider value={value}>{children}</QcContext.Provider>;
}
export function useQc(): QcContextValue {
  const ctx = useContext(QcContext);
  if (!ctx) throw new Error('useQc must be used inside QcProvider');
  return ctx;
}