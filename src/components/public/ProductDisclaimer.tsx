import { PRODUCT_DISCLAIMER } from "@/lib/product-disclaimer";

type ProductDisclaimerProps = {
  className?: string;
};

export function ProductDisclaimer({ className = "" }: ProductDisclaimerProps) {
  return (
    <p className={`text-[11px] leading-relaxed text-zinc-600 ${className}`}>
      {PRODUCT_DISCLAIMER}
    </p>
  );
}
