import ProductsGrid from "@/components/ProductsGrid";
import { Product } from "@/types";

interface VendorProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
  error: unknown;
}

const VendorProductsGrid = (props: VendorProductsGridProps) => {
  return <ProductsGrid {...props} cartRoute="/(vendor-tabs)/cart" />;
};

export default VendorProductsGrid;