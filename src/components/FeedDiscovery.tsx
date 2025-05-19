// src/components/FeedDiscovery.tsx
import { useState } from 'react';

const FeedDiscovery = () => {
  const [siteUrl, setSiteUrl] = useState('');
  const [discoveredFeeds, setDiscoveredFeeds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const discover = () => {
    chrome.runtime.sendMessage(
      { action: 'discoverFeeds', discoverUrls: [siteUrl] },
      (response: any) => {
        if (response.error) {
          setError(response.error);
        } else {
          // Assume response.feeds exists and is an array
          setDiscoveredFeeds(response.feeds.map((feed: any) => feed.feedUrl || feed.url));
          setError('');
        }
      }
    );
  };

  return (
    <div>
      <h2>Discover Feeds</h2>
      <input
        type="text"
        placeholder="Enter website URL"
        value={siteUrl}
        onChange={(e) => setSiteUrl(e.target.value)}
      />
      <button onClick={discover}>Discover</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {discoveredFeeds.length > 0 && (
        <ul>
          {discoveredFeeds.map((feedUrl, index) => (
            <li key={index}>
              <a href={feedUrl} target="_blank" rel="noopener noreferrer">
                {feedUrl}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedDiscovery;
