/**
 * Fetch random background photos from Picsum (Lorem Picsum)
 * Free service, no API key required
 * https://picsum.photos/
 */

interface PicsumImage {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export async function getRandomPhotos(): Promise<{ hits: any[] }> {
  try {
    // Fetch list of random images from Picsum
    const response = await fetch('https://picsum.photos/v2/list?page=1&limit=20');
    const images: PicsumImage[] = await response.json();
    
    // Transform to match our expected format
    const hits = images.map(img => ({
      largeImageURL: `https://picsum.photos/id/${img.id}/1920/1080`,
      pageURL: img.url,
      user: img.author,
    }));
    
    return { hits };
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return { hits: [] };
  }
}
