import { IsInt, IsOptional, IsObject, IsString, Min } from 'class-validator';

export type ApplyServiceFormData = {
  address?: string;
  appointment_request?: 'yes' | 'no';
  city?: string;
  countryIso?: string;
  dialCode?: string;
  district?: string | null;
  email?: string;
  fullName?: string;
  landmark?: string | null;
  notes?: string;
  phone?: string;
  pincode?: string;
  pricing_plan?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
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
