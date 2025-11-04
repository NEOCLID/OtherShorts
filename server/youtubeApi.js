import { API_IP } from '../config';
const API_BASE_URL = API_IP;

/**
 * Fetches popular YouTube Shorts videos
 * @returns {Promise<Array>} - Array of video objects
 */
export async function fetchShortsFeed() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shorts`);

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube Shorts');
    }

    const shorts = await response.json();
    // each short has: { id, title, url, thumbnail }
    return shorts;

  } catch (error) {
    console.error('Error fetching YouTube Shorts:', error);
    throw error;
  }
} 