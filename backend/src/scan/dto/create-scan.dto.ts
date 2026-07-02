import { IsNumber, IsOptional, IsString } from 'class-validator';

export class createScanDto {
  @IsString()
  barcode!: string;

  @IsString()
  name!: string;

  @IsNumber()
  bprice!: number;

  @IsNumber()
  sprice!: number;

  @IsNumber()
  quantity!: number;

  @IsString()
  category!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  addedby!: string;
}
