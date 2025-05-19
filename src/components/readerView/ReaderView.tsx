// src/components/ReaderView.tsx
import { useState, useEffect } from 'react';
import { ReaderViewResponse } from '../../types/api';

interface ReaderViewProps {
  url: string;
}

const ReaderView: React.FC<ReaderViewProps> = ({ url }) => {
  const [content, setContent] = useState<ReaderViewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: 'fetchReaderView', urls: [url] },
      (response: ReaderViewResponse | { error: string }) => {
        if ('error' in response) {
          console.error(response.error);
        } else {
          setContent(response);
        }
        setLoading(false);
      }
    );
  }, [url]);

  if (loading) {
    return <div>Loading reader view...</div>;
  }

  if (!content) {
    return <div>Error loading content.</div>;
  }

  return (
    <div>
      <h2>{content.title}</h2>
      <h3>{content.siteName}</h3>
      <img src={content.image} alt={content.title} className='w-full' />
      <div dangerouslySetInnerHTML={{ __html: content.content }} />
    </div>
  );
};

export default ReaderView;
