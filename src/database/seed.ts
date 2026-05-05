import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';
import { databaseConfig } from '../config/database.config';

dotenv.config();

const config = databaseConfig();

const AppDataSource = new DataSource({
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
});

async function seed() {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected!');

    try {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        const defaultPassword = 'password';
        const hashedPassword = await hash(defaultPassword, 10);

        const usersToSeed = [
            { name: 'Super Admin', email: 'admin@gmail.com', role: 'super_admin' },
            { name: 'Regional Manager', email: 'rm@gmail.com', role: 'rm' },
            { name: 'Accountant', email: 'accountant@gmail.com', role: 'accountant' },
            { name: 'Customer', email: 'user@gmail.com', role: 'user' },
        ];

        console.log('Seeding users...');

        for (const user of usersToSeed) {
            const existingRows = await queryRunner.query(
                `SELECT id FROM users WHERE email = ?`,
                [user.email]
            );

            if (existingRows.length > 0) {
                console.log(`User ${user.email} already exists. Skipping.`);
                continue;
            }

            await queryRunner.query(
                `INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [user.name, user.email, hashedPassword, user.role]
            );
            console.log(`Created ${user.role} user: ${user.email}`);
        }

        console.log('\nSeeding completed successfully!');
        console.log(`All seeded users use the password: ${defaultPassword}`);

        await queryRunner.release();
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await AppDataSource.destroy();
        console.log('Database connection closed.');
    }
}

seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
});
