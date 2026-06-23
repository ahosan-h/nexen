"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

//it will verify the user if he is sign-ined or not
export default function SyncUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isloaded, setIsloaded] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchtoken() {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken();
          setToken(token);
          console.log(token);
        } catch (error) {
          console.log(error);
        } finally {
          setIsloaded(false);
        }
      } else if (isloaded && !isSignedIn) {
        setIsloaded(false);
      }
    }
    fetchtoken();
  }, [isSignedIn, getToken, isLoaded]);
  return {
    isSignedIn,
    isloaded: isloaded,
    token,
  };
}
