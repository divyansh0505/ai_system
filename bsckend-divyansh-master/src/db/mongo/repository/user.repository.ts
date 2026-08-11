import type { FilterQuery } from 'mongoose';

import { UserModel } from '../models/user.model';
import type { User } from '../models/types';
import type {
  CreateUserDto,
  UpdateUserDto,
} from '../../../services/types/user.types';

export class UserRepository {
  static async get(filter: FilterQuery<User>): Promise<User | null> {
    return await UserModel.findOne(filter).lean();
  }

  static async getMany(filter: FilterQuery<User>): Promise<User[]> {
    return await UserModel.find(filter).lean();
  }

  static async create(user: CreateUserDto): Promise<User | null> {
    return await UserModel.create(user);
  }

  static async update(
    filter: FilterQuery<User>,
    updateData: UpdateUserDto,
  ): Promise<User | null> {
    return await UserModel.findOneAndUpdate(filter, updateData, {
      new: true,
    }).lean();
  }
}
