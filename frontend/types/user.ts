export interface User {
  _id: string;

  clerkId: string;

  email: string;

  username: string;

  createdAt: string;

  updatedAt: string;
}

export interface createUserDto {
  clerkId: string;

  email: string;

  username: string;
}
