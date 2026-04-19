export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((line: string) => line.trim());
  if (lines.length < 2) return [];
  
  const headerLine = lines[0] ?? '';
  const headers = parseCSVLine(headerLine);
  
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const values = parseCSVLine(line);
    
    // Filter out repeated header rows
    if (values?.[0] === headers?.[0] && values?.[1] === headers?.[1]) continue;
    // Skip empty rows
    if (values.every((v: string) => !v?.trim?.())) continue;
    
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]?.trim() ?? `col_${j}`] = values[j]?.trim?.() ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < (line?.length ?? 0); i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
