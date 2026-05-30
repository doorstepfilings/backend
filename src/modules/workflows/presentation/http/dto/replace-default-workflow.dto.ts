import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

class DefaultWorkflowItemDto {
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

export class ReplaceDefaultWorkflowDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DefaultWorkflowItemDto)
  items!: DefaultWorkflowItemDto[];
}
