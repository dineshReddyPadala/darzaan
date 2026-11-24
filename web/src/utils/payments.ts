/** Ledger line: method once, then a real transaction reference (not staff name / "auto"). */
export function paymentReferenceLabel(method: string, reference: string | undefined, recordedBy: string): { primary: string; secondary: string } {
  const ref = (reference ?? '').trim();
  const junk = !ref || ref.toLowerCase() === 'auto' || ref === recordedBy;
  const primary = junk ? method : `${method} · ${ref}`;
  return { primary, secondary: recordedBy };
}