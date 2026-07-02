import { apiFetch } from "@/lib/api";
import { createUserDto, User } from "@/types/user";

export const UserService = {
  create: (data: createUserDto, token: string) =>
    apiFetch<User>("/user/create", {
      method: "POST",
      token,
      body: data,
    }),

  find: (token: string) =>
    apiFetch<User>("/user/me", {
      token,
    }),
};
