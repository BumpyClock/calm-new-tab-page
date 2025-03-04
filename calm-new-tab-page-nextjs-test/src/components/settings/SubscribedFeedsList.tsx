import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Feed } from '@/types';
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscribedFeedsListProps {
  feeds: Feed[];
  onRemove: (feedUrl: string) => void;
  isLoading?: boolean;
}

export default function SubscribedFeedsList({ 
  feeds, 
  onRemove, 
  isLoading = false 
}: SubscribedFeedsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2 p-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-5 w-3/4 mt-2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No feeds subscribed yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {feeds.map((feed) => (
        <Card key={feed.feedUrl} className="relative group overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-5 z-0">
            <div className="absolute inset-0 bg-[url('/images/noisy-background.jpg')] opacity-20" />
          </div>
          
          <CardContent className="p-4 z-10 relative">
            <div className="flex flex-col items-center gap-2 p-2">
              {feed.favicon && (
                <img 
                  src={feed.favicon} 
                  alt={`${feed.siteTitle} Favicon`}
                  className="w-12 h-12 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-favicon.png';
                  }}
                />
              )}
              
              <h3 className="font-semibold text-center line-clamp-2 mt-2">
                {feed.siteTitle || feed.feedTitle}
              </h3>
              
              <p className="text-sm text-center text-muted-foreground line-clamp-1">
                {feed.feedTitle}
              </p>
              
              <p className="text-xs text-center text-muted-foreground/70 truncate w-full">
                {feed.feedUrl}
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              size="sm"
              className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => onRemove(feed.feedUrl)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Unsubscribe
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}