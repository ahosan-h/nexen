import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { createUserDto } from './dto/create-user.dot';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModle: Model<User>,
  ) {}

  async findByClerkId(clerkId: string) {
    return this.userModle.findOne({ clerkId });
  }

  async createUser(dto: createUserDto) {
    const existingUser = await this.findByClerkId(dto.clerkId);

    if (existingUser) {
      return existingUser;
    }

    return this.userModle.create(dto);
  }

  async getUserProfile(clerkId: string) {
    return this.findByClerkId(clerkId);
  }
}
