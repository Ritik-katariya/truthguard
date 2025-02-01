import axios from 'axios';
import { API_URL, API_TIMEOUT, MAX_HISTORY_ITEMS, ENDPOINTS } from '../config.js';


export const checkContent = async (content) => {
    try {
        const response = await axios.post(`${API_URL}${ENDPOINTS.CHECK}`, { content }, {
            timeout: API_TIMEOUT
        });
        
        // Validate response
        if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response from server');
        }

        // Store in local history after successful analysis
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        history.unshift(response.data);
        localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
        
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to analyze content. Please try again.');
    }
};

export const getAnalysisHistory = () => {
    return JSON.parse(localStorage.getItem('analysisHistory') || '[]');
};

export const clearHistory = () => {
    localStorage.removeItem('analysisHistory');
};
