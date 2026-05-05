"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcryptjs_1 = require("bcryptjs");
const dotenv = __importStar(require("dotenv"));
const database_config_1 = require("../config/database.config");
dotenv.config();
const config = (0, database_config_1.databaseConfig)();
const AppDataSource = new typeorm_1.DataSource({
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
        const hashedPassword = await (0, bcryptjs_1.hash)(defaultPassword, 10);
        const usersToSeed = [
            { name: 'Super Admin', email: 'admin@gmail.com', role: 'super_admin' },
            { name: 'Regional Manager', email: 'rm@gmail.com', role: 'rm' },
            { name: 'Accountant', email: 'accountant@gmail.com', role: 'accountant' },
            { name: 'Customer', email: 'user@gmail.com', role: 'user' },
        ];
        console.log('Seeding users...');
        for (const user of usersToSeed) {
            const existingRows = await queryRunner.query(`SELECT id FROM users WHERE email = ?`, [user.email]);
            if (existingRows.length > 0) {
                console.log(`User ${user.email} already exists. Skipping.`);
                continue;
            }
            await queryRunner.query(`INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`, [user.name, user.email, hashedPassword, user.role]);
            console.log(`Created ${user.role} user: ${user.email}`);
        }
        console.log('\nSeeding completed successfully!');
        console.log(`All seeded users use the password: ${defaultPassword}`);
        await queryRunner.release();
    }
    catch (error) {
        console.error('Error during seeding:', error);
    }
    finally {
        await AppDataSource.destroy();
        console.log('Database connection closed.');
    }
}
seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map