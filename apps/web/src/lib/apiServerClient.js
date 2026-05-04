const API_SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_SERVER_URL}${url}`;
        return await window.fetch(fullUrl, options);
    }
};

export default apiServerClient;

export { apiServerClient };
