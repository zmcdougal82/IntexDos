import axios from "axios";

// Define the base URL for our API based on environment
const getApiUrl = () => {
  // If running in production (like Azure static website)
  if (window.location.hostname !== "localhost") {
    return "https://moviesapp-api-fixed.azurewebsites.net/api";
  }
  // If running locally - use the ASP.NET backend directly
  return "http://localhost:5237/api";
};

const API_URL = getApiUrl();

// Log the API URL for debugging
console.log("Using API URL:", API_URL);

// Create and configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Enable sending credentials with cross-origin requests (needed for auth)
});

// Add a request interceptor to include the JWT token in requests
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

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
  // Genre flags
  Action?: number;
  Adventure?: number;
  Comedies?: number;
  Dramas?: number;
  HorrorMovies?: number;
  Thrillers?: number;
  Documentaries?: number;
  DocumentariesInternationalMovies?: number;
  DramasInternationalMovies?: number;
  DramasRomanticMovies?: number;
  ComediesRomanticMovies?: number;
  AnimeSeriesInternationalTVShows?: number;
  BritishTVShowsDocuseriesInternationalTVShows?: number;
  InternationalTVShowsRomanticTVShowsTVDramas?: number;
  TalkShowsTVComedies?: number;
  CrimeTVShowsDocuseries?: number;
  LanguageTVShows?: number;
  NatureTV?: number;
  Spirituality?: number;
  ComediesDramasInternationalMovies?: number;
  ComediesInternationalMovies?: number;
  InternationalMoviesThrillers?: number;
  FamilyMovies?: number;
  Fantasy?: number;
  Musicals?: number;
  TVAction?: number;
  TVComedies?: number;
  TVDramas?: number;
  Docuseries?: number;
  KidsTV?: number;
  RealityTV?: number;
  Children?: number;
}

// Auth response interface
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// User interfaces
export interface User {
  id?: string;
  userId?: number; // For backward compatibility
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string;
  role?: string; // "Admin" or "User" (default is "User" as set in backend)
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

export function isAdmin(user?: User | null): boolean {
  return !!user && user.role === "Admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  age?: number;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string;
  netflix?: number;
  amazonPrime?: number;
  disneyPlus?: number;
  paramountPlus?: number;
  max?: number;
  hulu?: number;
  appleTVPlus?: number;
  peacock?: number;
}

// Rating interface
export interface Rating {
  userId: number;
  showId: string;
  ratingValue: number;
  reviewText?: string;
  timestamp: string;
  user?: User;
  movie?: Movie;
}

// MovieList interfaces
export interface MovieList {
  listId: number;
  userId: number;
  name: string;
  description?: string;
  createdDate: string;
  isPublic: boolean;
  items?: MovieListItem[];
  user?: User;
}

export interface MovieListItem {
  listId: number;
  showId: string;
  dateAdded: string;
  movie?: Movie;
}

// API functions for Movies
export const movieApi = {
  getAll: (page = 1, pageSize = 20) =>
    api.get<Movie[]>(`/movies?page=${page}&pageSize=${pageSize}`),

  getById: (id: string) => api.get<Movie>(`/movies/${id}`),

  searchMovies: (query: string, searchField: string = 'title', page = 1, pageSize = 20) =>
    api.get<Movie[]>(
      `/movies/search?query=${encodeURIComponent(
        query
      )}&searchField=${searchField}&page=${page}&pageSize=${pageSize}`
    ),

  getByGenre: (genre: string, page = 1, pageSize = 20) =>
    api.get<Movie[]>(
      `/movies/genre/${genre}?page=${page}&pageSize=${pageSize}`
    ),

  // Get total number of movies in the total db
  getTotalMoviesCount: () => api.get<{ totalMovies: number }>("/movies/count"),

  // Use JSON.stringify to properly format the array as JSON in the request body
  getByMultipleGenres: (genres: string[], page = 1, pageSize = 20) =>
    api.post<Movie[]>(
      `/movies/genres?page=${page}&pageSize=${pageSize}`,
      genres,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    ),

  // Add/Update movie
  updateMovie: (movie: Movie) =>
    api.put<Movie>(`/movies/${movie.showId}`, movie),

  // Create new movie
  createMovie: (movie: Partial<Movie>) => api.post<Movie>("/movies", movie),

  // Delete movie
  deleteMovie: (id: string) =>
    api.delete<void>(`/movies/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
};

// API functions for Auth
export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", credentials),

  register: (userData: RegisterRequest) =>
    api.post<{ message: string }>("/auth/register", userData),
    
  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<{ message: string }>("/auth/forgot-password", data),
    
  resetPassword: (data: ResetPasswordRequest) =>
    api.post<{ message: string }>("/auth/reset-password", data),
};

// API functions for Users
export const userApi = {
  getById: (id: string) => api.get<User>(`/users/${id}`),

  update: (id: string, userData: Partial<User>) =>
    api.put<void>(`/users/${id}`, userData),

  delete: (id: string) => api.delete<void>(`/users/${id}`),
};

// API functions for Ratings
export const ratingApi = {
  getByMovie: (showId: string) => api.get<Rating[]>(`/ratings/movie/${showId}`),

  getByUser: (userId: number) => api.get<Rating[]>(`/ratings/user/${userId}`),

  addRating: (rating: Omit<Rating, "timestamp">) =>
    api.post<Rating>("/ratings", rating),

  deleteRating: (userId: number, showId: string) =>
    api.delete<void>(`/ratings/user/${userId}/movie/${showId}`),
};

// API functions for MovieLists
export const movieListApi = {
  // Get all lists for the current user
  getMyLists: () => api.get<MovieList[]>("/MovieLists"),

  // Get lists by user email (for curated collections)
  getListsByUserEmail: (email: string) => api.get<MovieList[]>(`/MovieLists/byuser/${encodeURIComponent(email)}`),

  // Get a specific list with its movies
  getListById: (listId: number) => api.get<MovieList>(`/MovieLists/${listId}`),

  // Create a new list
  createList: (list: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => api.post<MovieList>("/MovieLists", list),

  // Update an existing list
  updateList: (
    listId: number,
    updates: { name?: string; description?: string; isPublic?: boolean }
  ) => api.put<void>(`/MovieLists/${listId}`, updates),

  // Delete a list
  deleteList: (listId: number) => api.delete<void>(`/MovieLists/${listId}`),

  // Add a movie to a list
  addMovieToList: (listId: number, showId: string) =>
    api.post(`/MovieLists/${listId}/movies`, JSON.stringify(showId), {
      headers: { "Content-Type": "application/json" },
    }),

  // Remove a movie from a list
  removeMovieFromList: (listId: number, showId: string) =>
    api.delete(`/MovieLists/${listId}/movies/${showId}`),
};

export default api;
