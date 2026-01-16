import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  fallback?: React.ReactNode;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
  showLoader?: boolean;
  onLoadComplete?: () => void;
}

const aspectRatioClasses = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  auto: '',
};

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      className,
      fallback,
      aspectRatio = 'auto',
      showLoader = true,
      onLoadComplete,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: '100px', // Start loading 100px before entering viewport
          threshold: 0.01,
        }
      );

      observer.observe(container);

      return () => observer.disconnect();
    }, []);

    // Reset states when src changes
    useEffect(() => {
      setIsLoading(true);
      setHasError(false);
    }, [src]);

    const handleLoad = () => {
      setIsLoading(false);
      onLoadComplete?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    // No src provided
    if (!src) {
      return (
        <div
          ref={containerRef}
          className={cn(
            'flex items-center justify-center bg-muted',
            aspectRatioClasses[aspectRatio],
            className
          )}
        >
          {fallback || (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8 mb-2" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-muted',
          aspectRatioClasses[aspectRatio]
        )}
      >
        {/* Loading skeleton */}
        {showLoader && isLoading && !hasError && (
          <div className="absolute inset-0 bg-muted animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent skeleton-shimmer" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {fallback || (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="h-8 w-8 mb-2" />
                <span className="text-xs">Failed to load</span>
              </div>
            )}
          </div>
        )}

        {/* Actual image - only render when in view */}
        {isInView && !hasError && (
          <img
            ref={ref || imgRef}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Thumbnail variant for grids and cards
interface ThumbnailImageProps extends Omit<OptimizedImageProps, 'aspectRatio'> {
  aspectRatio?: 'video' | 'square';
  hoverScale?: boolean;
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  hoverScale = true,
  className,
  ...props
}) => {
  return (
    <OptimizedImage
      aspectRatio="video"
      className={cn(
        hoverScale && 'group-hover:scale-105 transition-transform duration-300',
        className
      )}
      {...props}
    />
  );
};

// Avatar-specific optimized image
interface AvatarImageOptimizedProps {
  src: string | undefined | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitial?: string;
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const AvatarImageOptimized: React.FC<AvatarImageOptimizedProps> = ({
  src,
  alt,
  size = 'md',
  fallbackInitial,
  className,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium',
          avatarSizes[size],
          className
        )}
      >
        {fallbackInitial?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden bg-muted', avatarSizes[size], className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
};

export default OptimizedImage;
