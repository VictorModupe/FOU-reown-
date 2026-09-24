import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";

interface ProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
  error: unknown;
  requiresAuth?: boolean;
  cartRoute?: "/(customer-tabs)/cart" | "/(vendor-tabs)/cart";
}

const ProductsGrid = ({
  products,
  isLoading,
  isError,
  error,
  requiresAuth = false,
  cartRoute = "/(customer-tabs)/cart",
}: ProductsGridProps) => {
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { isAddingToCart, addToCart } = useCart();
  const { isSignedIn } = useAuth();

  const handleAddToCart = (productId: string, productName: string) => {
    if (requiresAuth && !isSignedIn) {
      Alert.alert("Sign in required", "Please sign in before adding items to your cart.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/(routes)/login") },
      ]);
      return;
    }

    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          router.push(cartRoute);
        },
        onError: (error: any) => {
          Alert.alert("Error", error?.response?.data?.error || "Failed to add to cart");
        },
      }
    );
  };

  const renderProduct = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      className="bg-surface rounded-3xl overflow-hidden mb-3"
      style={{ width: "48%" }}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      <View className="relative">
        <Image
          source={{ uri: product.images[0] }}
          className="w-full h-44 bg-background-lighter"
          resizeMode="cover"
        />

        <TouchableOpacity
          className="absolute top-3 right-3 bg-black/30 backdrop-blur-xl p-2 rounded-full"
          activeOpacity={0.7}
          onPress={() => toggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color="#F9FFFF" />
          ) : (
            <Ionicons
              name={isInWishlist(product._id) ? "heart" : "heart-outline"}
              size={18}
              color={isInWishlist(product._id) ? "#FF6B6B" : "#FFFFFF"}
            />
          )}
        </TouchableOpacity>
      </View>

      <View className="p-3">
        <Text className="text-text-secondary text-xs mb-1">{product.category}</Text>
        <Text className="text-text-primary font-bold text-sm mb-2" numberOfLines={2}>
          {product.name}
        </Text>

        <View className="flex-row items-center mb-2">
          <Ionicons name="star" size={12} color="#FFC107" />
          <Text className="text-text-primary text-xs font-semibold ml-1">
            {product.averageRating.toFixed(1)}
          </Text>
          <Text className="text-text-secondary text-xs ml-1">({product.totalReviews})</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-primary font-bold text-lg">${product.price.toFixed(2)}</Text>

          <TouchableOpacity
            className="bg-primary rounded-full w-8 h-8 items-center justify-center"
            activeOpacity={0.7}
            onPress={(event) => {
              event.stopPropagation();
              handleAddToCart(product._id, product.name);
            }}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <Ionicons name="add" size={18} color="#121212" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text className="text-text-secondary mt-4">Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-20 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text className="text-text-primary font-semibold mt-4">Failed to load products</Text>
        <Text className="text-text-secondary text-sm mt-2 text-center px-8">
          {axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : "Please check your API URL and try again"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      ListEmptyComponent={NoProductsFound}
    />
  );
};

export default ProductsGrid;

function NoProductsFound() {
  return (
    <View className="py-20 items-center justify-center">
      <Ionicons name="search-outline" size={48} color={"#666"} />
      <Text className="text-text-primary font-semibold mt-4">No products found</Text>
      <Text className="text-text-secondary text-sm mt-2">Try adjusting your filters</Text>
    </View>
  );
}
