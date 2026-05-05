import { randomBytes } from 'crypto';

export class UniqueIDGenerator {
    static generateUserUniqueID(role: string): string {
        const prefix = role === 'regional_manager' ? 'RM' : 'ACC';
        const sequence = Math.floor(Math.random() * 1000000);
        return `${prefix}${sequence.toString().padStart(6, '0')}`;
    }

    static generateSystemUniqueID(role: string): string {
        const mapping: Record<string, string> = {
            regional_manager: 'RM',
            accountant: 'ACC',
        };
        const rolePrefix = mapping[role] || 'USR';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSF${rolePrefix}${date}${random}`;
    }

    static generateOrderID(): string {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSFORD${date}${random}`;
    }

    static generateInvoiceID(): string {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSFINV${date}${random}`;
    }

    static generateApplicationID(serviceName: string): string {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const cleanName = serviceName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const serviceCode = cleanName.slice(0, 6).padEnd(6, '0');
        return `DSF${date}${serviceCode}`;
    }

    private static generateRandomCode(length = 4): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        const bytes = randomBytes(length);
        for (let i = 0; i < length; i++) {
            result += characters.charAt(bytes[i] % characters.length);
        }
        return result;
    }
}
