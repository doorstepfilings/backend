import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/services/prisma-client-options';

async function main() {
  const options = createPrismaClientOptions();
  const prisma = new PrismaClient(options);
  try {
    const service = await prisma.service.findUnique({
      where: { id: 27 },
      include: { category: true }
    });
    console.log("SERVICE 27 DATA:");
    console.log(JSON.stringify(service, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
