import { IsInt, IsOptional, IsObject, IsString, Min } from 'class-validator';

export class AddToCartDto {
    @IsInt()
    @Min(1)
    service_id!: number;

    @IsOptional()
    @IsObject()
    form_data?: Record<string, any>;

    @IsOptional()
    @IsString()
    pricing_plan?: string;
}
