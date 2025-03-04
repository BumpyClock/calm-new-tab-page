"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FeedItem } from '@/types';
import { useReaderView } from '@/lib/hooks/useReaderView';
import { generateBoxShadow } from '@/lib/api';

interface FeedCardProps {
  item: FeedItem;
}

export default function FeedCard({ item }: FeedCardProps) {
  const { openReaderView } = useReaderView();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on a link
    if ((e.target as HTMLElement).tagName.toLowerCase() !== 'a') {
      openReaderView(item.link);
    }
  };

  // Setup parallax effect
  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card || !image) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!hovered || !image) return;
      
      const cardRect = card.getBoundingClientRect();
      const xVal = (e.clientX - cardRect.left) / cardRect.width;
      const yVal = (e.clientY - cardRect.top) / cardRect.height;
      
      const xOffset = -(xVal - 0.5) * 20;
      const yOffset = -(yVal - 0.5) * 20;
      
      image.style.objectPosition = `calc(50% + ${xOffset}px) calc(50% + ${yOffset}px)`;
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hovered]);

  // Box shadow states for normal, hover, and active states
  const normalShadow = generateBoxShadow(item.thumbnailColor, 5, 0.3, 4);
  const hoverShadow = generateBoxShadow(item.thumbnailColor, 8, 0.4, 5);
  const activeShadow = generateBoxShadow(item.thumbnailColor, 4, 0.4, 3);
  
  const [currentShadow, setCurrentShadow] = useState(normalShadow);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch {
      return '';
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="card max-w-sm mb-6 overflow-hidden transition-all duration-200 relative"
      onClick={handleCardClick}
      style={{ boxShadow: currentShadow }}
      onMouseEnter={() => {
        setHovered(true);
        setCurrentShadow(hoverShadow);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setCurrentShadow(normalShadow);
        if (imageRef.current) {
          imageRef.current.style.objectPosition = '50% 50%';
          imageRef.current.style.transform = 'scale(1)';
        }
      }}
      onMouseDown={() => setCurrentShadow(activeShadow)}
      onMouseUp={() => setCurrentShadow(hoverShadow)}
    >
      <div className="card-bg absolute inset-0 -z-10">
        <div className="noise absolute inset-0 bg-[url('/images/noisy-background.jpg')] bg-repeat opacity-20"></div>
        {item.thumbnail && (
          <img 
            src={item.thumbnail} 
            alt={`${item.title} background`} 
            className="absolute w-[140%] h-[120%] -bottom-[20%] -left-[20%] filter blur-[60px] brightness-[1.5] dark:brightness-50 opacity-35 scale-[1.4] transition-all duration-250 z-[-2]"
          />
        )}
      </div>
      
      {item.thumbnail && (
        <div className={`image-container relative max-h-80 overflow-hidden m-2 rounded-3xl ${!imageLoaded ? 'loading' : ''}`}>
          <img
            ref={imageRef}
            src={item.thumbnail}
            id="thumbnail-image"
            alt={`${item.title} Thumbnail`}
            className="thumbnail-image w-full object-cover transition-transform duration-250 rounded-3xl"
            style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}
      
      <CardContent className="text-content p-6 flex flex-col gap-1">
        <div className="website-info flex items-center gap-2 mb-2">
          {item.favicon && (
            <img 
              src={item.favicon} 
              alt={`${item.siteTitle} Favicon`} 
              className="site-favicon w-5 h-5 rounded"
            />
          )}
          <p className="text-sm font-semibold">{item.feedTitle || item.siteTitle}</p>
        </div>
        
        <h3 className="text-lg font-medium line-clamp-3 mb-1">{item.title}</h3>
        
        {item.content && (
          <div 
            className="description text-sm line-clamp-3 mb-4 opacity-80"
            dangerouslySetInnerHTML={{ 
              __html: item.content.replace(/<[^>]*>/g, ' ').substring(0, 150) + (item.content.length > 150 ? '...' : '') 
            }}
          />
        )}
        
        <div className="date text-xs opacity-70 font-bold mb-2">
          {formatDate(item.published)}
        </div>
        
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="read-more-link text-sm font-semibold hover:underline"
        >
          Read more
        </a>
      </CardContent>
    </Card>
  );
}