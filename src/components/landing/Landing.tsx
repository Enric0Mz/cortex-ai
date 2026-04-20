import { Atmosphere } from "@/components/landing/Atmosphere";
import { Hero } from "@/components/landing/Hero";
import { ProductPreview } from "@/components/landing/ProductPreview";

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      <Atmosphere />
      <Hero />
      <ProductPreview />
    </div>
  );
}
