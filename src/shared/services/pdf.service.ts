import { Injectable, Logger } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    /**
     * Renders a Handlebars template to PDF using Playwright Chromium.
     *
     * Playwright bundles its own Chromium, so no system browser or Chrome
     * installation is required on any host (Windows, Linux, macOS, Docker).
     *
     * After running `npm install`, run once per environment:
     *   npm run install:browsers
     *
     * @param templateName  Template filename without .hbs (e.g. 'invoice')
     * @param context       Data object injected into the Handlebars template
     * @returns             Buffer containing the generated PDF bytes
     */
    async generatePdf(
        templateName: string,
        context: Record<string, any>,
    ): Promise<Buffer> {
        // Resolve template relative to __dirname so the path works in both:
        //   dev  -> src/shared/services/  -> ../../modules/operations/templates/
        //   prod -> dist/shared/services/ -> ../../modules/operations/templates/
        // (nest-cli.json already copies **/*.hbs into dist/ via the assets field)
        const templatePath = path.resolve(
            __dirname,
            '..',
            '..',
            'modules',
            'operations',
            'templates',
            `${templateName}.hbs`,
        );

        let templateHtml: string;
        try {
            templateHtml = await fs.readFile(templatePath, 'utf8');
        } catch {
            const msg =
                `PDF template "${templateName}" not found at: ${templatePath}. ` +
                'Check that nest-cli.json has assets: ["**/*.hbs"] and the file exists.';
            this.logger.error(msg);
            throw new Error(msg);
        }

        const template = handlebars.compile(templateHtml);
        const html = template(context);

        // Lazy-load Playwright only when PDF generation is requested.
        // chromium.launch() uses Playwright's own bundled Chromium binary,
        // independent of any browser installed on the host machine.
        const { chromium } = await import('playwright');

        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
        });

        try {
            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: 'networkidle' });

            const rawBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                },
            });

            return Buffer.from(rawBuffer);
        } finally {
            await browser.close();
        }
    }
}
