import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class ReorderWorkflowsDto {
  @IsInt()
  @Min(1)
  serviceId!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  orderedWorkflowIds!: number[];
}
