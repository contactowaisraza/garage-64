import Pocketbase from 'pocketbase';

// Use local PocketBase url in development, and relative proxy url in production
const POCKETBASE_API_URL = "http://127.0.0.1:8090";

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
