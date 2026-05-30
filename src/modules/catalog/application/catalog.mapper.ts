export function toServiceCategoryListItem(category: any) {
  return {
    id: category.id,
    category: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    services: Array.isArray(category.services)
      ? category.services.map((service: any) => ({
          id: service.id,
          name: service.name,
          slug: service.slug,
          short_description: service.shortDescription,
          description: service.longDescription ?? service.description,
          price: service.price,
          pricing_plans: service.pricingPlans,
          faqs: service.faqs,
          required_documents_list: service.requiredDocumentsList,
          link: service.link,
        }))
      : [],
  };
}

export function toServiceResource(service: any) {
  return {
    id: service.id,
    service_category_id: service.serviceCategoryId,
    name: service.name,
    slug: service.slug,
    short_description: service.shortDescription,
    description: service.description,
    long_description: service.longDescription,
    link: service.link,
    price: service.price,
    faqs: service.faqs ?? [],
    pricing_plans: service.pricingPlans ?? [],
    required_documents_list: service.requiredDocumentsList ?? [],
    extra_documents: service.extraDocuments ?? [],
    category: service.category
      ? {
          id: service.category.id,
          name: service.category.name,
          slug: service.category.slug,
          description: service.category.description,
          icon: service.category.icon,
        }
      : null,
    documents: Array.isArray(service.documents)
      ? service.documents.map(toServiceDocumentResource)
      : [],
  };
}

function toServiceDocumentResource(document: any) {
  return {
    id: document.id,
    service_id: document.serviceId,
    document_name: document.documentName,
    name: document.name,
    slug: document.slug,
    description: document.description,
    document_type: document.documentType,
    file_type: document.fileType,
    max_size: document.maxSize,
    is_required: document.isRequired,
    sort_order: document.sortOrder,
    metadata: document.metadata,
  };
}
