// src/utils/formatting.ts

/**
 * Format a date string to a localized date string
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Create a text preview from HTML content
 * @param content - HTML content to preview
 * @param maxLength - Maximum length of preview
 * @returns Text preview
 */
export function createTextPreview(content: string | undefined, maxLength: number = 150): string {
  if (!content) return "";
  
  try {
    // Strip HTML tags
    const strippedContent = content.replace(/<[^>]*>?/gm, "");
    
    // Replace multiple spaces/newlines with a single space
    const normalizedContent = strippedContent.replace(/\s+/g, " ").trim();
    
    // Truncate if necessary
    return normalizedContent.length > maxLength 
      ? normalizedContent.substring(0, maxLength) + "..." 
      : normalizedContent;
  } catch (error) {
    console.error("Error creating preview:", error);
    return "";
  }
}

/**
 * Sanitize HTML string to plain text
 * @param html - HTML string to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeHTML(html: string | undefined): string {
  if (!html) return "";
  
  try {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = html;
    return tempElement.textContent || "";
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    return "";
  }
}

/**
 * Estimate reading time for a given text content
 * @param content - Text content to analyze
 * @param wordsPerMinute - Reading speed in words per minute
 * @returns Estimated reading time in minutes
 */
export function estimateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 0;
  
  try {
    // Remove HTML tags if present
    const plainText = content.replace(/<[^>]*>?/gm, "");
    
    // Count words (split by whitespace)
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate reading time
    return wordCount / wordsPerMinute;
  } catch (error) {
    console.error("Error estimating reading time:", error);
    return 0;
  }
}

/**
 * Format time in minutes to readable duration
 * @param minutes - Number of minutes
 * @returns Formatted duration string
 */
export function formatReadingTime(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) {
    return "< 1 min read";
  }
  
  if (minutes < 1) {
    return "< 1 min read";
  }
  
  if (minutes === 1) {
    return "1 min read";
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min read`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour read" : `${hours} hours read`;
  }
  
  return `${hours} hr ${remainingMinutes} min read`;
}

/**
 * Format a date relative to current time (e.g., "2 hours ago")
 * @param dateString - The date string to format
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return "just now";
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    
    // Less than a month
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "";
  }
}

/**
 * Format a number with appropriate suffixes (K, M, B)
 * @param num - The number to format
 * @param decimals - Number of decimal places to show
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (isNaN(num)) return "0";
  
  if (num === 0) return "0";
  
  if (num < 1000) return num.toString();
  
  const k = 1000;
  const sizes = ["", "K", "M", "B", "T"];
  
  const i = Math.floor(Math.log(num) / Math.log(k));
  
  return parseFloat((num / Math.pow(k, i)).toFixed(decimals)) + sizes[i];
}