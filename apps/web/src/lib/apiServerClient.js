const API_SERVER_URL = "/hcgi/api";

const apiServerClient = {
    fetch: async (url, options = {}) => {
        return await window.fetch(url, options);
    }
};

export default apiServerClient;

export { apiServerClient };
