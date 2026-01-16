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

/**
 * Fetch random photos from a random page for variety
 * Picsum has ~1000 images across ~50 pages
 */
export async function getRandomPhotos(): Promise<{ hits: any[] }> {
  try {
    // Random page between 1 and 50 for variety
    const randomPage = Math.floor(Math.random() * 50) + 1;
    
    // Fetch 30 images from random page
    const response = await fetch(`https://picsum.photos/v2/list?page=${randomPage}&limit=30`);
    const images: PicsumImage[] = await response.json();
    
    // Shuffle the images for extra randomness
    const shuffled = images.sort(() => Math.random() - 0.5);
    
    // Transform to match our expected format
    const hits = shuffled.map(img => ({
      largeImageURL: `https://picsum.photos/id/${img.id}/1920/1080`,
      pageURL: img.url,
      user: img.author,
    }));
    
    return { hits };
  } catch {
    return { hits: [] };
  }
}
