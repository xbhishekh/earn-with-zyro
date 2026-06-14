import { forwardRef, useCallback } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { prefetchRoute } from "@/lib/prefetch";

/**
 * Drop-in <Link> replacement that prefetches the route bundle on hover/focus.
 * Use for any internal nav that points at a lazy-loaded route.
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onMouseEnter, onFocus, ...rest }, ref) => {
    const handleEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (typeof to === "string") prefetchRoute(to);
        onMouseEnter?.(e);
      },
      [to, onMouseEnter]
    );
    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (typeof to === "string") prefetchRoute(to);
        onFocus?.(e);
      },
      [to, onFocus]
    );
    return <Link ref={ref} to={to} onMouseEnter={handleEnter} onFocus={handleFocus} {...rest} />;
  }
);
PrefetchLink.displayName = "PrefetchLink";
