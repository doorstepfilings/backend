export declare class UniqueIDGenerator {
    static generateUserUniqueID(role: string): string;
    static generateSystemUniqueID(role: string): string;
    static generateOrderID(): string;
    static generateInvoiceID(): string;
    static generateApplicationID(serviceName: string): string;
    private static generateRandomCode;
}
