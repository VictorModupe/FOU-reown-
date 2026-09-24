import ProductsGrid from "@/components/ProductsGrid";
import { Product } from "@/types";

interface CustomerProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
  error: unknown;
}

const CustomerProductsGrid = (props: CustomerProductsGridProps) => {
  return <ProductsGrid {...props} requiresAuth={false} cartRoute="/(customer-tabs)/cart" />;
};

export default CustomerProductsGrid;