import { IsOptional, IsString } from 'class-validator';

export class createUserDto {
  @IsString()
  clerkId!: string;

  @IsString()
  email!: string;

  @IsString()
  @IsOptional()
  username?: string;
}
