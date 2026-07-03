import { UserService } from "@/service/user.service";
import { User } from "@/types/user";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useCurrentUser() {
  const { isSignedIn, getToken } = useAuth();

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();

        if (!token) return;

        const currentUser = await UserService.find(token);

        setUser(currentUser);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [isSignedIn, getToken]);

  return { user, loading };
}
