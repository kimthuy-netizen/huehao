import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function ResilientImage({
  src,
  fallbackSrc,
  alt,
  fallbackTitle,
  className = '',
}: ResilientImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#EBE8E1] text-[#5B5F66] p-6 text-center ${className}`}
      >
        <Layers className="w-8 h-8 mb-2 stroke-[1.5]" aria-hidden="true" />
        <span className="text-xs font-medium text-[#141619] line-clamp-2 max-w-[180px]">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
      className={className}
    />
  );
}
