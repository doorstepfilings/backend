import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class ApplyDefaultWorkflowDto {
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  serviceIds?: number[];

  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;
}
