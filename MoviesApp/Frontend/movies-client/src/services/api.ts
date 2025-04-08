import axios from 'axios';

// Define the base URL for our API
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api';

// Create and configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Movie interfaces
export interface Movie {
  showId: string;
  type?: string;
  title: string;
  director?: string;
  cast?: string;
  country?: string;
  releaseYear?: number;
  rating?: string;
  duration?: string;
  description?: string;
  posterUrl?: string;
  // We'll omit all the genre flags for simplicity in the interface
}

// User interfaces
export interface User {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string; // Changed from number to string to match backend model
  role?: string;
  // Streaming services
  netflix?: number;
  amazonPrime?: number;
  disneyPlus?: number;
  paramountPlus?: number;
  max?: number;
  hulu?: number;
  appleTVPlus?: number;
  peacock?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Rating interface
export interface Rating {
  userId: number;
  showId: string;
  ratingValue: number;
  timestamp: string;
}

// API functions for Movies
export const movieApi = {
  getAll: (page = 1, pageSize = 20) =>
    api.get<Movie[]>(`/movies?page=${page}&pageSize=${pageSize}`),

  getById: (id: string) =>
    api.get<Movie>(`/movies/${id}`),

  searchMovies: (query: string) =>
    api.get<Movie[]>(`/movies/search?query=${encodeURIComponent(query)}`),

  getByGenre: (genre: string, page = 1, pageSize = 20) =>
    api.get<Movie[]>(`/movies/genre/${genre}?page=${page}&pageSize=${pageSize}`)
};

// API functions for Users
export const userApi = {
  login: (credentials: LoginRequest) =>
    api.post<User>('/users/login', credentials),

  register: (userData: RegisterRequest) =>
    api.post<User>('/users/register', userData),

  getById: (id: number) =>
    api.get<User>(`/users/${id}`),

  update: (id: number, userData: Partial<User>) =>
    api.put<void>(`/users/${id}`, userData)
};

// API functions for Ratings
export const ratingApi = {
  getByMovie: (showId: string) =>
    api.get<Rating[]>(`/ratings/movie/${showId}`),

  getByUser: (userId: number) =>
    api.get<Rating[]>(`/ratings/user/${userId}`),

  addRating: (rating: Omit<Rating, 'timestamp'>) =>
    api.post<Rating>('/ratings', rating),

  deleteRating: (userId: number, showId: string) =>
    api.delete<void>(`/ratings/user/${userId}/movie/${showId}`)
};

export default api;
