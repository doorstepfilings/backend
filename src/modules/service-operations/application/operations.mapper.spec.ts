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
    expect(resource.journey).toMatchObject({
      mode: 'system',
      current_stage: expect.objectContaining({
        key: 'payment_verified',
      }),
    });
    expect(resource.progression_control).toEqual({
      has_workflow: false,
      is_custom_workflow: false,
      lifecycle_status_editable: false,
      mode: 'status',
      workflow_stage_editable: false,
    });
    expect(resource.workflow_stages).toEqual([]);
    expect(resource.current_workflow).toBeNull();
    expect(() => JSON.stringify(resource)).not.toThrow();
  });

  it('hides internal notes and preserves custom workflow progress', () => {
    const resource = toUserServiceResource(
      {
        id: 2,
        serviceId: 9,
        user: {
          id: 7,
          email: 'client@example.com',
          name: 'Client',
          role: 'user',
        },
        accountant: null,
        service: {
          category: null,
          documents: [],
          id: 9,
          name: 'Trademark Filing',
          serviceCategoryId: 3,
          slug: 'trademark-filing',
          serviceWorkflows: [
            {
              id: 101,
              isRequired: true,
              position: 1,
              serviceId: 9,
              stageId: 201,
              stage: {
                color: '#1d4ed8',
                id: 201,
                isActive: true,
                name: 'Documents Received',
                slug: 'documents-received',
              },
            },
            {
              id: 102,
              isRequired: false,
              position: 2,
              serviceId: 9,
              stageId: 202,
              stage: {
                color: '#0f766e',
                id: 202,
                isActive: true,
                name: 'Internal Review',
                slug: 'internal-review',
              },
            },
          ],
        },
        applicationUniqueId: 'APP456',
        latestPayment: null,
        status: 'under_review',
        paymentStatus: 'PAID',
        formData: null,
        documents: {},
        requestDocuments: [],
        amount: 2000,
        notes: null,
        revisionNotes: null,
        caNotes: 'internal only',
        updateNote: 'internal only',
        rejectionReason: 'internal only',
        clientMessage: 'We are reviewing your application.',
        currentWorkflow: {
          id: 102,
          isRequired: false,
          position: 2,
          serviceId: 9,
          stageId: 202,
          stage: {
            color: '#0f766e',
            id: 202,
            isActive: true,
            name: 'Internal Review',
            slug: 'internal-review',
          },
        },
        currentServiceWorkflowId: 102,
        verified: false,
        certificateUrl: null,
        submittedToCaAt: null,
        createdAt: new Date('2026-05-12T00:00:00.000Z'),
        updatedAt: new Date('2026-05-12T00:00:00.000Z'),
      },
      {
        includeHiddenStages: false,
        includeInternalDocuments: false,
        includeInternalNotes: false,
        ownerUserId: 7,
      },
    );

    expect(resource.ca_notes).toBeUndefined();
    expect(resource.update_note).toBeUndefined();
    expect(resource.rejection_reason).toBeUndefined();
    expect(resource.client_message).toBe('We are reviewing your application.');
    expect(resource.progress).toMatchObject({
      mode: 'custom',
      percent: 100,
    });
    expect(resource.progress.stages).toEqual([
      expect.objectContaining({
        id: 101,
        is_required: true,
        is_current: false,
      }),
      expect.objectContaining({
        id: 102,
        is_required: false,
        is_current: true,
      }),
    ]);
    expect(resource.journey).toMatchObject({
      mode: 'workflow',
      current_stage: expect.objectContaining({
        key: 'internal-review',
      }),
    });
    expect(resource.current_workflow).toMatchObject({
      id: 102,
      slug: 'internal-review',
    });
    expect(resource.workflow_stages).toEqual([
      expect.objectContaining({
        id: 101,
        slug: 'documents-received',
      }),
      expect.objectContaining({
        id: 102,
        slug: 'internal-review',
      }),
    ]);
    expect(resource.progression_control).toEqual({
      has_workflow: true,
      is_custom_workflow: false,
      lifecycle_status_editable: false,
      mode: 'workflow',
      workflow_stage_editable: true,
    });
    expect(resource.journey.stages.slice(0, 3)).toEqual([
      expect.objectContaining({
        key: 'created',
        is_completed: true,
      }),
      expect.objectContaining({
        key: 'payment_pending',
        is_completed: true,
      }),
      expect.objectContaining({
        key: 'payment_verified',
        is_completed: true,
      }),
    ]);
  });
});
