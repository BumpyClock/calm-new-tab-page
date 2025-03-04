"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Site } from '@/types';

export default function MostVisitedSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMostVisitedSites() {
      setIsLoading(true);
      try {
        if (typeof chrome !== 'undefined' && chrome.topSites) {
          // Chrome extension environment
          chrome.topSites.get((topSites) => {
            const sites = topSites
              .filter(site => !site.url.startsWith('chrome-extension://'))
              .slice(0, 10)
              .map(async (site) => {
                // Get favicon
                const url = new URL(site.url);
                const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
                
                return {
                  title: site.title,
                  url: site.url,
                  favicon
                };
              });
            
            // Resolve all the favicon promises
            Promise.all(sites).then(setSites);
          });
        } else {
          // Web environment - use placeholder/local storage
          const getSavedSites = localStorage.getItem('mostVisitedSites');
          
          if (getSavedSites) {
            // Use cached sites if available
            setSites(JSON.parse(getSavedSites));
          } else {
            // Otherwise use placeholder sites
            const placeholderSites: Site[] = [
              { title: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico' },
              { title: 'YouTube', url: 'https://www.youtube.com', favicon: 'https://www.youtube.com/favicon.ico' },
              { title: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico' },
              { title: 'Reddit', url: 'https://www.reddit.com', favicon: 'https://www.reddit.com/favicon.ico' },
              { title: 'Twitter', url: 'https://twitter.com', favicon: 'https://twitter.com/favicon.ico' },
              { title: 'Netflix', url: 'https://www.netflix.com', favicon: 'https://www.netflix.com/favicon.ico' },
              { title: 'Amazon', url: 'https://www.amazon.com', favicon: 'https://www.amazon.com/favicon.ico' },
              { title: 'Wikipedia', url: 'https://www.wikipedia.org', favicon: 'https://www.wikipedia.org/favicon.ico' },
            ];
            
            setSites(placeholderSites);
            // Cache these sites
            localStorage.setItem('mostVisitedSites', JSON.stringify(placeholderSites));
          }
        }
      } catch (error) {
        console.error('Failed to load most visited sites:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMostVisitedSites();
  }, []);

  if (isLoading) {
    return (
      <div className="most-visited-sites mb-12">
        <div className="most-visited-sites-container flex flex-wrap justify-center gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="site-card animate-pulse">
              <Card className="w-24 h-24 bg-white/10 dark:bg-black/20">
                <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                  <div className="rounded-full bg-gray-300 dark:bg-gray-700 w-10 h-10 mb-2"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sites.length === 0) return null;

  return (
    <div className="most-visited-sites mb-12">
      <div className="most-visited-sites-container flex flex-wrap justify-center gap-3">
        {sites.map((site) => (
          <a 
            key={site.url} 
            href={site.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-card focus:outline-none"
          >
            <Card className="site-card w-24 h-24 bg-white/10 dark:bg-black/20 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-200 shadow-md hover:shadow-lg group overflow-hidden">
              <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                <div className="site-card-background-image-container absolute inset-0 opacity-5 z-0 group-hover:opacity-10 transition-opacity" style={{ backgroundImage: `url(${site.favicon})` }} />
                <img 
                  src={site.favicon} 
                  alt={`${site.title} Favicon`} 
                  className="site-favicon w-10 h-10 mb-2 rounded object-contain" 
                  onError={(e) => {
                    // Use a fallback image if the favicon fails to load
                    (e.target as HTMLImageElement).src = '/images/placeholder-favicon.png';
                  }}
                />
                <div className="site-title">
                  <p className="text-xs text-center line-clamp-2">{site.title}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}