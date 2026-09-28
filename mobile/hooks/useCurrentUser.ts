//C:\Users\USER\Downloads\reown-app\reown\mobile\hooks\useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useApi } from "@/lib/api";
import { User } from "@/types";

export default function useCurrentUser() {
  const api = useApi();
  const { isLoaded, isSignedIn, userId } = useAuth();

  return useQuery({
    queryKey: ["current-user", userId],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>("/users/me");
      return data.user;
    },
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });
}