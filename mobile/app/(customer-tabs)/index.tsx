import ProductsGrid from "@/components/CustomerProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const getCategoryIcon = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes("electronic")) return "phone-portrait-outline";
  if (normalized.includes("fashion") || normalized.includes("cloth")) return "shirt-outline";
  if (normalized.includes("sport")) return "football-outline";
  if (normalized.includes("book")) return "book-outline";
  if (normalized.includes("furniture")) return "bed-outline";
  if (normalized.includes("home")) return "home-outline";
  if (normalized.includes("accessor")) return "watch-outline";
  if (normalized.includes("footwear")) return "walk-outline";
  return "grid-outline";
};

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const { data: products, isLoading, isError, error } = useProducts();

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((products ?? []).map((product) => product.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    let filtered = products ?? [];
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((product) =>
        `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const chooseCategory = (category: string) => {
    setSelectedCategory(category);
    setIsFilterVisible(false);
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-5 pt-4">
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="font-kenao text-4xl text-primary">FOU</Text>
              <Text className="mt-1 text-sm text-text-secondary">A new home for good finds</Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-background-lighter">
              <Ionicons name="bag-handle-outline" size={23} color="#4F2B50" />
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="h-[52px] flex-1 flex-row items-center rounded-2xl border border-surface-light bg-surface px-4">
              <Ionicons name="search" size={21} color="#66576C" />
              <TextInput
                placeholder="Search for items..."
                placeholderTextColor="#786B7E"
                className="ml-3 flex-1 text-base text-text-primary"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsFilterVisible(true)}
              className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary"
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filter products by category"
            >
              <Ionicons name="options-outline" size={23} color="#FFFFFF" />
              {selectedCategory !== "All" ? (
                <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F3C7E8]" />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <View className="mx-5 mb-6 h-40 overflow-hidden rounded-3xl bg-[#E4D8EC]">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80",
            }}
            className="absolute right-0 top-0 h-full w-[48%]"
            resizeMode="cover"
          />
          <View className="absolute right-[38%] top-0 h-full w-12 bg-[#E4D8EC]" />
          <View className="z-10 w-[62%] flex-1 justify-center px-4">
            <Text className="text-xs font-bold uppercase text-primary">Pre-loved, first-rate</Text>
            <Text className="mt-2 text-xl font-bold leading-6 text-text-primary">
              Give good things another home.
            </Text>
            <TouchableOpacity
              onPress={() => setIsFilterVisible(true)}
              className="mt-3 self-start rounded-full bg-primary px-4 py-2"
              activeOpacity={0.8}
            >
              <Text className="text-xs font-bold text-white">Explore finds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between px-5">
            <Text className="text-lg font-bold text-text-primary">Categories</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(true)} accessibilityRole="button">
              <Text className="font-bold text-primary">See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className="mr-3 w-[72px] items-center"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${category} listings`}
                >
                  <View
                    className={`h-[60px] w-[60px] items-center justify-center rounded-2xl ${
                      isSelected ? "bg-primary" : "bg-background-lighter"
                    }`}
                  >
                    <Ionicons
                      name={getCategoryIcon(category)}
                      size={27}
                      color={isSelected ? "#FFFFFF" : "#4F2B50"}
                    />
                  </View>
                  <Text
                    className={`mt-2 text-center text-xs ${
                      isSelected ? "font-bold text-primary" : "font-medium text-text-secondary"
                    }`}
                    numberOfLines={1}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-text-primary">Popular listings</Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {selectedCategory === "All" ? "Fresh finds picked for you" : selectedCategory}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-text-secondary">
              {filteredProducts.length} items
            </Text>
          </View>
          <ProductsGrid
            products={filteredProducts}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </View>
      </ScrollView>

      <Modal
        visible={isFilterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setIsFilterVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pb-10 pt-5"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-text-primary">Filter listings</Text>
                <Text className="mt-1 text-sm text-text-secondary">Choose a category</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-background-lighter"
                accessibilityRole="button"
                accessibilityLabel="Close filters"
              >
                <Ionicons name="close" size={22} color="#4F2B50" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => chooseCategory(category)}
                    className={`mb-2 min-h-12 flex-row items-center rounded-xl px-4 ${
                      isSelected ? "bg-primary" : "bg-background-lighter"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${category}`}
                  >
                    <Ionicons
                      name={getCategoryIcon(category)}
                      size={20}
                      color={isSelected ? "#FFFFFF" : "#4F2B50"}
                    />
                    <Text
                      className={`ml-3 flex-1 font-semibold ${
                        isSelected ? "text-white" : "text-text-primary"
                      }`}
                    >
                      {category === "All" ? "All listings" : category}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScreen>
  );
};

export default ShopScreen;