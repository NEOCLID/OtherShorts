// serverApi.js
import { API_IP } from './config';

// Define the base API URL ONCE.
const API = `${API_IP}/api`;

export async function fetchBatch(userId, seenUsers = [], submittedRatings = []) {
    try {
        const seenQuery = seenUsers.length > 0 ? `&seen=${seenUsers.join(',')}` : '';
        const submittedQuery = submittedRatings.length > 0 ? `&submitted=${submittedRatings.join(',')}` : '';
        const r = await fetch(`${API}/batch/${userId}?${seenQuery}${submittedQuery}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    } catch (error) {
        console.error('Error fetching batch:', error);
        throw error;
    }
}

export async function submitRating({ userId, reviewerId, rating, political }) {
  try {
    // FIX: Use the consistent API constant
    const response = await fetch(`${API}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reviewerId, rating, political })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Rating submission failed with status ${response.status}. Server response: ${errorBody}`);
        throw new Error(`Server error: ${response.status}`);
    }
  } catch (error) {
    console.error('Network or other error during rating submission:', error.message);
    throw error;
  }
}

// All other functions should also use the API constant for consistency
export async function fetchCountries(){
    // FIX: Use the consistent API constant
    const r = await fetch(`${API}/countries`);
    if(!r.ok) throw new Error('countries fail');
    return r.json();
}

export async function updateUserProfile({id, age, gender, countryId}){
    // FIX: Use the consistent API constant
    const r = await fetch(`${API}/users/${id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ age, gender, countryId })
    });
    if(!r.ok) {
        const err = await r.json();
        console.error('Profile save error:', err);
        throw new Error('profile save');
    }
    return r.json();
}

// NOTE: This function remains as-is because it calls a different endpoint structure.
export async function uploadTakeout(userId, file) {
    const form = new FormData();
    form.append('file',   file);
    form.append('userId', userId);
    const r = await fetch(`${API_IP}/api/uploadTakeout`, {
      method:'POST', body:form
    });
    if(!r.ok) throw new Error('take-out upload failed');
  }