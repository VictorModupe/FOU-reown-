import ProductsGrid from "@/components/VendorProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

const CATEGORIES = [
  { name: "All", icon: "grid-outline" as const },
  { name: "Electronics", icon: "phone-portrait-outline" as const },
  { name: "Fashion", icon: "shirt-outline" as const },
  { name: "Sports", icon: "football-outline" as const },
  { name: "Books", icon: "book-outline" as const },
];

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { isDark } = useTheme();
  const vendorAccent = isDark ? "#75D7BE" : "#087F68";

  const { data: products, isLoading, isError, error } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // filtering by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // filtering by searh query
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary text-4xl font-[4F2B50] font-kenao tracking-tight">FOU</Text>
              <Text className="text-text-secondary text-sm mt-1">Browse all products</Text>
              <View className="mt-2 self-start rounded-full px-3 py-1" style={{ backgroundColor: isDark ? "rgba(117,215,190,0.16)" : "#DDF4EC" }}>
                <Text className="text-xs font-bold uppercase" style={{ color: vendorAccent }}>Seller workspace</Text>
              </View>
            </View>

            <TouchableOpacity
              className="rounded-full bg-background-lighter p-3"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Product filters"
            >
              <Ionicons name="options-outline" size={22} color={vendorAccent} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons color={vendorAccent} size={22} name="search" />
            <TextInput
              placeholder="Search for products"
              placeholderTextColor={"#666"}
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-3 px-5 text-lg font-bold text-text-primary">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  className="mr-3 w-[72px] items-center"
                  activeOpacity={0.8}
                >
                  <View
                    className={`h-[60px] w-[60px] items-center justify-center rounded-2xl ${isSelected ? "" : "bg-background-lighter"}`}
                    style={isSelected ? { backgroundColor: vendorAccent } : undefined}
                  >
                    <Ionicons name={category.icon} size={27} color={isSelected ? "#FFFFFF" : vendorAccent} />
                  </View>
                  <Text className={`mt-2 text-center text-xs ${isSelected ? "font-bold" : "font-medium text-text-secondary"}`} style={isSelected ? { color: vendorAccent } : undefined} numberOfLines={1}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary text-lg font-bold">Products</Text>
            <Text className="text-text-secondary text-sm">{filteredProducts.length} items</Text>
          </View>

          {/* PRODUCTS GRID */}
          <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} error={error} />
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => router.push("/product/create")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add product"
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: vendorAccent }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeScreen>
  );
};

export default ShopScreen;
