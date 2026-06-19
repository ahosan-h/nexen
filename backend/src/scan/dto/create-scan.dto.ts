import { IsNumber, IsOptional, IsString } from 'class-validator';

export class createScanDto {
  @IsString()
  barcode!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  addedby!: string;
}
