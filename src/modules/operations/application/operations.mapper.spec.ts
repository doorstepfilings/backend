import { toUserServiceResource } from './operations.mapper';

describe('toUserServiceResource', () => {
  it('converts bigint document sizes into JSON-safe values', () => {
    const resource = toUserServiceResource({
      id: 1,
      serviceId: 2,
      user: {
        id: 3,
        name: 'Krishna',
        email: 'krishna@example.com',
      },
      accountant: null,
      service: {
        id: 2,
        serviceCategoryId: 4,
        name: 'GST Registration',
        slug: 'gst-registration',
        category: null,
        documents: [],
      },
      applicationUniqueId: 'APP123',
      latestPayment: null,
      status: 'paid',
      paymentStatus: 'success',
      formData: null,
      documents: {},
      requestDocuments: [
        {
          id: 10,
          documentType: 'client',
          documentCategory: 'client_document',
          documentName: 'PAN Card',
          serviceDocumentId: null,
          sourceDocumentId: null,
          fileName: 'pan-card.pdf',
          filePath: 'service_documents/1/10/pan-card.pdf',
          fileSize: BigInt(2048),
          mimeType: 'application/pdf',
          version: 1,
          status: 'pending',
          notes: null,
          isFinal: false,
          uploadedBy: null,
          createdAt: new Date('2026-05-12T00:00:00.000Z'),
        },
      ],
      amount: 1000,
      notes: null,
      revisionNotes: null,
      caNotes: null,
      updateNote: null,
      rejectionReason: null,
      verified: false,
      certificateUrl: null,
      submittedToCaAt: null,
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
    });

    expect(resource.request_documents[0]?.file_size).toBe(2048);
    expect(resource.request_documents[0]?.file_url).toBe(
      'service_documents/1/10/pan-card.pdf',
    );
    expect(resource.payment_status).toBe('PAID');
    expect(() => JSON.stringify(resource)).not.toThrow();
  });
});
