import React from 'react';
const MEASURE_ROWS = 14;
const SWATCHES = 3;
const CALLOUTS = 6;
const NOTE_LINES = 5;
const ink = '#1d1c18';

/**
 * Blank A4 worker design copy (210 × 297 mm), filled in by hand.
 * Customer / order / store across the top, measurements on the left,
 * the design with numbered call-outs and fabric strip on the right, notes at the bottom.
 * No prices or phone numbers — this sheet travels with the garment through the workshop.
 */
export function WorkerDesignCopy() {
  return <article className="a4-sheet mx-auto flex flex-col bg-white text-[#1d1c18] shadow-[0_2px_24px_rgba(46,45,38,0.12)]" style={{
    width: '210mm',
    height: '297mm',
    padding: '12mm 12mm 10mm'
  }} aria-label="Blank worker design copy">
      {/* Top strip */}
      <div className="flex items-end justify-between gap-[6mm] text-[9pt] text-[#55534a]">
        <span className="font-semibold tracking-[0.18em] text-[#1d1c18]">DARZAAN</span>
        <span className="flex items-end gap-[2mm]">Worker design copy · <Blank w="28mm" /></span>
        <span className="flex items-end gap-[2mm]">Issued <DateBlank /></span>
      </div>

      {/* Customer · Order · Store */}
      <header className="mt-[5mm] grid grid-cols-[1.4fr_1fr_1fr_auto] items-end gap-[6mm] border-b-[1.5pt] border-[#1d1c18] pb-[4mm]">
        <HeadField label="Customer" />
        <HeadField label="Order #" />
        <HeadField label="Store" />
        <div className="flex h-[20mm] w-[20mm] items-center justify-center border-[0.75pt] border-dashed border-[#8a8679] text-center text-[6.5pt] leading-tight text-[#6b685d]">Stick<br />QR label</div>
      </header>
      <div className="mt-[3mm] grid grid-cols-[2fr_1fr_1fr] gap-x-[6mm] text-[9.5pt]">
        <span className="flex items-end gap-[2mm]"><span className="text-[#6b685d]">Garment</span><Blank /></span>
        <span className="flex items-end gap-[2mm]"><span className="text-[#6b685d]">Trial</span><DateBlank /></span>
        <span className="flex items-end gap-[2mm]"><span className="text-[#6b685d]">Due</span><DateBlank /></span>
      </div>

      {/* Measurements + Design */}
      <div className="mt-[5mm] grid min-h-0 flex-1 grid-cols-[60mm_1fr] gap-[5mm]">
        <section className="flex min-h-0 flex-col">
          <h2 className="mb-[2mm] text-[10pt] font-semibold">Measurements <span className="font-normal text-[#6b685d]">(inches)</span></h2>
          <table className="w-full border-collapse border-[0.75pt] border-[#1d1c18] text-[9.5pt]">
            <thead>
              <tr className="bg-[#efece4] text-left text-[8pt] uppercase tracking-wide text-[#55534a]" style={{
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}>
                <th className="border-b-[0.75pt] border-[#1d1c18] px-[2mm] py-[1.5mm] font-semibold">Point</th>
                <th className="w-[16mm] border-b-[0.75pt] border-l-[0.5pt] border-[#1d1c18] px-[2mm] py-[1.5mm] text-right font-semibold">in</th>
                <th className="w-[9mm] border-b-[0.75pt] border-l-[0.5pt] border-[#1d1c18] px-[1mm] py-[1.5mm] text-center font-semibold">✓</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({
              length: MEASURE_ROWS
            }).map((_, i) => <tr key={i} className="h-[7.4mm] border-b-[0.5pt] border-[#bdb9ad] last:border-b-0">
                  <td />
                  <td className="border-l-[0.5pt] border-[#bdb9ad]" />
                  <td className="border-l-[0.5pt] border-[#bdb9ad]" />
                </tr>)}
            </tbody>
          </table>
          <p className="mt-[2mm] text-[8pt] leading-snug text-[#6b685d]">Tick each point after checking on the garment.</p>
        </section>

        <section className="flex min-h-0 flex-col border-[0.75pt] border-[#1d1c18]">
          <h2 className="border-b-[0.75pt] border-[#1d1c18] px-[3mm] py-[1.8mm] text-[10pt] font-semibold">Design</h2>
          <div className="grid min-h-0 flex-1 grid-cols-[22mm_1fr]">
            {/* Fabric strip */}
            <div className="flex flex-col gap-[3mm] border-r-[0.5pt] border-[#bdb9ad] p-[2.5mm]">
              <span className="text-[7.5pt] font-semibold uppercase tracking-wide text-[#55534a]">Fabric</span>
              {Array.from({
              length: SWATCHES
            }).map((_, i) => <div key={i}>
                  <div className="h-[16mm] w-full border-[0.75pt] border-dashed border-[#8a8679]" />
                  <div className="mt-[1.5mm] h-[4mm] border-b-[0.5pt] border-[#bdb9ad]" />
                  <div className="h-[4mm] border-b-[0.5pt] border-[#bdb9ad]" />
                </div>)}
              <p className="mt-auto text-[7pt] leading-tight text-[#6b685d]">Pin a patch in each box · code and use below</p>
            </div>

            {/* Sketch area with numbered call-outs */}
            <div className="flex min-h-0 flex-col">
              <div className="relative min-h-0 flex-1">
                <span className="absolute bottom-[2mm] right-[3mm] text-[7pt] text-[#a29e91]">Sketch the design · mark points 1–{CALLOUTS}</span>
              </div>
              <ol className="grid grid-cols-2 gap-x-[4mm] gap-y-[1.5mm] border-t-[0.5pt] border-[#bdb9ad] px-[3mm] py-[2.5mm] text-[8.5pt]">
                {Array.from({
                length: CALLOUTS
              }).map((_, i) => <li key={i} className="flex items-end gap-[1.8mm]">
                    <span className="flex h-[4.5mm] w-[4.5mm] shrink-0 items-center justify-center rounded-full border-[0.75pt] border-[#1d1c18] font-mono text-[7pt] font-semibold">{i + 1}</span>
                    <Blank />
                  </li>)}
              </ol>
            </div>
          </div>
        </section>
      </div>

      {/* Notes */}
      <section className="mt-[5mm] border-[0.75pt] border-[#1d1c18] px-[3mm] pb-[2mm] pt-[1.8mm]">
        <h2 className="text-[10pt] font-semibold">Notes</h2>
        <div className="mt-[1mm]">
          {Array.from({
          length: NOTE_LINES
        }).map((_, i) => <div key={i} className="h-[6.5mm] border-b-[0.5pt] border-[#bdb9ad]" />)}
        </div>
      </section>

      {/* Sign-off */}
      <footer className="mt-[4mm] grid grid-cols-4 gap-[5mm] text-[8pt] text-[#55534a]">
        {['Cut by', 'Stitched by', 'Embroidery by', 'QC'].map((s) => <div key={s}>
            <div className="h-[7mm]" />
            <div className="border-t-[0.5pt] border-[#8a8679] pt-[1mm]">{s}</div>
          </div>)}
      </footer>
    </article>;
}
function HeadField({
  label


}: {label: string;}) {
  return <div className="min-w-0">
      <p className="text-[8pt] uppercase tracking-wide text-[#6b685d]">{label}</p>
      <div className="mt-[1mm] h-[8mm] border-b-[0.75pt]" style={{
      borderColor: ink
    }} />
    </div>;
}

/** A write-in line that fills the space it's given. */
function Blank({
  w


}: {w?: string;}) {
  return <span className="inline-block h-[4mm] min-w-0 flex-1 border-b-[0.5pt] border-[#8a8679]" style={w ? {
    width: w,
    flex: 'none'
  } : undefined} />;
}
function DateBlank() {
  return <span className="font-mono tabular text-[#8a8679]">__ / __ / ____</span>;
}