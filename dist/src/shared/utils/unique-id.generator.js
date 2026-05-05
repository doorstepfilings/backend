"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueIDGenerator = void 0;
const crypto_1 = require("crypto");
class UniqueIDGenerator {
    static generateUserUniqueID(role) {
        const prefix = role === 'regional_manager' ? 'RM' : 'ACC';
        const sequence = Math.floor(Math.random() * 1000000);
        return `${prefix}${sequence.toString().padStart(6, '0')}`;
    }
    static generateSystemUniqueID(role) {
        const mapping = {
            regional_manager: 'RM',
            accountant: 'ACC',
        };
        const rolePrefix = mapping[role] || 'USR';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSF${rolePrefix}${date}${random}`;
    }
    static generateOrderID() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSFORD${date}${random}`;
    }
    static generateInvoiceID() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = this.generateRandomCode(4);
        return `DSFINV${date}${random}`;
    }
    static generateApplicationID(serviceName) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const cleanName = serviceName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const serviceCode = cleanName.slice(0, 6).padEnd(6, '0');
        return `DSF${date}${serviceCode}`;
    }
    static generateRandomCode(length = 4) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        const bytes = (0, crypto_1.randomBytes)(length);
        for (let i = 0; i < length; i++) {
            result += characters.charAt(bytes[i] % characters.length);
        }
        return result;
    }
}
exports.UniqueIDGenerator = UniqueIDGenerator;
//# sourceMappingURL=unique-id.generator.js.map