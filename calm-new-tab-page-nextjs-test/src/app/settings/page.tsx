"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Feed } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Upload, Rss } from 'lucide-react';
import SubscribedFeedsList from '@/components/settings/SubscribedFeedsList';
import { fetchFeedDetails } from '@/lib/api';
import BackgroundImage from '@/components/BackgroundImage';

export default function SettingsPage() {
  const router = useRouter();
  const [subscribedFeeds, setSubscribedFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedUrl, setFeedUrl] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [feedDiscoveryEnabled, setFeedDiscoveryEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const apiUrlValue = localStorage.getItem('apiUrl') || 'https://rss.bumpyclock.com';
      setApiUrl(apiUrlValue);
      
      const searchPref = localStorage.getItem('searchPref');
      setSearchEnabled(searchPref === null ? false : searchPref === 'true');
      
      const discoveryPref = localStorage.getItem('feedDiscoveryPref');
      setFeedDiscoveryEnabled(discoveryPref === null ? true : discoveryPref === 'true');
      
      loadSubscribedFeeds();
    }
  }, []);

  const loadSubscribedFeeds = async () => {
    setIsLoading(true);
    try {
      const feedUrls = getSubscribedFeedUrls();
      
      if (feedUrls.length === 0) {
        setSubscribedFeeds([]);
        setIsLoading(false);
        return;
      }
      
      // Try to get feed details from cache first
      const cachedFeeds = localStorage.getItem('feedDetails');
      if (cachedFeeds) {
        setSubscribedFeeds(JSON.parse(cachedFeeds));
      }
      
      // Fetch fresh feed details
      const feeds = await fetchFeedDetails(feedUrls);
      
      // Cache feed details
      localStorage.setItem('feedDetails', JSON.stringify(feeds));
      
      setSubscribedFeeds(feeds);
    } catch (error) {
      console.error('Failed to load subscribed feeds:', error);
      setError('Failed to load subscribed feeds');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscribedFeedUrls = (): string[] => {
    const feeds = localStorage.getItem('subscribedFeeds');
    if (!feeds) {
      // Set default feeds if none exist
      const defaults = [
        "http://www.theverge.com/rss/index.xml",
        "https://www.wired.com/feed/rss",
        "https://www.engadget.com/rss.xml"
      ];
      localStorage.setItem('subscribedFeeds', JSON.stringify(defaults));
      return defaults;
    }
    
    return JSON.parse(feeds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      // Validate URL format
      let url = feedUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Try to get feed details
      const feeds = await fetchFeedDetails([url]);
      
      if (feeds.length === 0) {
        throw new Error('Invalid feed URL');
      }
      
      // Add to subscribed feeds
      addSubscribedFeed(url);
      
      // Update local state
      setSubscribedFeeds(prev => [...prev, feeds[0]]);
      
      // Clear input
      setFeedUrl('');
    } catch (error) {
      console.error('Failed to add feed:', error);
      setError('Failed to add feed. Please check the URL and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const addSubscribedFeed = (url: string) => {
    const feedUrls = getSubscribedFeedUrls();
    
    // Check if already subscribed
    if (!feedUrls.includes(url)) {
      feedUrls.push(url);
      localStorage.setItem('subscribedFeeds', JSON.stringify(feedUrls));
      
      // Clear cached feed items to force refresh
      localStorage.removeItem('feedItems');
      localStorage.removeItem('feedItemsTimestamp');
    }
  };

  const handleRemoveFeed = (feedUrl: string) => {
    const feedUrls = getSubscribedFeedUrls();
    const updatedUrls = feedUrls.filter(url => url !== feedUrl);
    
    localStorage.setItem('subscribedFeeds', JSON.stringify(updatedUrls));
    
    // Update UI
    setSubscribedFeeds(prev => prev.filter(feed => feed.feedUrl !== feedUrl));
    
    // Clear cached feed items to force refresh
    localStorage.removeItem('feedItems');
    localStorage.removeItem('feedItemsTimestamp');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.name.endsWith('.opml')) {
      setError('Please upload an OPML file');
      return;
    }
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      const outlines = xmlDoc.getElementsByTagName('outline');
      const feedUrls: string[] = [];
      
      for (let i = 0; i < outlines.length; i++) {
        const outline = outlines[i];
        if (outline.getAttribute('type') === 'rss') {
          const xmlUrl = outline.getAttribute('xmlUrl');
          if (xmlUrl) {
            feedUrls.push(xmlUrl);
          }
        }
      }
      
      if (feedUrls.length === 0) {
        setError('No feeds found in the OPML file');
        return;
      }
      
      // Get details for all feeds
      const feeds = await fetchFeedDetails(feedUrls);
      
      // Add all feeds to subscribed list
      const currentUrls = getSubscribedFeedUrls();
      const newUrls = feedUrls.filter(url => !currentUrls.includes(url));
      
      if (newUrls.length === 0) {
        setError('All feeds in this file are already subscribed');
        return;
      }
      
      const updatedUrls = [...currentUrls, ...newUrls];
      localStorage.setItem('subscribedFeeds', JSON.stringify(updatedUrls));
      
      // Update UI
      setSubscribedFeeds(prev => [...prev, ...feeds]);
      
      // Clear cached feed items to force refresh
      localStorage.removeItem('feedItems');
      localStorage.removeItem('feedItemsTimestamp');
      
      // Clear the file input
      e.target.value = '';
    } catch (error) {
      console.error('Failed to process OPML file:', error);
      setError('Failed to process OPML file');
    }
  };

  const saveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('apiUrl', apiUrl);
    
    // Clear cached data to force refresh with new API
    localStorage.removeItem('feedItems');
    localStorage.removeItem('feedItemsTimestamp');
    localStorage.removeItem('feedDetails');
  };

  const toggleSearchPreference = (enabled: boolean) => {
    setSearchEnabled(enabled);
    localStorage.setItem('searchPref', enabled.toString());
  };

  const toggleFeedDiscovery = (enabled: boolean) => {
    setFeedDiscoveryEnabled(enabled);
    localStorage.setItem('feedDiscoveryPref', enabled.toString());
  };

  return (
    <div className="min-h-screen pb-12">
      <BackgroundImage />
      
      <div className="container mx-auto p-4 relative">
        <Button 
          variant="ghost" 
          className="mb-4 text-white hover:text-white/80 hover:bg-white/10" 
          onClick={() => router.push('/')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="max-w-6xl mx-auto mt-4 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
          
          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="mb-6 bg-white/10 backdrop-blur-md">
              <TabsTrigger value="subscriptions">Feed Subscriptions</TabsTrigger>
              <TabsTrigger value="display">Display Preferences</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscriptions">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscribed Feeds</CardTitle>
                    <CardDescription>
                      Manage your RSS feed subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubscribedFeedsList 
                      feeds={subscribedFeeds} 
                      onRemove={handleRemoveFeed} 
                      isLoading={isLoading} 
                    />
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Feed</CardTitle>
                      <CardDescription>
                        Subscribe to a new RSS feed by URL
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="flex space-x-2">
                        <div className="flex-1">
                          <Input 
                            type="url" 
                            placeholder="Enter feed URL" 
                            value={feedUrl} 
                            onChange={(e) => setFeedUrl(e.target.value)} 
                            required 
                          />
                        </div>
                        <Button type="submit" disabled={isAdding}>
                          <Rss className="h-4 w-4 mr-2" />
                          Subscribe
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Import OPML</CardTitle>
                      <CardDescription>
                        Import feeds from an OPML file
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="opml-file" 
                          type="file" 
                          accept=".opml" 
                          className="hidden" 
                          onChange={handleFileUpload} 
                        />
                        <Button 
                          onClick={() => document.getElementById('opml-file')?.click()}
                          variant="outline"
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload OPML File
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="display">
              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>
                    Customize the appearance of your new tab page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="search-toggle" className="text-base">Search Box</Label>
                      <p className="text-sm text-muted-foreground">
                        Show search box on the new tab page
                      </p>
                    </div>
                    <Switch 
                      id="search-toggle" 
                      checked={searchEnabled} 
                      onCheckedChange={toggleSearchPreference} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="feed-discovery-toggle" className="text-base">Feed Discovery</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically discover feeds from your most visited sites
                      </p>
                    </div>
                    <Switch 
                      id="feed-discovery-toggle" 
                      checked={feedDiscoveryEnabled} 
                      onCheckedChange={toggleFeedDiscovery} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>API Settings</CardTitle>
                  <CardDescription>
                    Configure API endpoint for feed fetching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveApiUrl} className="flex space-x-2">
                    <div className="flex-1">
                      <Input 
                        type="url" 
                        placeholder="Enter API URL" 
                        value={apiUrl} 
                        onChange={(e) => setApiUrl(e.target.value)} 
                        required 
                      />
                    </div>
                    <Button type="submit">Save</Button>
                  </form>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Default API: https://rss.bumpyclock.com
                  </p>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Credits</CardTitle>
                  <CardDescription>
                    Libraries and resources used in this application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Frontend Dependencies</h3>
                      <ul className="list-disc list-inside text-muted-foreground ml-4 mt-1">
                        <li>Next.js</li>
                        <li>shadcn/ui Components</li>
                        <li>Masonry.js</li>
                        <li>Lucide Icons</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Backend Dependencies</h3>
                      <ul className="list-disc list-inside text-muted-foreground ml-4 mt-1">
                        <li>rss-to-json</li>
                        <li>Readability.js</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}