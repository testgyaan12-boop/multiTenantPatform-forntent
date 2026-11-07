import { useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { DiningTable } from '@resto/types';
import { publicUrl } from './tablesUtils';

interface QrPrintSheetProps {
  tables: DiningTable[];
  restaurantName: string;
  branchName: string;
  onDone: () => void;
}

const PRINT_CSS = `
.qr-print-root { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .qr-print-root, .qr-print-root * { visibility: visible !important; }
  .qr-print-root {
    display: grid !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
    gap: 12mm;
    padding: 12mm;
    background: #ffffff;
  }
  .qr-print-label {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px dashed #CBD2DC;
    border-radius: 4mm;
    padding: 8mm 6mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3mm;
    text-align: center;
    font-family: Inter, Arial, sans-serif;
    color: #172033;
  }
  .qr-print-brand { font-size: 9pt; font-weight: 700; color: #718096; letter-spacing: 0.04em; text-transform: uppercase; }
  .qr-print-table { font-size: 16pt; font-weight: 800; }
  .qr-print-name { font-size: 11pt; font-weight: 600; color: #718096; }
  .qr-print-hint { font-size: 9.5pt; color: #718096; }
}
`;

export function QrPrintSheet({ tables, restaurantName, branchName, onDone }: QrPrintSheetProps) {
  useEffect(() => {
    if (tables.length === 0) return undefined;
    const handleAfterPrint = () => onDone();
    window.addEventListener('afterprint', handleAfterPrint);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      cancelAnimationFrame(frame);
    };
  }, [tables, onDone]);

  if (tables.length === 0) return null;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="qr-print-root">
        {tables.map((table) => (
          <div key={table.id} className="qr-print-label">
            <div className="qr-print-brand">
              {restaurantName} · {branchName}
            </div>
            <div className="qr-print-table">Table {table.tableNumber}</div>
            {table.name?.trim() ? <div className="qr-print-name">{table.name}</div> : null}
            <QRCodeCanvas value={publicUrl(table)} size={170} marginSize={4} />
            <div className="qr-print-hint">Scan to view the menu and order from your seat</div>
          </div>
        ))}
      </div>
    </>
  );
}
