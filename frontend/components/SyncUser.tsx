"use client";
import { UserService } from "@/service/user.service";
import { createUserDto } from "@/types/user";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SyncUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const { user } = useUser();

  useEffect(() => {
    async function syncUser() {
      if (!isSignedIn || !isLoaded || !user) return;

      try {
        const token = await getToken();

        if (!token) return;

        const email = user.primaryEmailAddress?.emailAddress;

        if (!email) return;

        const payload: createUserDto = {
          clerkId: user.id,
          email,
          username: user.username ?? user.firstName ?? user.lastName ?? "User",
        };

        await UserService.create(payload, token);
      } catch (error) {
        console.log(error);
      }
    }
    syncUser();
  }, [isLoaded, user, getToken, isSignedIn]);

  return null;
}
