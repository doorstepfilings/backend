export function toStageResource(stage: any) {
  const isDefault = Boolean(stage.isDefault);

  return {
    id: Number(stage.id),
    name: String(stage.name),
    slug: String(stage.slug),
    color: String(stage.color || '#1d4ed8'),
    is_active: Boolean(stage.isActive),
    isActive: Boolean(stage.isActive),
    is_default: isDefault,
    isDefault,
    created_at: stage.createdAt ?? null,
    updated_at: stage.updatedAt ?? null,
  };
}
