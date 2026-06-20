require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const database = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'doorstep_nest',
  connectionLimit: 10
};

const adapter = new PrismaMariaDb({
  host: database.host,
  port: database.port,
  user: database.username,
  password: database.password,
  database: database.database,
  connectionLimit: database.connectionLimit,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Attempting to delete service ID 31 via Prisma...');
  try {
    const result = await prisma.userService.delete({
      where: { id: 31 }
    });
    console.log('Delete successful:', result);
  } catch (error) {
    console.error('Delete failed with error:');
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
