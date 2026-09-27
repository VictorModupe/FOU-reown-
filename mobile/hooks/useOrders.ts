import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useApi } from "@/lib/api";
import { Order } from "@/types";

export const useOrders = () => {
  const api = useApi();
  const { isLoaded, isSignedIn, userId } = useAuth();

  return useQuery<Order[]>({
    queryKey: ["orders", userId ?? "guest"],
    queryFn: async () => {
      const { data } = await api.get(isSignedIn ? "/orders" : "/orders/guest");
      return data.orders;
    },
    enabled: isLoaded,
  });
};
