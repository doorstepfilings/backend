import { IsInt, IsOptional, IsObject, IsString, Min } from 'class-validator';

export type ApplyServiceFormData = {
  address?: string;
  appointment_request?: 'yes' | 'no';
  city?: string;
  email?: string;
  fullName?: string;
  notes?: string;
  phone?: string;
  pincode?: string;
  pricing_plan?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  state?: string;
};

export class ApplyServiceDto {
  @IsInt()
  @Min(1)
  service_id!: number;

  @IsObject()
  form_data!: ApplyServiceFormData;

  @IsOptional()
  @IsString()
  notes?: string;
}
