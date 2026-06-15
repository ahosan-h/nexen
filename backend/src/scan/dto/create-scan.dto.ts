import { IsNumber, IsString } from 'class-validator';

export class CreateScanDto {
  @IsString()
  qrcode!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsString()
  quantity!: number;

  @IsString()
  description!: string;

  @IsString()
  addedby!: string;
}
