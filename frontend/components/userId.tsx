"use client";
import { useUser } from "@clerk/nextjs";

export default function Emu() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  // Combines first and last name safely
  const firstname = user.firstName || `${user.firstName} ${user.lastName}`;

  return <h1>Welcome back, {firstname}!</h1>;
}
