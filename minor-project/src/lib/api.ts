import axios from "axios";
import { setupInterceptors } from "./interceptors";

const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

const API = axios.create({ baseURL });

setupInterceptors(API);

export default API;
