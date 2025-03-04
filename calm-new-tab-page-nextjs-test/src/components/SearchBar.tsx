"use client";

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SearchBar() {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preference = localStorage.getItem('searchPref');
      setShowSearch(preference === null ? false : preference === 'true');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Use Google as the default search engine
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    setQuery('');
  };

  if (!showSearch) return null;

  return (
    <div className="search-wrapper w-full max-w-lg mx-auto mb-12">
      <form onSubmit={handleSearch} className="relative">
        <div 
          className={`input-holder flex items-center backdrop-blur-3xl rounded-full h-16 w-full transition-all duration-300 shadow-md
            ${isFocused 
              ? 'bg-white/80 dark:bg-black/50' 
              : 'bg-white/20 dark:bg-black/20'
            }`}
        >
          <Input
            type="text"
            className="search-input h-full pl-6 pr-14 border-none bg-transparent focus-visible:ring-0 text-lg"
            placeholder="Type to search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Button 
            type="submit"
            variant="ghost" 
            size="icon" 
            className="absolute right-3 h-10 w-10 rounded-full"
          >
            <Search 
              className={`h-5 w-5 transition-colors duration-200 ${
                isFocused ? 'text-primary' : 'text-foreground/80'
              }`} 
            />
          </Button>
        </div>
      </form>
    </div>
  );
}