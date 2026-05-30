import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class AssignWorkflowStageDto {
  @IsInt()
  @Min(1)
  serviceId!: number;

  @IsInt()
  @Min(1)
  stageId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
