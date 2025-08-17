export const isValidUrl = (urlString: string): boolean => {
  if (!urlString) return true;
  
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateMovieUrl = (url: string): string | null => {
  if (!url) return 'Movie URL is required';
  if (!isValidUrl(url)) return 'Please enter a valid URL';
  return null;
};

export const validateImageUrl = (url: string): string | null => {
  if (url && !isValidUrl(url)) return 'Please enter a valid image URL';
  return null;
};