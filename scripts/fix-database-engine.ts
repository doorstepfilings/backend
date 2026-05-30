import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function main() {
  console.log('Starting Database Engine Fix Script...');

  // Parse .env manually to be safe
  const envPath = path.resolve(process.cwd(), '.env');
  const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const envVars = {
    ...process.env,
    ...Object.fromEntries(
      envFile.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
          const index = line.indexOf('=');
          if (index === -1) return [line, ''];
          let key = line.substring(0, index).trim();
          let value = line.substring(index + 1).trim();
          if (value.startsWith('"') && value.endsWith('"')) {
             value = value.substring(1, value.length - 1);
          }
          return [key, value];
        })
    )
  };

  const host = envVars['DB_HOST'] || '127.0.0.1';
  const port = parseInt(envVars['DB_PORT'] || '3306', 10);
  const user = envVars['DB_USERNAME'] || 'root';
  const password = envVars['DB_PASSWORD'] || '';
  const databaseName = envVars['DB_DATABASE'];

  if (!databaseName) {
    throw new Error('DB_DATABASE not found in .env');
  }

  console.log(`Connecting to ${host}:${port} database: ${databaseName}`);
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: databaseName,
  });

  try {
    console.log('\n0. Forcing MySQL server default engine to InnoDB...');
    try {
      await connection.query("SET GLOBAL default_storage_engine = 'InnoDB';");
      await connection.query("SET SESSION default_storage_engine = 'InnoDB';");
      console.log(' - Server default engine successfully set to InnoDB.');
    } catch (e: any) {
      console.log(` - Note: Could not set GLOBAL default engine (you may not have ROOT privileges): ${e.message}`);
      console.log(' - Attempting to set SESSION default engine instead...');
      await connection.query("SET SESSION default_storage_engine = 'InnoDB';");
    }

    console.log('\n1. Cleaning up failed migration state...');
    
    // Drop table if exists
    try {
      await connection.query('DROP TABLE IF EXISTS `service_stage_templates`;');
      console.log(' - Dropped `service_stage_templates` if it existed.');
    } catch (e: any) {
      console.log(` - Note: Failed to drop service_stage_templates: ${e.message}`);
    }

    // Drop columns if exist
    try {
      await connection.query(`
        ALTER TABLE \`user_services\` 
        DROP COLUMN \`client_message\`,
        DROP COLUMN \`current_stage_template_id\`,
        DROP COLUMN \`current_stage_updated_at\`;
      `);
      console.log(' - Dropped partial columns from `user_services`.');
    } catch (e: any) {
      console.log(` - Note: Could not drop columns from user_services (they might not exist): ${e.message}`);
    }

    console.log('\n2. Converting MyISAM tables to InnoDB...');
    const [rows] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND engine = 'MyISAM'
    `, [databaseName]);

    const tables = rows as any[];
    if (tables.length === 0) {
      console.log(' - No MyISAM tables found to convert.');
    } else {
      for (const row of tables) {
        const tableName = row.TABLE_NAME || row.table_name;
        console.log(` - Converting table: ${tableName}`);
        await connection.query(`ALTER TABLE \`${tableName}\` ENGINE=InnoDB;`);
      }
      console.log(' - All tables successfully converted to InnoDB.');
    }

    console.log('\n3. Marking migration as rolled back in Prisma...');
    try {
      const output = execSync('npx prisma migrate resolve --rolled-back "20260519113000_add_service_stage_templates"', { encoding: 'utf8' });
      console.log(' - Migration resolved:', output.trim());
    } catch (e: any) {
      console.log(' - Note: Failed to resolve migration (it might already be resolved or not recorded):', e.message);
    }

    console.log('\n✅ Fix completed successfully! You can now safely run `npx prisma migrate deploy`.');
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
