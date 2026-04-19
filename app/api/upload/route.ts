export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCsv, CsvRow } from '@/lib/csv-parser';
import { parseVehicleDescription } from '@/lib/vehicle-parser';
import { getCurrentUserId } from '@/lib/get-user';
import { getHourlyRateForDate } from '@/lib/earnings';

interface JobLineInput {
  lineNumber: number;
  jobDescription: string;
  billedHours: number;
  laborSale: number;
  partsSale: number;
  subletSale: number;
  customerName: string;
  customerNumber: string;
}

interface AggregatedRO {
  roNumber: string;
  roCompletedDate: Date;
  vehicleDescription: string;
  customerName: string;
  customerNumber: string;
  lines: JobLineInput[];
}

function findColumn(row: CsvRow, possibleNames: string[]): string {
  for (const name of possibleNames) {
    const keys = Object.keys(row ?? {});
    const found = keys.find(
      (k: string) => k?.toLowerCase?.()?.trim?.() === name?.toLowerCase?.()?.trim?.()
    );
    if (found && row[found]) return row[found] ?? '';
  }
  return '';
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const csvText = body?.csvText ?? '';
    const fileName = body?.fileName ?? 'upload.csv';

    if (!csvText) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    const totalRows = rows?.length ?? 0;

    const roMap = new Map<string, AggregatedRO>();

    let lineCounter = 0;

    for (const row of rows ?? []) {
      const roNum =
        findColumn(row, ['Repair Order Number', 'RO Number', 'RO#', 'Repair Order'])?.trim?.() ?? '';
      const dateStr =
        findColumn(row, ['RO Completed Date', 'Completed Date', 'Date Completed', 'Date'])?.trim?.() ?? '';
      const vehicleDesc =
        findColumn(row, ['Vehicle Description', 'Vehicle', 'Vehicle Desc'])?.trim?.() ?? '';
      const billedHours =
        parseFloat(findColumn(row, ['Billed Hours', 'Hours Billed', 'Hours']) || '0') || 0;
      const laborSale =
        parseFloat(findColumn(row, ['Labor Sale', 'Labor $', 'Labor']) || '0') || 0;
      const partsSale =
        parseFloat(findColumn(row, ['Parts Sale', 'Parts $', 'Parts']) || '0') || 0;
      const subletSale =
        parseFloat(findColumn(row, ['Sublet Sale', 'Sublet $', 'Sublet']) || '0') || 0;
      const custName =
        findColumn(row, ['Customer Name', 'Customer', 'Cust Name'])?.trim?.() ?? '';
      const custNum =
        findColumn(row, ['Customer Number', 'Cust #', 'Customer #', 'Cust Number'])?.trim?.() ?? '';
      const jobDesc = (row['Job'] ?? '').toString().trim();

  

      if (!roNum || !dateStr) continue;

      const roDate = new Date(dateStr);
      if (isNaN(roDate.getTime())) continue;

      const key = `${roNum}|${vehicleDesc}|${dateStr}`;

      if (!roMap.has(key)) {
        roMap.set(key, {
          roNumber: roNum,
          roCompletedDate: roDate,
          vehicleDescription: vehicleDesc,
          customerName: custName,
          customerNumber: custNum,
          lines: [],
        });
      }

      lineCounter += 1;

      roMap.get(key)!.lines.push({
        lineNumber: lineCounter,
        jobDescription: jobDesc,
        billedHours,
        laborSale,
        partsSale,
        subletSale,
        customerName: custName,
        customerNumber: custNum,
      });

      const current = roMap.get(key)!;
      if (!current.customerName && custName) current.customerName = custName;
      if (!current.customerNumber && custNum) current.customerNumber = custNum;
    }

    let newRecords = 0;
    let duplicates = 0;
    let errors = 0;

    for (const [, agg] of roMap) {
      try {
        const existing = await prisma.roRecord.findFirst({
          where: {
            roNumber: agg.roNumber,
            vehicleDescription: agg.vehicleDescription,
            roCompletedDate: agg.roCompletedDate,
            userId,
          },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        const vehicle = parseVehicleDescription(agg.vehicleDescription);
        const appliedRate = await getHourlyRateForDate(agg.roCompletedDate, userId);

        const totalBilledHours = agg.lines.reduce((sum, line) => sum + line.billedHours, 0);
        const totalLaborSale = agg.lines.reduce((sum, line) => sum + line.laborSale, 0);
        const totalPartsSale = agg.lines.reduce((sum, line) => sum + line.partsSale, 0);
        const totalSubletSale = agg.lines.reduce((sum, line) => sum + line.subletSale, 0);
        const totalSale = totalLaborSale + totalPartsSale + totalSubletSale;
        const jobDescsStr = agg.lines
          .map((line) => line.jobDescription)
          .filter(Boolean)
          .join(' | ');

        await prisma.roRecord.create({
          data: {
            roNumber: agg.roNumber,
            roCompletedDate: agg.roCompletedDate,
            vehicleYear: vehicle?.year ?? null,
            vehicleMake: vehicle?.make ?? null,
            vehicleModel: vehicle?.model ?? null,
            vehicleTrim: vehicle?.trim ?? null,
            vehicleDescription: agg.vehicleDescription || null,
            billedHours: totalBilledHours,
            laborSale: totalLaborSale,
            partsSale: totalPartsSale,
            subletSale: totalSubletSale,
            customerName: agg.customerName || null,
            customerNumber: agg.customerNumber || null,
            jobDescriptions: jobDescsStr || null,
            totalSale,
            userId,
            jobLines: {
              create: agg.lines.map((line) => {
                const lineTotalSale = line.laborSale + line.partsSale + line.subletSale;
                const earnedAmount = line.billedHours * appliedRate;

                return {
                  lineNumber: line.lineNumber,
                  jobDescription: line.jobDescription || null,
                  billedHours: line.billedHours,
                  laborSale: line.laborSale,
                  partsSale: line.partsSale,
                  subletSale: line.subletSale,
                  totalSale: lineTotalSale,
                  appliedRate,
                  earnedAmount,
                  customerName: line.customerName || null,
                  customerNumber: line.customerNumber || null,
                  roCompletedDate: agg.roCompletedDate,
                };
              }),
            },
          },
        });

        newRecords++;
      } catch (err: any) {
        console.error('Error inserting RO:', err?.message);
        errors++;
      }
    }

    await prisma.uploadHistory.create({
      data: {
        fileName,
        totalRows,
        newRecords,
        duplicates,
        errors,
        status: errors > 0 ? 'completed_with_errors' : 'completed',
        userId,
      },
    });

    return NextResponse.json({ totalRows, newRecords, duplicates, errors });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}