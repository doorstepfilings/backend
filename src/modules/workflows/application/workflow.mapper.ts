import { toStageResource } from '../../stages/application/stage.mapper';

export function toServiceWorkflowResource(workflow: any) {
  const stage = workflow.stage ?? null;

  return {
    id: Number(workflow.id),
    service_id: Number(workflow.serviceId),
    stage_id: Number(workflow.stageId),
    position: Number(workflow.position),
    is_required: Boolean(workflow.isRequired),
    created_at: workflow.createdAt ?? null,
    updated_at: workflow.updatedAt ?? null,
    stage: stage ? toStageResource(stage) : null,
  };
}

export function toDefaultWorkflowResource(workflow: any) {
  const stage = workflow.stage ?? null;

  return {
    id: Number(workflow.id),
    stage_id: Number(workflow.stageId),
    position: Number(workflow.position),
    is_required: Boolean(workflow.isRequired),
    created_at: workflow.createdAt ?? null,
    updated_at: workflow.updatedAt ?? null,
    stage: stage ? toStageResource(stage) : null,
  };
}
