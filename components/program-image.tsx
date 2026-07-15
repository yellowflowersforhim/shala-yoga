
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProgramImageProps {
  imageUrl: string | null;
  programTitle: string;
  className?: string;
}

export function ProgramImage({ imageUrl, programTitle, className = '' }: ProgramImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSignedUrl(null);
    setError(false);
    setIsLoading(true);

    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`/api/programs/image-url/${encodeURIComponent(imageUrl)}`);
        const data = await response.json();
        
        if (response.ok && data.url) {
          setSignedUrl(data.url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSignedUrl();
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-[hsl(var(--brand-primary-light))] flex items-center justify-center ${className}`}>
        <div className="animate-pulse text-[hsl(var(--brand-primary))]">Cargando...</div>
      </div>
    );
  }

  if (!imageUrl || error || !signedUrl) {
    return (
      <div className={`bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-[hsl(var(--brand-primary-light))] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-5xl mb-2">🧘</div>
          <p className="text-sm text-[hsl(var(--brand-primary-dark))] font-semibold px-4">{programTitle.substring(0, 25)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={signedUrl}
        alt={programTitle}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={() => setError(true)}
      />
    </div>
  );
}
