import { randomBytes } from 'crypto';

export type UserUniqueIdOptions = {
    city?: string | null;
    date?: Date;
    pincode?: string | null;
    series?: number;
    state?: string | null;
};

const INDIAN_STATE_CODES: Record<string, string> = {
    'andaman and nicobar islands': 'AN',
    'andhra pradesh': 'AP',
    'arunachal pradesh': 'AR',
    assam: 'AS',
    bihar: 'BR',
    chandigarh: 'CH',
    chhattisgarh: 'CG',
    'dadra and nagar haveli and daman and diu': 'DN',
    delhi: 'DL',
    goa: 'GA',
    gujarat: 'GJ',
    haryana: 'HR',
    'himachal pradesh': 'HP',
    'jammu and kashmir': 'JK',
    jharkhand: 'JH',
    karnataka: 'KA',
    kerala: 'KL',
    ladakh: 'LA',
    lakshadweep: 'LD',
    'madhya pradesh': 'MP',
    maharashtra: 'MH',
    manipur: 'MN',
    meghalaya: 'ML',
    mizoram: 'MZ',
    nagaland: 'NL',
    odisha: 'OD',
    puducherry: 'PY',
    punjab: 'PB',
    rajasthan: 'RJ',
    sikkim: 'SK',
    'tamil nadu': 'TN',
    telangana: 'TS',
    tripura: 'TR',
    'uttar pradesh': 'UP',
    uttarakhand: 'UK',
    'west bengal': 'WB',
};

function normalizeText(value?: string | null) {
    return String(value ?? '').trim();
}

function compactLetters(value?: string | null) {
    return normalizeText(value)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase();
}

function resolveStateCode(state?: string | null) {
    const normalizedState = normalizeText(state).toLowerCase();
    if (INDIAN_STATE_CODES[normalizedState]) {
        return INDIAN_STATE_CODES[normalizedState];
    }

    const letters = compactLetters(state);
    return (letters || 'IN').slice(0, 2).padEnd(2, 'X');
}

function resolveCityCode(city?: string | null, pincode?: string | null) {
    const letters = compactLetters(city);
    if (letters) {
        return letters.slice(0, 3).padEnd(3, 'X');
    }

    const digits = normalizeText(pincode).replace(/\D/g, '');
    if (digits) {
        return digits.slice(0, 3).padEnd(3, '0');
    }

    return 'GEN';
}

function resolveYearCode(date = new Date()) {
    return String(date.getFullYear()).slice(-2);
}

function resolveSeriesCode(series = 1) {
    if (!Number.isInteger(series) || series < 1 || series > 9999) {
        throw new RangeError('RM ID series must be between 1 and 9999');
    }

    return String(series).padStart(4, '0');
}

export class UniqueIDGenerator {
    static generateUserUniqueID(
        role: string,
        options: UserUniqueIdOptions = {},
    ): string {
        if (role === 'regional_manager') {
            const stateCode = resolveStateCode(options.state);
            const cityCode = resolveCityCode(options.city, options.pincode);
            const yearCode = resolveYearCode(options.date);
            const seriesCode = resolveSeriesCode(options.series);
            return `RM${stateCode}${cityCode}${yearCode}${seriesCode}`;
        }

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
