import { Injectable } from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [{
    userId: 11,
    username: 'john',
    password: 'changeme',
  }, {
    userID: 2,
    username: 'maria',
    password: 'guess',
  }];

  async findOne(username:string):Promise<User> {
    return this.users.find((user) => user.username === username);
  }
}
