import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/services/prisma-client-options';
import { normalizeAdminServiceInput } from '../src/modules/backoffice/application/admin.mapper';

async function main() {
  const options = createPrismaClientOptions();
  const prisma = new PrismaClient(options);
  try {
    const testInput = {
      pricing_plans: [
        {
          name: "Salaried ITR",
          price: "899",
          features: [
            "ITR-1 / ITR-2 filing",
            "Form 16 processing",
            "Refund tracking"
          ]
        },
        {
          name: "Business ITR (without Accounting)",
          price: "1499",
          features: [
            "ITR-3 / ITR-4 filing",
            "Presumptive income computation",
            "Deduction optimisation"
          ]
        },
        {
          name: "Business ITR (with Accounting)",
          price: "2499",
          features: [
            "Full bookkeeping",
            "P&L and Balance Sheet",
            "ITR-3 filing with compliance support"
          ]
        }
      ]
    };

    const normalized = normalizeAdminServiceInput(testInput);
    console.log("NORMALIZED INPUT:", JSON.stringify(normalized, null, 2));

    const updated = await prisma.service.update({
      where: { id: 27 },
      data: normalized,
    });
    
    console.log("UPDATED DATABASE RECORD pricingPlans:");
    console.log(JSON.stringify(updated.pricingPlans, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
