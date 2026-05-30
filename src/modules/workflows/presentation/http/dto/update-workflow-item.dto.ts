import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWorkflowItemDto {
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
