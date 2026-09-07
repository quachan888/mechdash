export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(text: string): CsvRow[] {
  const sanitizedText = text.replace(/^\uFEFF/, '');
  const parsedRows = parseCsvRows(sanitizedText);

  if (parsedRows.length < 2) return [];

  const headerLine = parsedRows[0] ?? [];
  const headers = headerLine.map((header: string) => header.trim());

  const rows: CsvRow[] = [];
  for (let i = 1; i < parsedRows.length; i++) {
    const values = parsedRows[i] ?? [];

    // Filter out repeated header rows
    if (values?.[0] === headerLine?.[0] && values?.[1] === headerLine?.[1]) continue;
    // Skip empty rows
    if (values.every((v: string) => !v?.trim?.())) continue;

    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j] ?? `col_${j}`;
      const value = values[j] ?? '';
      row[header] = value.trim();
    }
    rows.push(row);
  }

  return rows;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i] ?? '';
    const nextChar = text[i + 1] ?? '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      currentRow.push(currentValue);
      if (currentRow.some((value) => value.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}
