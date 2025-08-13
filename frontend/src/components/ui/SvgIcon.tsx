import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

export type SvgIconProps = {
  path: string;
  darkPath?: string;
  alt: string;
  size?: number;
  className?: string;
  title?: string;
};

const SvgIcon: React.FC<SvgIconProps> = ({
  path,
  darkPath,
  alt,
  size = 36,
  className,
  title,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? 'light') === 'dark';
  const selectedPath = isDark && darkPath ? darkPath : path;
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        aria-label={alt}
        title={title ?? alt}
        className={cn(
          'inline-block rounded-md bg-muted text-muted-foreground',
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={selectedPath}
      width={size}
      height={size}
      alt={alt}
      title={title ?? alt}
      loading="lazy"
      className={cn('select-none', className)}
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
};

export default SvgIcon;
