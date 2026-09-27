import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useApi } from "@/lib/api";
import { getGuestCartSessionId } from "@/lib/guestCart";
import { Cart } from "@/types";

const emptyCart: Cart = {
  _id: "guest-cart",
  user: "",
  clerkId: "",
  items: [],
  createdAt: "",
  updatedAt: "",
};

const useCart = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { getToken, isLoaded, userId } = useAuth();
  const cartQueryKey = ["cart", userId ?? "guest"];

  const getCartHeaders = async () => {
    const token = await getToken();
    const guestCartSessionId = await getGuestCartSessionId();
    return {
      Authorization: token ? `Bearer ${token}` : undefined,
      "x-guest-session-id": guestCartSessionId,
    };
  };

  const {
    data: cart,
    isLoading,
    isError,
  } = useQuery({
    queryKey: cartQueryKey,
    queryFn: async () => {
      const { data } = await api.get<{ cart?: Cart }>("/cart", {
        headers: await getCartHeaders(),
      });
      if (!data?.cart || !Array.isArray(data.cart.items)) return emptyCart;
      return data.cart;
    },
    enabled: isLoaded,
  });

  const updateCachedCart = async (cart: Cart) => {
    queryClient.setQueryData(cartQueryKey, cart);
    await queryClient.invalidateQueries({ queryKey: cartQueryKey, exact: true });
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const { data } = await api.post<{ cart: Cart }>("/cart", { productId, quantity }, {
        headers: await getCartHeaders(),
      });
      return data.cart;
    },
    onSuccess: updateCachedCart,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await api.put<{ cart: Cart }>(`/cart/${productId}`, { quantity }, {
        headers: await getCartHeaders(),
      });
      return data.cart;
    },
    onSuccess: updateCachedCart,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ cart: Cart }>(`/cart/${productId}`, {
        headers: await getCartHeaders(),
      });
      return data.cart;
    },
    onSuccess: updateCachedCart,
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ cart: Cart }>("/cart", {
        headers: await getCartHeaders(),
      });
      return data.cart;
    },
    onSuccess: updateCachedCart,
  });

  const cartTotal =
    cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ?? 0;

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    isLoading,
    isError,
    cartTotal,
    cartItemCount,
    addToCart: addToCartMutation.mutate,
    addToCartAsync: addToCartMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutate,
    updateQuantityAsync: updateQuantityMutation.mutateAsync,
    removeFromCart: removeFromCartMutation.mutate,
    removeFromCartAsync: removeFromCartMutation.mutateAsync,
    clearCart: clearCartMutation.mutate,
    clearCartAsync: clearCartMutation.mutateAsync,
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
};
export default useCart;
