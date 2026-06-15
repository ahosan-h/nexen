import { IsNumber, IsString } from 'class-validator';

export class createScanDto {
  @IsString()
  qrcode!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsString()
  description!: string;

  @IsString()
  addedby!: string;
}
