import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class createScanDto {
  @IsString()
  barcode!: string;

  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  bprice!: number;

  @Type(() => Number)
  @IsNumber()
  sprice!: number;

  @Type(() => Number)
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
