import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Product } from "@/types";

interface CreateReviewData {
  productId: string;
  orderId: string;
  rating: number;
}

export const useReviews = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  const createReview = useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const response = await api.post("/reviews", data);
      return response.data;
    },
    onSuccess: ({ product }: { product: Product }) => {
      if (product) {
        queryClient.setQueryData(["product", product._id], product);
        queryClient.setQueriesData<Product[]>({ queryKey: ["products"] }, (products) =>
          products?.map((cachedProduct) =>
            cachedProduct._id === product._id ? { ...cachedProduct, ...product } : cachedProduct
          )
        );
      }
    },
  });

  return {
    isCreatingReview: createReview.isPending,
    createReviewAsync: createReview.mutateAsync,
  };
};
