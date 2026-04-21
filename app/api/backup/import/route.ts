export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toInteger(value: unknown, fallback = 0) {
  const number = toNumber(value, fallback);
  return Number.isInteger(number) ? number : fallback;
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const backup = body;

    if (!backup?.data) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }

    const hourlyRates = Array.isArray(backup.data.hourlyRates) ? backup.data.hourlyRates : [];
    const roRecords = Array.isArray(backup.data.roRecords) ? backup.data.roRecords : [];
    const paychecks = Array.isArray(backup.data.paychecks) ? backup.data.paychecks : [];
    const uploadHistory = Array.isArray(backup.data.uploadHistory) ? backup.data.uploadHistory : [];

    let importedRates = 0;
    let importedRecords = 0;
    let importedLines = 0;
    let importedPaychecks = 0;
    let importedUploads = 0;

    await prisma.$transaction(async (tx) => {
      for (const rate of hourlyRates) {
        const rateAmount = toNumber(rate?.rate, NaN);

        if (!Number.isFinite(rateAmount)) {
          continue;
        }

        const existing = await tx.hourlyRate.findFirst({
          where: {
            userId,
            rate: rateAmount,
            effectiveFrom: toDate(rate.effectiveFrom) ?? undefined,
          },
        });

        if (!existing) {
          await tx.hourlyRate.create({
            data: {
              rate: rateAmount,
              effectiveFrom: toDate(rate.effectiveFrom) ?? new Date(),
              effectiveTo: toDate(rate.effectiveTo),
              userId,
            },
          });
          importedRates++;
        }
      }

      for (const record of roRecords) {
        if (!record?.roNumber) {
          continue;
        }

        const existingRecord = await tx.roRecord.findFirst({
          where: {
            userId,
            roNumber: record.roNumber,
            vehicleDescription: record.vehicleDescription ?? null,
            roCompletedDate: toDate(record.roCompletedDate) ?? undefined,
          },
        });

        if (existingRecord) {
          continue;
        }

        const createdRecord = await tx.roRecord.create({
          data: {
            roNumber: record.roNumber,
            roCompletedDate: toDate(record.roCompletedDate) ?? new Date(),
            vehicleYear: record.vehicleYear == null ? null : toInteger(record.vehicleYear),
            vehicleMake: record.vehicleMake ?? null,
            vehicleModel: record.vehicleModel ?? null,
            vehicleTrim: record.vehicleTrim ?? null,
            vehicleDescription: record.vehicleDescription ?? null,
            billedHours: toNumber(record.billedHours),
            laborSale: toNumber(record.laborSale),
            partsSale: toNumber(record.partsSale),
            subletSale: toNumber(record.subletSale),
            totalSale: toNumber(record.totalSale),
            customerName: record.customerName ?? null,
            customerNumber: record.customerNumber ?? null,
            jobDescriptions: record.jobDescriptions ?? null,
            userId,
          },
        });

        importedRecords++;

        const jobLines = Array.isArray(record.jobLines) ? record.jobLines : [];
        for (const line of jobLines) {
          await tx.roJobLine.create({
            data: {
              roRecordId: createdRecord.id,
              lineNumber: line.lineNumber == null ? null : toInteger(line.lineNumber),
              jobDescription: line.jobDescription ?? null,
              billedHours: toNumber(line.billedHours),
              laborSale: toNumber(line.laborSale),
              partsSale: toNumber(line.partsSale),
              subletSale: toNumber(line.subletSale),
              totalSale: toNumber(line.totalSale),
              customerName: line.customerName ?? null,
              customerNumber: line.customerNumber ?? null,
              roCompletedDate: toDate(line.roCompletedDate) ?? toDate(record.roCompletedDate) ?? new Date(),
            },
          });
          importedLines++;
        }
      }

      for (const paycheck of paychecks) {
        const weekNumber = Number(paycheck?.weekNumber);
        const year = Number(paycheck?.year);
        const paycheckDate = toDate(paycheck?.paycheckDate);

        if (!Number.isInteger(weekNumber) || !Number.isInteger(year) || !paycheckDate) {
          continue;
        }

        const existing = await tx.paycheck.findFirst({
          where: {
            userId,
            weekNumber,
            year,
          },
        });

        if (!existing) {
          await tx.paycheck.create({
            data: {
              weekNumber,
              year,
              paycheckDate,
              grossPay: toNumber(paycheck.grossPay),
              netPay: toNumber(paycheck.netPay),
              hoursReceived: toNumber(paycheck.hoursReceived),
              notes: paycheck.notes ?? null,
              userId,
            },
          });
          importedPaychecks++;
        }
      }

      for (const item of uploadHistory) {
        if (!item?.fileName) {
          continue;
        }

        const existing = await tx.uploadHistory.findFirst({
          where: {
            userId,
            fileName: item.fileName,
          },
        });

        if (!existing) {
          await tx.uploadHistory.create({
            data: {
              fileName: item.fileName ?? 'imported-backup',
              totalRows: toInteger(item.totalRows),
              newRecords: toInteger(item.newRecords),
              duplicates: toInteger(item.duplicates),
              errors: toInteger(item.errors),
              status: item.status ?? 'completed',
              uploadedAt: toDate(item.uploadedAt) ?? undefined,
              userId,
            },
          });
          importedUploads++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      importedRates,
      importedRecords,
      importedLines,
      importedPaychecks,
      importedUploads,
    });
  } catch (err: any) {
    console.error('Backup import failed:', err);
    return NextResponse.json({ error: 'Backup import failed' }, { status: 500 });
  }
}
