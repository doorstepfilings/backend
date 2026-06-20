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

  it('shows the current accountant correction version to the client and hides the replaced version', () => {
    const resource = toUserServiceResource(
      {
        id: 30,
        serviceId: 2,
        userId: 3,
        user: null,
        accountant: null,
        service: null,
        applicationUniqueId: 'APP-30',
        latestPayment: null,
        status: 'under_review',
        paymentStatus: 'PAID',
        formData: null,
        documents: {},
        requestDocuments: [
          {
            id: 77,
            documentType: 'client',
            documentCategory: 'report',
            documentName: 'Review Report',
            serviceDocumentId: null,
            sourceDocumentId: null,
            fileName: 'review-v1.pdf',
            filePath: 'service_documents/8/30/review-v1.pdf',
            fileSize: BigInt(1024),
            mimeType: 'application/pdf',
            version: 1,
            status: 'replaced',
            notes: 'Client: Please correct this',
            isFinal: false,
            uploadedById: 8,
            uploadedBy: {
              id: 8,
              name: 'Accountant',
              role: 'accountant',
            },
            createdAt: new Date('2026-06-19T00:00:00.000Z'),
          },
          {
            id: 78,
            documentType: 'client',
            documentCategory: 'report',
            documentName: 'Review Report',
            serviceDocumentId: null,
            sourceDocumentId: 77,
            fileName: 'review-v2.pdf',
            filePath: 'service_documents/8/30/review-v2.pdf',
            fileSize: BigInt(2048),
            mimeType: 'application/pdf',
            version: 2,
            status: 'pending',
            notes:
              'Client: Please correct this\n\nAccountant: Corrected version uploaded',
            isFinal: false,
            uploadedById: 8,
            uploadedBy: {
              id: 8,
              name: 'Accountant',
              role: 'accountant',
            },
            createdAt: new Date('2026-06-20T00:00:00.000Z'),
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
        createdAt: new Date('2026-06-18T00:00:00.000Z'),
        updatedAt: new Date('2026-06-20T00:00:00.000Z'),
      },
      {
        includeInternalDocuments: false,
        ownerUserId: 3,
      },
    );

    expect(resource.request_documents).toHaveLength(1);
    expect(resource.request_documents[0]).toMatchObject({
      id: 78,
      source_document_id: 77,
      status: 'pending',
      version: 2,
    });
  });

  it('hides a replaced client upload and keeps only its current version', () => {
    const resource = toUserServiceResource(
      {
        id: 31,
        serviceId: 2,
        user: null,
        accountant: null,
        service: null,
        applicationUniqueId: 'APP-31',
        latestPayment: null,
        status: 'under_review',
        paymentStatus: 'PAID',
        formData: null,
        documents: {},
        requestDocuments: [
          {
            id: 79,
            documentType: 'client',
            documentCategory: 'client_document',
            documentName: 'PAN Card',
            serviceDocumentId: null,
            sourceDocumentId: null,
            fileName: 'pan-v1.pdf',
            filePath: 'service_documents/3/31/pan-v1.pdf',
            fileSize: BigInt(1024),
            mimeType: 'application/pdf',
            version: 1,
            status: 'replaced',
            notes: null,
            isFinal: false,
            uploadedById: 3,
            uploadedBy: {
              id: 3,
              name: 'Client',
              role: 'user',
            },
            createdAt: new Date('2026-06-19T00:00:00.000Z'),
          },
          {
            id: 80,
            documentType: 'client',
            documentCategory: 'client_document',
            documentName: 'PAN Card',
            serviceDocumentId: null,
            sourceDocumentId: 79,
            fileName: 'pan-v2.pdf',
            filePath: 'service_documents/3/31/pan-v2.pdf',
            fileSize: BigInt(2048),
            mimeType: 'application/pdf',
            version: 2,
            status: 'pending',
            notes: null,
            isFinal: false,
            uploadedById: 3,
            uploadedBy: {
              id: 3,
              name: 'Client',
              role: 'user',
            },
            createdAt: new Date('2026-06-20T00:00:00.000Z'),
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
        createdAt: new Date('2026-06-18T00:00:00.000Z'),
        updatedAt: new Date('2026-06-20T00:00:00.000Z'),
      },
      {
        includeInternalDocuments: false,
        ownerUserId: 3,
      },
    );

    expect(resource.request_documents).toHaveLength(1);
    expect(resource.request_documents[0]).toMatchObject({
      id: 80,
      source_document_id: 79,
      status: 'pending',
      version: 2,
    });
  });

  it('returns an accountant correction replaced in place as the current document', () => {
    const resource = toUserServiceResource(
      {
        id: 32,
        serviceId: 2,
        user: null,
        accountant: null,
        service: null,
        applicationUniqueId: 'APP-32',
        latestPayment: null,
        status: 'under_review',
        paymentStatus: 'PAID',
        formData: null,
        documents: {},
        requestDocuments: [
          {
            id: 81,
            documentType: 'client',
            documentCategory: 'report',
            documentName: 'Review Report',
            serviceDocumentId: null,
            sourceDocumentId: null,
            fileName: 'review-v2.pdf',
            filePath: 'service_documents/8/32/review-v2.pdf',
            fileSize: BigInt(2048),
            mimeType: 'application/pdf',
            version: 2,
            status: 'pending',
            notes: 'Accountant: Corrected version uploaded',
            isFinal: false,
            uploadedById: 8,
            uploadedBy: {
              id: 8,
              name: 'Accountant',
              role: 'accountant',
            },
            createdAt: new Date('2026-06-20T00:00:00.000Z'),
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
        createdAt: new Date('2026-06-18T00:00:00.000Z'),
        updatedAt: new Date('2026-06-20T00:00:00.000Z'),
      },
      {
        includeInternalDocuments: false,
        ownerUserId: 3,
      },
    );

    expect(resource.request_documents).toHaveLength(1);
    expect(resource.request_documents[0]).toMatchObject({
      id: 81,
      source_document_id: null,
      status: 'pending',
      version: 2,
    });
  });
});
