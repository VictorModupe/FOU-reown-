import ProductsGrid from "@/components/CustomerProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { data: products = [], isLoading, isError, error } = useProducts();
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalizedQuery)
    );
  }, [products, query]);

  return (
    <SafeScreen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-5 pt-6">
          <Text className="text-3xl font-kenao tracking-tight text-text-primary">Search</Text>
          <Text className="mt-1 text-text-secondary font-kenao">Find products across the catalog</Text>
          <View className="mt-5 flex-row items-center rounded-2xl bg-surface px-4 py-3">
            <Ionicons name="search" size={22} color="#8d8290" />
            <TextInput
              className="ml-3 flex-1 text-base text-text-primary"
              placeholder="Search by name, category, or description"
              placeholderTextColor="#8d8290"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
        </View>
        <View className="px-6">
          <Text className="mb-4 text-lg font-bold text-text-primary">{filteredProducts.length} results</Text>
          <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} error={error} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
