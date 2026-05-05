export declare class PdfService {
    private readonly logger;
    generatePdf(templateName: string, context: Record<string, any>): Promise<Buffer>;
}
