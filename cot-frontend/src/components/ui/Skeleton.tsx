import React from 'react';

/**
 * Brand loading placeholder. Use in place of ad-hoc `animate-pulse` divs.
 * Size/shape it with utility classes, e.g. <Skeleton className="h-6 w-32" />.
 */
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => <div className={`animate-pulse rounded bg-muted ${className}`} {...props} />;
