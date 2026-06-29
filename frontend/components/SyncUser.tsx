"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
//it will verify the user if he is sign-ined or not
export default function SyncUser() {
  const { getToken, isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { user } = useUser();
  const [isloaded, setIsloaded] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function createuser(
      firstname: string,
      clerkId: string,
      email: string,
      token: string,
    ) {
      const senddata = await fetch("http://localhost:3433/nexen/user/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: clerkId,
          email: email,
          username: firstname,
        }),
      });
    }

    async function fetchtoken() {
      if (clerkLoaded && isSignedIn) {
        try {
          const token = await getToken();
          setToken(token);
          console.log(token);
          //extract the name (last name)
          const firstname = user?.firstName || user?.lastName;
          const clerkId = user?.id;
          const email = user?.primaryEmailAddress?.emailAddress;

          await createuser(firstname, clerkId, email, token);
        } catch (error) {
          console.log(error);
        } finally {
          setIsloaded(false);
        }
      } else if (clerkLoaded && !isSignedIn) {
        setIsloaded(false);
      }
    }

    fetchtoken();
  }, [isSignedIn, getToken, clerkLoaded, user]);
  return {
    isSignedIn,
    isLoaded: clerkLoaded && !isloaded,
    token,
    username: user,
  };
}
