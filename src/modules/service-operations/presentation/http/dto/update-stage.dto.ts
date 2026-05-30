import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStageDto {
  @IsOptional()
  @IsInt()
  service_workflow_id!: number | null;

  @IsOptional()
  @IsString()
  client_message?: string;

  @IsOptional()
  @IsString()
  target_status?: string;
}
