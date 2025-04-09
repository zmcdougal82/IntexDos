import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, movieApi } from '../services/api';

// Interface for form data
interface MovieFormData {
  showId: string;
  title: string;
  type?: string;
  director?: string;
  cast?: string;
  country?: string;
  releaseYear?: number;
  rating?: string;
  duration?: string;
  description?: string;
  posterUrl?: string;
  // Movie genres
  Action?: number;
  Adventure?: number;
  Comedies?: number;
  Dramas?: number;
  HorrorMovies?: number;
  Thrillers?: number;
  Documentaries?: number;
  FamilyMovies?: number;
  Fantasy?: number;
  Musicals?: number;
  // TV genres
  TVAction?: number;
  TVComedies?: number;
  TVDramas?: number;
  Docuseries?: number;
  KidsTV?: number;
  RealityTV?: number;
  Children?: number;
  // Additional genres
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
}

const AdminMoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalMovies, setTotalMovies] = useState(0);
  const [editingMovie, setEditingMovie] = useState<MovieFormData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<MovieFormData>({
    showId: '',
    title: '',
    type: 'Movie',
    releaseYear: new Date().getFullYear(),
  });

  // Validate admin permissions
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Redirect if not admin
        if (userData.role !== 'Admin') {
          navigate('/');
          alert('You need admin permissions to access this page');
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch movies with search and filters
  useEffect(() => {
    const fetchMovies = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        let response;
        
          // If search query exists, use search endpoint with pagination
          if (searchQuery) {
            // Pass pageSize as the limit to ensure we only get the correct number of items
            response = await movieApi.searchMovies(searchQuery, currentPage, pageSize);
            
            // CRITICAL: Force limit the displayed items to pageSize regardless of API response
            const limitedResults = response.data.slice(0, pageSize);
            setMovies(limitedResults);
            
            // Store the total count from response for pagination
            setTotalMovies(response.data.length);
          } 
        // Separate handling for filters without search query
        else if (selectedType || selectedGenre || yearFrom !== undefined || yearTo !== undefined) {
          // For filters without search, we need to get all movies first
          response = await movieApi.getAll(currentPage, pageSize);
          
          // Start with the response data
          let filteredMovies = [...response.data];
          
          // Apply type filter if selected
          if (selectedType) {
            filteredMovies = filteredMovies.filter(movie => movie.type === selectedType);
          }
          
          // Apply genre filter if selected
          if (selectedGenre) {
            filteredMovies = filteredMovies.filter(movie => {
              // Need to cast to 'any' to access dynamic property
              return (movie as any)[selectedGenre] === 1;
            });
          }
          
          // Apply year range filters if specified
          if (yearFrom !== undefined) {
            filteredMovies = filteredMovies.filter(movie => 
              movie.releaseYear !== undefined && movie.releaseYear >= yearFrom
            );
          }
          
          if (yearTo !== undefined) {
            filteredMovies = filteredMovies.filter(movie => 
              movie.releaseYear !== undefined && movie.releaseYear <= yearTo
            );
          }
          
          // Update the movies state
          setMovies(filteredMovies);
          
          // For filtered results, we estimate based on current page data
          setTotalMovies(filteredMovies.length > 0 ? 
            currentPage * pageSize + (filteredMovies.length === pageSize ? pageSize : 0) : 
            filteredMovies.length);
        } 
        // No search or filters, just get paged data
        else {
          response = await movieApi.getAll(currentPage, pageSize);
          setMovies(response.data);
          
          // For regular pagination (no search/filter), approximate based on current page and page size
          setTotalMovies(currentPage * pageSize + (response.data.length === pageSize ? pageSize : 0));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage, pageSize, user, searchQuery, selectedType, selectedGenre, yearFrom, yearTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked ? 1 : 0
      });
    } else if (name === 'releaseYear') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || undefined
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Set a default poster URL if none provided
      const defaultPosterUrl = "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster+Available&font=montserrat";
      
      // Create the movie object with required fields and default values
      const movieData = {
        title: formData.title,
        type: formData.type || 'Movie',
        director: formData.director || '',
        cast: formData.cast || '',
        country: formData.country || '',
        releaseYear: formData.releaseYear,
        rating: formData.rating || '',
        duration: formData.duration || '',
        description: formData.description || '',
        posterUrl: formData.posterUrl || defaultPosterUrl,
        
        // Include all genre fields with proper defaults
        // Movie genres
        Action: formData.Action || 0,
        Adventure: formData.Adventure || 0,
        Comedies: formData.Comedies || 0,
        Dramas: formData.Dramas || 0,
        HorrorMovies: formData.HorrorMovies || 0,
        Thrillers: formData.Thrillers || 0,
        Documentaries: formData.Documentaries || 0,
        FamilyMovies: formData.FamilyMovies || 0,
        Fantasy: formData.Fantasy || 0,
        Musicals: formData.Musicals || 0,
        
        // TV genres
        TVAction: formData.TVAction || 0,
        TVComedies: formData.TVComedies || 0,
        TVDramas: formData.TVDramas || 0,
        Docuseries: formData.Docuseries || 0,
        KidsTV: formData.KidsTV || 0,
        RealityTV: formData.RealityTV || 0,
        Children: formData.Children || 0,
        
        // Other genres
        DocumentariesInternationalMovies: formData.DocumentariesInternationalMovies || 0,
        DramasInternationalMovies: formData.DramasInternationalMovies || 0,
        DramasRomanticMovies: formData.DramasRomanticMovies || 0,
        ComediesRomanticMovies: formData.ComediesRomanticMovies || 0,
        
        // Additional required genre fields from backend model
        AnimeSeriesInternationalTVShows: formData.AnimeSeriesInternationalTVShows || 0,
        BritishTVShowsDocuseriesInternationalTVShows: formData.BritishTVShowsDocuseriesInternationalTVShows || 0,
        ComediesDramasInternationalMovies: formData.ComediesDramasInternationalMovies || 0,
        ComediesInternationalMovies: formData.ComediesInternationalMovies || 0,
        CrimeTVShowsDocuseries: formData.CrimeTVShowsDocuseries || 0,
        InternationalMoviesThrillers: formData.InternationalMoviesThrillers || 0,
        InternationalTVShowsRomanticTVShowsTVDramas: formData.InternationalTVShowsRomanticTVShowsTVDramas || 0,
        LanguageTVShows: formData.LanguageTVShows || 0,
        NatureTV: formData.NatureTV || 0,
        Spirituality: formData.Spirituality || 0,
        TalkShowsTVComedies: formData.TalkShowsTVComedies || 0
      };
      
      // Use the API to create the movie
      await movieApi.createMovie(movieData);
      
      // Reset form and close modal
      setFormData({
        showId: '',
        title: '',
        type: 'Movie',
        releaseYear: new Date().getFullYear(),
      });
      setIsAdding(false);
      
      // Refresh the movie list
      const response = await movieApi.getAll(currentPage, pageSize);
      setMovies(response.data);
      
    } catch (err) {
      console.error('Error adding movie:', err);
      setError('Failed to add movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMovie) return;
    
    try {
      setLoading(true);
      
      // Set a default poster URL if none provided
      const defaultPosterUrl = "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster+Available&font=montserrat";
      
      // Create the movie object from form data, including genre fields
      const movieData: Movie = {
        showId: editingMovie.showId,
        title: editingMovie.title,
        type: editingMovie.type,
        director: editingMovie.director,
        cast: editingMovie.cast,
        country: editingMovie.country,
        releaseYear: editingMovie.releaseYear,
        rating: editingMovie.rating,
        duration: editingMovie.duration,
        description: editingMovie.description,
        posterUrl: editingMovie.posterUrl || defaultPosterUrl,
        
        // Include all genre fields with proper defaults
        // Movie genres
        Action: editingMovie.Action || 0,
        Adventure: editingMovie.Adventure || 0,
        Comedies: editingMovie.Comedies || 0,
        Dramas: editingMovie.Dramas || 0,
        HorrorMovies: editingMovie.HorrorMovies || 0,
        Thrillers: editingMovie.Thrillers || 0,
        Documentaries: editingMovie.Documentaries || 0,
        FamilyMovies: editingMovie.FamilyMovies || 0,
        Fantasy: editingMovie.Fantasy || 0,
        Musicals: editingMovie.Musicals || 0,
        
        // TV genres
        TVAction: editingMovie.TVAction || 0,
        TVComedies: editingMovie.TVComedies || 0,
        TVDramas: editingMovie.TVDramas || 0,
        Docuseries: editingMovie.Docuseries || 0,
        KidsTV: editingMovie.KidsTV || 0,
        RealityTV: editingMovie.RealityTV || 0,
        Children: editingMovie.Children || 0,
        
        // Other genres
        DocumentariesInternationalMovies: editingMovie.DocumentariesInternationalMovies || 0,
        DramasInternationalMovies: editingMovie.DramasInternationalMovies || 0,
        DramasRomanticMovies: editingMovie.DramasRomanticMovies || 0,
        ComediesRomanticMovies: editingMovie.ComediesRomanticMovies || 0,
        
        // Additional required genre fields
        AnimeSeriesInternationalTVShows: editingMovie.AnimeSeriesInternationalTVShows || 0,
        BritishTVShowsDocuseriesInternationalTVShows: editingMovie.BritishTVShowsDocuseriesInternationalTVShows || 0,
        ComediesDramasInternationalMovies: editingMovie.ComediesDramasInternationalMovies || 0,
        ComediesInternationalMovies: editingMovie.ComediesInternationalMovies || 0,
        CrimeTVShowsDocuseries: editingMovie.CrimeTVShowsDocuseries || 0,
        InternationalMoviesThrillers: editingMovie.InternationalMoviesThrillers || 0,
        InternationalTVShowsRomanticTVShowsTVDramas: editingMovie.InternationalTVShowsRomanticTVShowsTVDramas || 0,
        LanguageTVShows: editingMovie.LanguageTVShows || 0,
        NatureTV: editingMovie.NatureTV || 0,
        Spirituality: editingMovie.Spirituality || 0,
        TalkShowsTVComedies: editingMovie.TalkShowsTVComedies || 0
      };
      
      // Use the API to update the movie
      await movieApi.updateMovie(movieData);
      
      // Reset form and close modal
      setEditingMovie(null);
      
      // Refresh the movie list
      const response = await movieApi.getAll(currentPage, pageSize);
      setMovies(response.data);
      
    } catch (err) {
      console.error('Error updating movie:', err);
      setError('Failed to update movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm(`Are you sure you want to delete movie ID: ${movieId}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the API to delete the movie
      await movieApi.deleteMovie(movieId);
      
      // Refresh the movie list
      const response = await movieApi.getAll(currentPage, pageSize);
      setMovies(response.data);
      
    } catch (err) {
      console.error('Error deleting movie:', err);
      setError('Failed to delete movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Map of genre property names to display names
  const genreMapping: {[key: string]: string} = {
    Action: "Action",
    Adventure: "Adventure",
    Comedies: "Comedy",
    Dramas: "Drama",
    HorrorMovies: "Horror",
    Thrillers: "Thriller",
    Documentaries: "Documentary",
    FamilyMovies: "Family",
    Fantasy: "Fantasy",
    Musicals: "Musical",
    TVAction: "TV Action",
    TVComedies: "TV Comedy",
    TVDramas: "TV Drama",
    Docuseries: "Docuseries",
    KidsTV: "Kids TV",
    RealityTV: "Reality TV",
    Children: "Children",
    DocumentariesInternationalMovies: "Documentary International",
    DramasInternationalMovies: "Drama International",
    DramasRomanticMovies: "Drama Romantic",
    ComediesRomanticMovies: "Comedy Romantic",
    AnimeSeriesInternationalTVShows: "Anime Series",
    BritishTVShowsDocuseriesInternationalTVShows: "British TV Shows",
    InternationalTVShowsRomanticTVShowsTVDramas: "International TV Drama",
    TalkShowsTVComedies: "Talk Shows",
    CrimeTVShowsDocuseries: "Crime TV",
    LanguageTVShows: "Language Shows",
    NatureTV: "Nature TV",
    Spirituality: "Spirituality",
    ComediesDramasInternationalMovies: "Comedy Drama International",
    ComediesInternationalMovies: "Comedy International",
    InternationalMoviesThrillers: "International Thriller"
  };
  
  // ULTRA-SIMPLIFIED genre detection with fallbacks for TV shows
  const getAllGenres = (data: MovieFormData): string[] => {
    console.log("ULTRA-SIMPLIFIED GENRE DETECTION");
    console.log("Content type:", data.type);
    
    const genres: string[] = [];
    
    // First, attempt to find genres with value 1
    for (const key in genreMapping) {
      if ((data as any)[key] === 1) {
        console.log(`Found active genre ${key} with value 1`);
        genres.push(genreMapping[key]);
      }
    }
    
    // If no genres found and it's a TV Show, use special fallback logic
    if (genres.length === 0 && data.type === 'TV Show') {
      console.log("NO GENRES FOUND FOR TV SHOW - USING FALLBACK LOGIC");
      
      // Assign a default TV genre based on the type
      if (data.title) {
        const title = data.title.toLowerCase();
        if (title.includes("comedy") || title.includes("funny")) {
          genres.push("TV Comedy");
          console.log("Title suggests Comedy. Using TV Comedy as fallback.");
        } else if (title.includes("drama") || title.includes("story")) {
          genres.push("TV Drama");
          console.log("Title suggests Drama. Using TV Drama as fallback.");
        } else if (title.includes("documentary") || title.includes("true")) {
          genres.push("Docuseries");
          console.log("Title suggests Documentary. Using Docuseries as fallback.");
        } else if (title.includes("kids") || title.includes("children")) {
          genres.push("Kids TV");
          console.log("Title suggests Kids content. Using Kids TV as fallback.");
        } else {
          // If all else fails, just set a generic TV genre
          genres.push("TV Drama");
          console.log("No genre hints in title. Using generic TV Drama as fallback.");
        }
      } else {
        genres.push("TV Drama");
        console.log("No title available. Using generic TV Drama as fallback.");
      }
    }
    
    // Similarly, if no genres found for a Movie, use fallback logic
    if (genres.length === 0 && (!data.type || data.type === 'Movie')) {
      console.log("NO GENRES FOUND FOR MOVIE - USING FALLBACK LOGIC");
      
      // Default to Drama if we can't detect anything else
      genres.push("Drama");
      console.log("Using Drama as fallback for movie.");
    }
    
    console.log("Final genres:", genres);
    return genres;
  };
  
  // Function to get the selected genre from form data (for backward compatibility)
  const getSelectedGenre = (data: MovieFormData): string => {
    const genres = getAllGenres(data);
    return genres.length > 0 ? genres[0] : "Not specified";
  };
  
  // Function to get a movie genre from form data
  const getSelectedMovieGenre = (data: MovieFormData): string => {
    const movieGenres = [
      'Action', 'Adventure', 'Comedies', 'Dramas', 'HorrorMovies', 'Thrillers',
      'Documentaries', 'FamilyMovies', 'Fantasy', 'Musicals',
      'DramasRomanticMovies', 'ComediesRomanticMovies', 'DocumentariesInternationalMovies',
      'DramasInternationalMovies', 'ComediesInternationalMovies', 'InternationalMoviesThrillers',
      'ComediesDramasInternationalMovies'
    ];
    
    // Find the first active movie genre
    for (const genre of movieGenres) {
      if ((data as any)[genre] === 1) {
        return genre;
      }
    }
    
    return "";
  };
  
  // Function to get a TV genre from form data
  const getSelectedTVGenre = (data: MovieFormData): string => {
    const tvGenres = [
      'TVAction', 'TVComedies', 'TVDramas', 'Docuseries', 'KidsTV', 'RealityTV',
      'TalkShowsTVComedies', 'AnimeSeriesInternationalTVShows',
      'BritishTVShowsDocuseriesInternationalTVShows', 'InternationalTVShowsRomanticTVShowsTVDramas',
      'CrimeTVShowsDocuseries', 'LanguageTVShows', 'NatureTV', 'Children'
    ];
    
    // Find the first active TV genre
    for (const genre of tvGenres) {
      if ((data as any)[genre] === 1) {
        return genre;
      }
    }
    
    return "";
  };
  
  // Function to handle genre dropdown change for adding movies
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGenre = e.target.value;
    
    // Reset all genre fields
    const updatedFormData: MovieFormData = {
      ...formData,
      Action: 0,
      Adventure: 0,
      Comedies: 0,
      Dramas: 0,
      HorrorMovies: 0,
      Thrillers: 0,
      Documentaries: 0,
      FamilyMovies: 0,
      Fantasy: 0,
      Musicals: 0
    };
    
    // Set the selected genre to 1
    if (selectedGenre) {
      // Define the genres we support for the dropdown
      const validGenres = ['Action', 'Adventure', 'Comedies', 'Dramas', 'HorrorMovies', 
                          'Thrillers', 'Documentaries', 'FamilyMovies', 'Fantasy', 'Musicals'];
      
      // Only set if it's a valid genre field
      if (validGenres.includes(selectedGenre)) {
        // Explicitly use type assertion
        (updatedFormData as any)[selectedGenre] = 1;
      }
    }
    
    setFormData(updatedFormData);
  };
  
  // Function to handle genre change in edit mode
  const handleEditGenreChange = (genreKey: string, contentType: 'movie' | 'tv') => {
    if (!editingMovie) return;
    
    // Create a copy of the current editing movie
    const updatedMovie = { ...editingMovie };
    
    // Reset all genre fields of the specified type
    if (contentType === 'movie') {
      // Reset movie genres
      updatedMovie.Action = 0;
      updatedMovie.Adventure = 0;
      updatedMovie.Comedies = 0;
      updatedMovie.Dramas = 0;
      updatedMovie.HorrorMovies = 0;
      updatedMovie.Thrillers = 0;
      updatedMovie.Documentaries = 0;
      updatedMovie.FamilyMovies = 0;
      updatedMovie.Fantasy = 0;
      updatedMovie.Musicals = 0;
      updatedMovie.DramasRomanticMovies = 0;
      updatedMovie.ComediesRomanticMovies = 0;
      updatedMovie.DocumentariesInternationalMovies = 0;
      updatedMovie.DramasInternationalMovies = 0;
      updatedMovie.ComediesInternationalMovies = 0;
      updatedMovie.InternationalMoviesThrillers = 0;
      updatedMovie.ComediesDramasInternationalMovies = 0;
    } else {
      // Reset TV genres
      updatedMovie.TVAction = 0;
      updatedMovie.TVComedies = 0;
      updatedMovie.TVDramas = 0;
      updatedMovie.Docuseries = 0;
      updatedMovie.KidsTV = 0;
      updatedMovie.RealityTV = 0;
      updatedMovie.TalkShowsTVComedies = 0;
      updatedMovie.AnimeSeriesInternationalTVShows = 0;
      updatedMovie.BritishTVShowsDocuseriesInternationalTVShows = 0;
      updatedMovie.InternationalTVShowsRomanticTVShowsTVDramas = 0;
      updatedMovie.CrimeTVShowsDocuseries = 0;
      updatedMovie.LanguageTVShows = 0;
      updatedMovie.NatureTV = 0;
      updatedMovie.Children = 0;
    }
    
    // Set the selected genre if one was chosen
    if (genreKey) {
      (updatedMovie as any)[genreKey] = 1;
    }
    
    // Update the editing movie state
    setEditingMovie(updatedMovie);
    
    console.log(`Updated genre to ${genreKey} for ${contentType}:`, updatedMovie);
  };
  
  // Function to add a new genre
  const handleAddGenre = (genreKey: string, contentType: 'movie' | 'tv') => {
    if (!editingMovie || !genreKey) return;
    
    // Create a copy of the current editing movie
    const updatedMovie = { ...editingMovie };
    
    // Set the selected genre to 1
    (updatedMovie as any)[genreKey] = 1;
    
    // Update the editing movie state
    setEditingMovie(updatedMovie);
    
    console.log(`Added genre ${genreKey} for ${contentType}:`, updatedMovie);
  };
  
  // Function to remove a genre
  const handleRemoveGenre = (genreKey: string) => {
    if (!editingMovie || !genreKey) return;
    
    // Create a copy of the current editing movie
    const updatedMovie = { ...editingMovie };
    
    // Set the specified genre to 0
    (updatedMovie as any)[genreKey] = 0;
    
    // Update the editing movie state
    setEditingMovie(updatedMovie);
    
    console.log(`Removed genre ${genreKey}:`, updatedMovie);
  };

  const startEdit = (movie: Movie) => {
    console.log("RAW MOVIE DATA RECEIVED:", movie);
    
    // Create a copy of the movie with all its properties
    const movieData: MovieFormData = {
      showId: movie.showId,
      title: movie.title,
      type: movie.type,
      director: movie.director,
      cast: movie.cast,
      country: movie.country,
      releaseYear: movie.releaseYear,
      rating: movie.rating,
      duration: movie.duration,
      description: movie.description,
      posterUrl: movie.posterUrl,
    };
    
    // Debug all properties on the movie object
    console.log("ALL PROPERTIES ON MOVIE OBJECT:");
    Object.keys(movie).forEach(key => {
      console.log(`${key}: ${(movie as any)[key]} (${typeof (movie as any)[key]})`);
    });
    
    // Log the API structure
    console.log("MOVIE API STRUCTURE:", Object.getOwnPropertyNames(movie));
    
    // Copy all genre fields dynamically and handle null/undefined values
    const genreFields = [
      'Action', 'Adventure', 'Comedies', 'Dramas', 'HorrorMovies', 'Thrillers',
      'Documentaries', 'FamilyMovies', 'Fantasy', 'Musicals', 'TVAction',
      'TVComedies', 'TVDramas', 'Docuseries', 'KidsTV', 'RealityTV', 'Children',
      'DocumentariesInternationalMovies', 'DramasInternationalMovies', 'DramasRomanticMovies',
      'ComediesRomanticMovies', 'AnimeSeriesInternationalTVShows',
      'BritishTVShowsDocuseriesInternationalTVShows', 'InternationalTVShowsRomanticTVShowsTVDramas',
      'TalkShowsTVComedies', 'CrimeTVShowsDocuseries', 'LanguageTVShows', 'NatureTV',
      'Spirituality', 'ComediesDramasInternationalMovies', 'ComediesInternationalMovies',
      'InternationalMoviesThrillers'
    ];
    
    console.log("FORCED GENRE FIELD INSPECTION:");
    // Inspect every genre field, even if it doesn't seem to be in the movie object
    genreFields.forEach(field => {
      // Access the value from movie with various case forms
      const value = (movie as any)[field] !== undefined ? (movie as any)[field] :
                  (movie as any)[field.toLowerCase()] !== undefined ? (movie as any)[field.toLowerCase()] :
                  (movie as any)[field.toUpperCase()] !== undefined ? (movie as any)[field.toUpperCase()] : null;
                  
      console.log(`${field}: direct=${(movie as any)[field]}, lowercase=${(movie as any)[field.toLowerCase()]}, uppercase=${(movie as any)[field.toUpperCase()]}, chosen=${value}`);
      
      // Always copy the field to movieData, using 0 if null/undefined
      (movieData as any)[field] = value !== null && value !== undefined ? value : 0;
      
      if (value === 1) {
        console.log(`*** FOUND ACTIVE GENRE: ${field} = ${value} ***`);
      }
    });
    
    // Try accessing the API Movie type properties directly
    console.log("TRYING DIRECT TYPE ACCESS:");
    if (movie.Action !== undefined) console.log(`Direct Action = ${movie.Action}`);
    if (movie.Comedies !== undefined) console.log(`Direct Comedies = ${movie.Comedies}`);
    if (movie.Dramas !== undefined) console.log(`Direct Dramas = ${movie.Dramas}`);
    
    // Insert test data if nothing seems to be working
    if (!getAllGenres(movieData).length) {
      console.log("NO GENRES DETECTED. CHECKING IF WE NEED TO FORCE TEST VALUES.");
      
      // Check if movie title contains keywords that might suggest a genre
      const title = movie.title.toLowerCase();
      if (title.includes("action") || title.includes("fast") || title.includes("furious")) {
        console.log("Title suggests Action genre. Setting Action = 1 for testing");
        movieData.Action = 1;
      } else if (title.includes("comedy") || title.includes("funny") || title.includes("laugh")) {
        console.log("Title suggests Comedy genre. Setting Comedies = 1 for testing");
        movieData.Comedies = 1;
      } else if (title.includes("horror") || title.includes("scary") || title.includes("fear")) {
        console.log("Title suggests Horror genre. Setting HorrorMovies = 1 for testing");
        movieData.HorrorMovies = 1;
      }
    }
    
    // Log the final movieData object and detected genres
    console.log("FINAL MOVIE DATA FOR EDITING:", movieData);
    console.log("GENRES DETECTED:", getAllGenres(movieData));
    
    setEditingMovie(movieData);
  };

  // Generate pagination controls
  const totalPages = Math.ceil(totalMovies / pageSize);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h1 style={{ color: 'var(--color-primary)' }}>
            Admin Dashboard
          </h1>
          
          {/* Add Movie Button */}
          <button
            onClick={() => setIsAdding(true)}
            style={{
              backgroundColor: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> Add New Movie
          </button>
        </div>
        
        {error && (
          <div className="card mb-4" style={{ 
            backgroundColor: '#fff5f5',
            borderLeft: '4px solid var(--color-error)'
          }}>
            <p className="text-error">{error}</p>
          </div>
        )}

        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h2 style={{ margin: 0 }}>Movie Management</h2>
            
            {/* Page Size Selector */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <label htmlFor="pageSize">Movies per page:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  width: 'auto'
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          {/* Search Bar */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
              <input
                type="text"
                placeholder="Search titles, directors, or actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: 'var(--spacing-sm)' }}
              />
              <button
                onClick={() => {
                  // Reset page when searching
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}
              >
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>
            
            {/* Additional Filters */}
            {showFilters && (
              <div style={{ 
                backgroundColor: 'var(--color-background)', 
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                  <div style={{ minWidth: '200px', flex: 1 }}>
                    <label htmlFor="typeFilter" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Type</label>
                    <select
                      id="typeFilter"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{ width: '100%', padding: 'var(--spacing-sm)' }}
                    >
                      <option value="">All Types</option>
                      <option value="Movie">Movies</option>
                      <option value="TV Show">TV Shows</option>
                      <option value="Documentary">Documentaries</option>
                    </select>
                  </div>
                  
                  <div style={{ minWidth: '200px', flex: 1 }}>
                    <label htmlFor="genreFilter" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Genre</label>
                    <select
                      id="genreFilter"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      style={{ width: '100%', padding: 'var(--spacing-sm)' }}
                    >
                      <option value="">All Genres</option>
                      <option value="Action">Action</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Comedies">Comedy</option>
                      <option value="Dramas">Drama</option>
                      <option value="HorrorMovies">Horror</option>
                      <option value="Thrillers">Thriller</option>
                      <option value="Documentaries">Documentary</option>
                      <option value="FamilyMovies">Family</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Musicals">Musical</option>
                    </select>
                  </div>
                  
                  <div style={{ minWidth: '200px', flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Release Year</label>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <input
                        type="number"
                        placeholder="From"
                        value={yearFrom || ''}
                        onChange={(e) => setYearFrom(e.target.value ? parseInt(e.target.value) : undefined)}
                        style={{ flex: 1, padding: 'var(--spacing-sm)' }}
                        min="1900"
                        max="2099"
                      />
                      <input
                        type="number"
                        placeholder="To"
                        value={yearTo || ''}
                        onChange={(e) => setYearTo(e.target.value ? parseInt(e.target.value) : undefined)}
                        style={{ flex: 1, padding: 'var(--spacing-sm)' }}
                        min="1900"
                        max="2099"
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('');
                      setSelectedGenre('');
                      setYearFrom(undefined);
                      setYearTo(undefined);
                      setCurrentPage(1);
                    }}
                    style={{
                      backgroundColor: 'var(--color-error)',
                      color: 'white',
                      border: 'none',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
      
          {/* Movies Table */}
          {loading ? (
            <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
              <p>Loading movies...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {movies.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Title</th>
                      <th style={tableHeaderStyle}>Type</th>
                      <th style={tableHeaderStyle}>Year</th>
                      <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map(movie => (
                      <tr key={movie.showId} style={{
                        transition: 'background-color var(--transition-normal)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                        <td style={tableCellStyle}>{movie.title}</td>
                        <td style={tableCellStyle}>{movie.type || 'Unknown'}</td>
                        <td style={tableCellStyle}>{movie.releaseYear || 'Unknown'}</td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                            <button
                              onClick={() => startEdit(movie)}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(movie.showId)}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                backgroundColor: 'var(--color-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
                  <p>No movies found. Add some movies to get started!</p>
                </div>
              )}
            </div>
          )}
      
          {/* Pagination Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            margin: 'var(--spacing-lg) 0 var(--spacing-sm) 0',
            flexWrap: 'wrap',
            gap: 'var(--spacing-xs)'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                backgroundColor: currentPage === 1 ? 'var(--color-background)' : 'var(--color-primary)',
                color: currentPage === 1 ? 'var(--color-text-light)' : 'white',
                border: `1px solid ${currentPage === 1 ? 'var(--color-border)' : 'var(--color-primary)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.7 : 1
              }}
            >
              &larr; Previous
            </button>
            
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  backgroundColor: currentPage === number ? 'var(--color-primary)' : 'var(--color-background)',
                  color: currentPage === number ? 'white' : 'var(--color-text)',
                  border: `1px solid ${currentPage === number ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                backgroundColor: currentPage === totalPages || totalPages === 0 ? 'var(--color-background)' : 'var(--color-primary)',
                color: currentPage === totalPages || totalPages === 0 ? 'var(--color-text-light)' : 'white',
                border: `1px solid ${currentPage === totalPages || totalPages === 0 ? 'var(--color-border)' : 'var(--color-primary)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages || totalPages === 0 ? 0.7 : 1
              }}
            >
              Next &rarr;
            </button>
          </div>
          
          <div className="text-center" style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
            Showing page {currentPage} of {totalPages || 1}
          </div>
        </div>
      </div>
      
      {/* Add Movie Modal */}
      {isAdding && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Add New Movie</h2>
            <form onSubmit={handleAddMovie}>
              {/* Movie ID is now auto-generated */}
              
              <div style={formGroupStyle}>
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="Movie">Movie</option>
                  <option value="TV Show">TV Show</option>
                  <option value="Documentary">Documentary</option>
                </select>
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="releaseYear">Release Year</label>
                <input
                  type="number"
                  id="releaseYear"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleInputChange}
                  style={inputStyle}
                  min="1900"
                  max="2099"
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="director">Director</label>
                <input
                  type="text"
                  id="director"
                  name="director"
                  value={formData.director || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="cast">Cast</label>
                <input
                  type="text"
                  id="cast"
                  name="cast"
                  value={formData.cast || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  style={textareaStyle}
                  rows={4}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="posterUrl">Poster URL</label>
                <input
                  type="text"
                  id="posterUrl"
                  name="posterUrl"
                  value={formData.posterUrl || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="genre">Primary Genre</label>
                <select
                  id="genre"
                  name="genre"
                  value={getSelectedGenre(formData)}
                  onChange={handleGenreChange}
                  style={inputStyle}
                >
                  <option value="">Select a genre</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Comedies">Comedy</option>
                  <option value="Dramas">Drama</option>
                  <option value="HorrorMovies">Horror</option>
                  <option value="Thrillers">Thriller</option>
                  <option value="Documentaries">Documentary</option>
                  <option value="FamilyMovies">Family</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Musicals">Musical</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Movie Modal */}
      {editingMovie && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Edit Movie</h2>
            <form onSubmit={handleEditMovie}>
              <div style={formGroupStyle}>
                <label htmlFor="edit-title">Title *</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editingMovie.title}
                  onChange={(e) => setEditingMovie({...editingMovie, title: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="edit-type">Type</label>
                <select
                  id="edit-type"
                  name="type"
                  value={editingMovie.type}
                  onChange={(e) => setEditingMovie({...editingMovie, type: e.target.value})}
                  style={inputStyle}
                >
                  <option value="Movie">Movie</option>
                  <option value="TV Show">TV Show</option>
                  <option value="Documentary">Documentary</option>
                </select>
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="edit-releaseYear">Release Year</label>
                <input
                  type="number"
                  id="edit-releaseYear"
                  name="releaseYear"
                  value={editingMovie.releaseYear}
                  onChange={(e) => setEditingMovie({...editingMovie, releaseYear: parseInt(e.target.value) || undefined})}
                  style={inputStyle}
                  min="1900"
                  max="2099"
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="edit-director">Director</label>
                <input
                  type="text"
                  id="edit-director"
                  name="director"
                  value={editingMovie.director || ''}
                  onChange={(e) => setEditingMovie({...editingMovie, director: e.target.value})}
                  style={inputStyle}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingMovie.description || ''}
                  onChange={(e) => setEditingMovie({...editingMovie, description: e.target.value})}
                  style={textareaStyle}
                  rows={4}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="edit-posterUrl">Poster URL</label>
                <input
                  type="text"
                  id="edit-posterUrl"
                  name="posterUrl"
                  value={editingMovie.posterUrl || ''}
                  onChange={(e) => setEditingMovie({...editingMovie, posterUrl: e.target.value})}
                  style={inputStyle}
                />
              </div>
              
              {/* Genre Selection Section */}
              <div style={formGroupStyle}>
                <h3 style={{marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                  Genre Management
                </h3>
                
                {/* Current genres with separate fields */}
                <div style={{marginBottom: '20px'}}>
                  <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Current Genres:</p>
                  
                  {/* Show all active genres for the movie */}
                  {getAllGenres(editingMovie).length > 0 ? (
                    <div>
                      {getAllGenres(editingMovie).map((genre, index) => {
                        // Find the key in genreMapping that matches this genre
                        const genreKey = Object.entries(genreMapping).find(([key, val]) => val === genre)?.[0] || '';
                        
                        return (
                          <div key={index} style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '8px',
                            backgroundColor: '#f9f9f9',
                            padding: '8px',
                            borderRadius: '4px'
                          }}>
                            <div style={{flex: 1}}>
                              <label htmlFor={`edit-genre-${index + 1}`} style={{display: 'block', marginBottom: '3px', fontSize: '0.9rem'}}>
                                Genre {index + 1}
                              </label>
                              <input
                                type="text"
                                id={`edit-genre-${index + 1}`}
                                value={genre}
                                readOnly
                                style={{...inputStyle, backgroundColor: '#f2f2f2'}}
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveGenre(genreKey)}
                              style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                marginLeft: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{fontStyle: 'italic', color: '#888', marginBottom: '15px'}}>No genres assigned</p>
                  )}
                </div>
                
                {/* Add new genre section */}
                <div style={{marginBottom: '10px'}}>
                  <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Add New Genre:</p>
                  
                  {/* Movie genres - only show if type is Movie or not specified */}
                  {(!editingMovie.type || editingMovie.type === 'Movie') && (
                    <div style={formGroupStyle}>
                      <label htmlFor="edit-movie-genre">Add Movie Genre</label>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <select
                          id="edit-movie-genre"
                          value=""
                          onChange={(e) => handleAddGenre(e.target.value, 'movie')}
                          style={{...inputStyle, flex: 1}}
                        >
                          <option value="">Select a genre to add</option>
                          {/* Movie genres */}
                          <option value="Action">Action</option>
                          <option value="Adventure">Adventure</option>
                          <option value="Comedies">Comedy</option>
                          <option value="Dramas">Drama</option>
                          <option value="HorrorMovies">Horror</option>
                          <option value="Thrillers">Thriller</option>
                          <option value="Documentaries">Documentary</option>
                          <option value="FamilyMovies">Family</option>
                          <option value="Fantasy">Fantasy</option>
                          <option value="Musicals">Musical</option>
                          
                          {/* Combination genres */}
                          <option value="DramasRomanticMovies">Romantic Drama</option>
                          <option value="ComediesRomanticMovies">Romantic Comedy</option>
                          <option value="DocumentariesInternationalMovies">International Documentary</option>
                          <option value="DramasInternationalMovies">International Drama</option>
                          <option value="ComediesInternationalMovies">International Comedy</option>
                          <option value="InternationalMoviesThrillers">International Thriller</option>
                          <option value="ComediesDramasInternationalMovies">International Comedy-Drama</option>
                          
                          {/* Add Spirituality as it can be for both movies and TV shows */}
                          <option value="Spirituality">Spirituality</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* TV Show genres - only show if type is TV Show */}
                  {editingMovie.type === 'TV Show' && (
                    <div style={formGroupStyle}>
                      <label htmlFor="edit-tv-genre">Add TV Show Genre</label>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <select
                          id="edit-tv-genre"
                          value=""
                          onChange={(e) => handleAddGenre(e.target.value, 'tv')}
                          style={{...inputStyle, flex: 1}}
                        >
                          <option value="">Select a genre to add</option>
                          {/* TV Show genres */}
                          <option value="TVAction">Action</option>
                          <option value="TVComedies">Comedy</option>
                          <option value="TVDramas">Drama</option>
                          <option value="Docuseries">Docuseries</option>
                          <option value="KidsTV">Kids</option>
                          <option value="RealityTV">Reality</option>
                          <option value="TalkShowsTVComedies">Talk Shows</option>
                          <option value="AnimeSeriesInternationalTVShows">Anime</option>
                          <option value="BritishTVShowsDocuseriesInternationalTVShows">British</option>
                          <option value="InternationalTVShowsRomanticTVShowsTVDramas">International Drama</option>
                          <option value="CrimeTVShowsDocuseries">Crime</option>
                          <option value="LanguageTVShows">Language</option>
                          <option value="NatureTV">Nature</option>
                          <option value="Children">Children</option>
                          
                          {/* Add Spirituality as it can be for both movies and TV shows */}
                          <option value="Spirituality">Spirituality</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const tableHeaderStyle: React.CSSProperties = {
  backgroundColor: '#f2f2f2',
  padding: '12px 15px',
  textAlign: 'left',
  borderBottom: '1px solid #ddd'
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 15px',
  borderBottom: '1px solid #ddd'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '15px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '16px',
  boxSizing: 'border-box'
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '16px',
  boxSizing: 'border-box',
  resize: 'vertical'
};

const checkboxGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '10px',
  marginBottom: '20px'
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

export default AdminMoviesPage;
