import { cn } from "@/lib/utils";

function SkeletonPremium({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-background/60 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          <div className="w-full lg:w-1/2 space-y-6">
            {/* Trust badges */}
            <div className="flex gap-3">
              <SkeletonPremium className="h-10 w-32" />
              <SkeletonPremium className="h-10 w-32" />
              <SkeletonPremium className="h-10 w-32" />
            </div>
            
            {/* Title */}
            <div className="space-y-3">
              <SkeletonPremium className="h-12 w-full" />
              <SkeletonPremium className="h-12 w-4/5" />
              <SkeletonPremium className="h-12 w-3/4" />
            </div>
            
            {/* Subtitle */}
            <div className="space-y-2">
              <SkeletonPremium className="h-6 w-full" />
              <SkeletonPremium className="h-6 w-5/6" />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <SkeletonPremium className="h-24" />
              <SkeletonPremium className="h-24" />
              <SkeletonPremium className="h-24" />
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <SkeletonPremium className="h-14 w-full sm:w-64" />
              <SkeletonPremium className="h-14 w-full sm:w-64" />
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <SkeletonPremium className="aspect-[4/3] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCardSkeleton() {
  return (
    <div className="space-y-4 p-6 rounded-2xl border bg-card">
      <SkeletonPremium className="h-12 w-12 rounded-full" />
      <SkeletonPremium className="h-6 w-3/4" />
      <div className="space-y-2">
        <SkeletonPremium className="h-4 w-full" />
        <SkeletonPremium className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function FeaturesSectionSkeleton() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12 space-y-4">
        <SkeletonPremium className="h-10 w-64 mx-auto" />
        <SkeletonPremium className="h-6 w-96 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <FeatureCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function PortfolioCardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPremium className="aspect-video w-full rounded-xl" />
      <SkeletonPremium className="h-6 w-3/4" />
      <SkeletonPremium className="h-4 w-full" />
      <SkeletonPremium className="h-10 w-32" />
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12 space-y-4">
        <SkeletonPremium className="h-10 w-64 mx-auto" />
        <SkeletonPremium className="h-6 w-96 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <PortfolioCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function PricingCardSkeleton() {
  return (
    <div className="space-y-6 p-8 rounded-2xl border bg-card">
      <div className="space-y-3">
        <SkeletonPremium className="h-6 w-32" />
        <SkeletonPremium className="h-12 w-40" />
        <SkeletonPremium className="h-4 w-full" />
      </div>
      
      <SkeletonPremium className="h-12 w-full" />
      
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPremium key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12 space-y-4">
        <SkeletonPremium className="h-10 w-64 mx-auto" />
        <SkeletonPremium className="h-6 w-96 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <PricingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export {
  SkeletonPremium,
  HeroSkeleton,
  FeatureCardSkeleton,
  FeaturesSectionSkeleton,
  PortfolioCardSkeleton,
  PortfolioSkeleton,
  PricingCardSkeleton,
  PricingSkeleton,
};
