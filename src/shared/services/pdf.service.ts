import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Renders a Handlebars template to PDF.
   * @param templateName The name of the template without .hbs extension (e.g. 'invoice')
   * @param context The data to inject into the template
   * @returns A Buffer containing the PDF data
   */
  async generatePdf(
    templateName: string,
    context: Record<string, any>,
  ): Promise<Buffer> {
    try {
      // Load and compile Handlebars template
      const templatePath = path.join(
        process.cwd(),
        'src',
        'modules',
        'operations',
        'templates',
        `${templateName}.hbs`,
      );
      const templateHtml = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateHtml);
      const html = template(context);

      // Launch Puppeteer headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();

      // Set HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0', // Wait for external resources to load
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Print CSS backgrounds
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      await browser.close();

      // puppeteer ^22 page.pdf returns Uint8Array, convert to Buffer
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for template ${templateName}:`,
        error,
      );
      throw new Error(`PDF generation failed: ${(error as Error).message}`);
    }
  }
}
