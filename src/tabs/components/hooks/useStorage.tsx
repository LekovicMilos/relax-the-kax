import { useState, useEffect } from "react";
import { getRandomPhotos } from "../api/imageFetch";
import { restoreFromStorage, saveToStorage } from "../api/storage";
import { isADayAgo } from "../utils/date";
import moment from "moment";

interface Photo {
  photo: string;
  photoLink: string;
  author?: string;
}

interface StorageData {
  randomPhotos: Photo[];
  date: string;
}

/**
 * Hook for managing background photos from Picsum
 * Caches photos for a day to reduce API calls
 */
function useStorage() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    loadStoredPhotos();
  }, []);

  const loadStoredPhotos = async () => {
    const stored = (await restoreFromStorage()) as StorageData;
    const shouldRefresh = isADayAgo(stored.date);

    // Check if cached photos are from old Pixabay format (need refresh)
    const hasOldFormat =
      stored.randomPhotos?.[0]?.photo?.includes("pixabay") ||
      stored.randomPhotos?.[0]?.photoLink?.includes("pixabay");

    if (!shouldRefresh && !hasOldFormat && stored.randomPhotos?.length > 0) {
      // Use cached photos
      setDate(stored.date);
      selectRandomPhoto(stored.randomPhotos);
    } else {
      // Fetch new photos (or refresh old Pixabay cache)
      fetchNewPhotos();
    }
  };

  const selectRandomPhoto = (photos: Photo[]) => {
    if (photos.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * Math.min(20, photos.length)
      );
      setPhoto(photos[randomIndex]);
    }
  };

  const fetchNewPhotos = async () => {
    try {
      const response = await getRandomPhotos();
      if (response?.hits) {
        const photos: Photo[] = response.hits.map((hit: any) => ({
          photo: hit.largeImageURL,
          photoLink: hit.pageURL,
          author: hit.user,
        }));

        const newDate = moment().format("YYYY-MM-DD");

        // Save to storage
        await saveToStorage({
          randomPhotos: photos,
          date: newDate,
        });

        setDate(newDate);
        selectRandomPhoto(photos);
      }
    } catch {
      // Silent fail - photo fetch error
    }
  };

  return { photo };
}

export default useStorage;
