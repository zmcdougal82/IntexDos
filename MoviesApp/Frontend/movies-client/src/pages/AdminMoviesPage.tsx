import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Movie, movieApi } from "../services/api";
import { tmdbApi } from "../services/tmdbApi";

// Interface for TMDB search results
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
}

interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
}

type TMDBResult = TMDBMovie | TMDBTVShow;

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
  // Index signature for dynamic property access
  [key: string]: string | number | undefined;
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
  // const [totalContent, setTotalContent] = useState(0);

  // Search results and modal state
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searchResultsPage, setSearchResultsPage] = useState(1);
  const [searchResultsTotalPages, setSearchResultsTotalPages] = useState(1);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [currentSearchType, setCurrentSearchType] = useState<
    "movie" | "tv" | "multi"
  >("multi");
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // To track whether search is for add or edit mode

  // Poster selection modal state
  const [posterSearchResults, setPosterSearchResults] = useState<TMDBResult[]>(
    []
  );
  const [posterSearchPage, setPosterSearchPage] = useState(1);
  const [posterSearchTotalPages, setPosterSearchTotalPages] = useState(1);
  const [currentPosterType, setCurrentPosterType] = useState<"movie" | "tv">(
    "movie"
  );
  const [_currentPosterQuery, setCurrentPosterQuery] = useState(""); // Prefixed with underscore to suppress unused variable warning
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterForEditMode, setPosterForEditMode] = useState(false); // To track if poster search is for add or edit mode

  // Custom alert/confirm modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<() => void>(() => {});

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<string>("title");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<MovieFormData>({
    showId: "",
    title: "",
    type: "Movie",
    releaseYear: new Date().getFullYear(),
  });

  // Validate admin permissions
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Redirect if not admin
        if (userData.role !== "Admin") {
          navigate("/");
          alert("You need admin permissions to access this page");
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // // Fetch total movie count
  // useEffect(() => {
  //   const fetchTotalCount = async () => {
  //     try {
  //       const response = await movieApi.getTotalMoviesCount();
  //       console.log(response); // Check the structure of the response
  //       setTotalContent(response.data.totalMovies); // Update the state with the total movie count
  //     } catch (error) {
  //       console.error("Error fetching total movie count:", error);
  //     }
  //   };

  //   fetchTotalCount();
  // }, []); // Empty dependency array to run only once when the component mounts

  // Fetch movies with search and filters
  // Store the current search query in a separate state
  const [searchQueryInput, setSearchQueryInput] = useState("");
  
  useEffect(() => {
    // Initial load of searchQueryInput from searchQuery
    setSearchQueryInput(searchQuery);
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!user) return;

      try {
        setLoading(true);

        let response;

          // If search query exists, use search endpoint with pagination
          if (searchQuery) {
            // Pass pageSize as the limit to ensure we only get the correct number of items
            response = await movieApi.searchMovies(
              searchQuery,
              searchField,
              currentPage,
              pageSize
            );

            // CRITICAL: Force limit the displayed items to pageSize regardless of API response
            const limitedResults = response.data.slice(0, pageSize);
            setMovies(limitedResults);

            // Store the total count from response for pagination
            setTotalMovies(response.data.length);
          }
        // Separate handling for filters without search query
        else if (
          selectedType ||
          selectedGenre ||
          yearFrom !== undefined ||
          yearTo !== undefined
        ) {
          // For filters without search, we need to get all movies first
          response = await movieApi.getAll(currentPage, pageSize);

          // Start with the response data
          let filteredMovies = [...response.data];

          // Apply type filter if selected
          if (selectedType) {
            filteredMovies = filteredMovies.filter(
              (movie) => movie.type === selectedType
            );
          }

          // Apply genre filter if selected
          if (selectedGenre) {
            filteredMovies = filteredMovies.filter((movie) => {
              // Need to cast to 'any' to access dynamic property
              return (movie as any)[selectedGenre] === 1;
            });
          }

          // Apply year range filters if specified
          if (yearFrom !== undefined) {
            filteredMovies = filteredMovies.filter(
              (movie) =>
                movie.releaseYear !== undefined && movie.releaseYear >= yearFrom
            );
          }

          if (yearTo !== undefined) {
            filteredMovies = filteredMovies.filter(
              (movie) =>
                movie.releaseYear !== undefined && movie.releaseYear <= yearTo
            );
          }

          // Update the movies state
          setMovies(filteredMovies);

          // For filtered results, we estimate based on current page data
          setTotalMovies(
            filteredMovies.length > 0
              ? currentPage * pageSize +
                  (filteredMovies.length === pageSize ? pageSize : 0)
              : filteredMovies.length
          );
        }
        // No search or filters, just get paged data
        else {
          response = await movieApi.getAll(currentPage, pageSize);
          setMovies(response.data);

          // For regular pagination (no search/filter), approximate based on current page and page size
          setTotalMovies(
            currentPage * pageSize +
              (response.data.length === pageSize ? pageSize : 0)
          );
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [
    currentPage,
    pageSize,
    user,
    searchQuery, // Keep this here so changing searchQuery via the Search button still works
    selectedType,
    selectedGenre,
    yearFrom,
    yearTo,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked ? 1 : 0,
      });
    } else if (name === "releaseYear") {
      setFormData({
        ...formData,
        [name]: parseInt(value) || undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Set a default poster URL if none provided
      const defaultPosterUrl =
        "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster+Available&font=montserrat";

      // Create the movie object with required fields and default values
      const movieData = {
        title: formData.title,
        type: formData.type || "Movie",
        director: formData.director || "",
        cast: formData.cast || "",
        country: formData.country || "",
        releaseYear: formData.releaseYear,
        rating: formData.rating || "",
        duration: formData.duration || "",
        description: formData.description || "",
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
        DocumentariesInternationalMovies:
          formData.DocumentariesInternationalMovies || 0,
        DramasInternationalMovies: formData.DramasInternationalMovies || 0,
        DramasRomanticMovies: formData.DramasRomanticMovies || 0,
        ComediesRomanticMovies: formData.ComediesRomanticMovies || 0,

        // Additional required genre fields from backend model
        AnimeSeriesInternationalTVShows:
          formData.AnimeSeriesInternationalTVShows || 0,
        BritishTVShowsDocuseriesInternationalTVShows:
          formData.BritishTVShowsDocuseriesInternationalTVShows || 0,
        ComediesDramasInternationalMovies:
          formData.ComediesDramasInternationalMovies || 0,
        ComediesInternationalMovies: formData.ComediesInternationalMovies || 0,
        CrimeTVShowsDocuseries: formData.CrimeTVShowsDocuseries || 0,
        InternationalMoviesThrillers:
          formData.InternationalMoviesThrillers || 0,
        InternationalTVShowsRomanticTVShowsTVDramas:
          formData.InternationalTVShowsRomanticTVShowsTVDramas || 0,
        LanguageTVShows: formData.LanguageTVShows || 0,
        NatureTV: formData.NatureTV || 0,
        Spirituality: formData.Spirituality || 0,
        TalkShowsTVComedies: formData.TalkShowsTVComedies || 0,
      };

      // Use the API to create the movie
      await movieApi.createMovie(movieData);

      // Reset form and close modal
      setFormData({
        showId: "",
        title: "",
        type: "Movie",
        releaseYear: new Date().getFullYear(),
      });
      setIsAdding(false);

      // Refresh the movie list
      const response = await movieApi.getAll(currentPage, pageSize);
      setMovies(response.data);
    } catch (err) {
      console.error("Error adding movie:", err);
      setError("Failed to add movie. Please try again.");
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
      const defaultPosterUrl =
        "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster+Available&font=montserrat";

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
        DocumentariesInternationalMovies:
          editingMovie.DocumentariesInternationalMovies || 0,
        DramasInternationalMovies: editingMovie.DramasInternationalMovies || 0,
        DramasRomanticMovies: editingMovie.DramasRomanticMovies || 0,
        ComediesRomanticMovies: editingMovie.ComediesRomanticMovies || 0,

        // Additional required genre fields
        AnimeSeriesInternationalTVShows:
          editingMovie.AnimeSeriesInternationalTVShows || 0,
        BritishTVShowsDocuseriesInternationalTVShows:
          editingMovie.BritishTVShowsDocuseriesInternationalTVShows || 0,
        ComediesDramasInternationalMovies:
          editingMovie.ComediesDramasInternationalMovies || 0,
        ComediesInternationalMovies:
          editingMovie.ComediesInternationalMovies || 0,
        CrimeTVShowsDocuseries: editingMovie.CrimeTVShowsDocuseries || 0,
        InternationalMoviesThrillers:
          editingMovie.InternationalMoviesThrillers || 0,
        InternationalTVShowsRomanticTVShowsTVDramas:
          editingMovie.InternationalTVShowsRomanticTVShowsTVDramas || 0,
        LanguageTVShows: editingMovie.LanguageTVShows || 0,
        NatureTV: editingMovie.NatureTV || 0,
        Spirituality: editingMovie.Spirituality || 0,
        TalkShowsTVComedies: editingMovie.TalkShowsTVComedies || 0,
      };

      // Use the API to update the movie
      await movieApi.updateMovie(movieData);

      // Reset form and close modal
      setEditingMovie(null);

      // Refresh the movie list
      const response = await movieApi.getAll(currentPage, pageSize);
      setMovies(response.data);
    } catch (err) {
      console.error("Error updating movie:", err);
      setError("Failed to update movie. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string, movieTitle: string) => {
    // Check if the movie has a valid ID
    if (!movieId) {
      setError(
        `Cannot delete "${movieTitle}" because it has no ID. Please edit the movie to assign an ID first.`
      );

      // Show error modal instead of alert
      setAlertType("error");
      setAlertTitle("Missing Movie ID");
      setAlertMessage(
        `Cannot delete "${movieTitle}" because it has a missing ID. Please edit the movie to assign an ID first.`
      );
      setShowAlertModal(true);
      return;
    }

    // Use custom confirmation modal instead of built-in confirm
    setConfirmTitle("Confirm Deletion");
    setConfirmMessage(
      `Are you sure you want to delete "${movieTitle}"? This action cannot be undone.`
    );

    // Set up the callback function to execute if confirmed
    setConfirmCallback(() => async () => {
      try {
        setLoading(true);

        console.log(`Deleting movie: ${movieTitle} (ID: ${movieId})`);

        // Use the API to delete the movie
        await movieApi.deleteMovie(movieId);

        console.log(`Successfully deleted movie: ${movieTitle}`);

        // Show success modal instead of alert
        setAlertType("success");
        setAlertTitle("Deletion Successful");
        setAlertMessage(`Movie "${movieTitle}" has been successfully deleted.`);
        setShowAlertModal(true);

        // Refresh the movie list after a successful delete
        try {
          let response;
          if (searchQuery) {
            response = await movieApi.searchMovies(
              searchQuery,
              searchField, // Use the selected search field
              currentPage,
              pageSize
            );
          } else if (
            selectedType ||
            selectedGenre ||
            yearFrom !== undefined ||
            yearTo !== undefined
          ) {
            response = await movieApi.getAll(currentPage, pageSize);
            let filteredMovies = [...response.data];

            if (selectedType) {
              filteredMovies = filteredMovies.filter(
                (movie) => movie.type === selectedType
              );
            }

            if (selectedGenre) {
              filteredMovies = filteredMovies.filter((movie) => {
                return (movie as any)[selectedGenre] === 1;
              });
            }

            if (yearFrom !== undefined) {
              filteredMovies = filteredMovies.filter(
                (movie) =>
                  movie.releaseYear !== undefined &&
                  movie.releaseYear >= yearFrom
              );
            }

            if (yearTo !== undefined) {
              filteredMovies = filteredMovies.filter(
                (movie) =>
                  movie.releaseYear !== undefined && movie.releaseYear <= yearTo
              );
            }

            setMovies(filteredMovies);
            setTotalMovies(
              filteredMovies.length > 0
                ? currentPage * pageSize +
                    (filteredMovies.length === pageSize ? pageSize : 0)
                : filteredMovies.length
            );
            return;
          } else {
            response = await movieApi.getAll(currentPage, pageSize);
          }

          setMovies(response.data);

          // Update total count
          if (searchQuery) {
            setTotalMovies(response.data.length);
          } else {
            setTotalMovies(
              currentPage * pageSize +
                (response.data.length === pageSize ? pageSize : 0)
            );
          }
        } catch (refreshErr) {
          console.error("Error refreshing movies after delete:", refreshErr);
        }
      } catch (err) {
        console.error("Error deleting movie:", err);

        // Show error modal instead of alert
        setError(
          `Failed to delete movie "${movieTitle}". Server returned an error. Please try again.`
        );
        setAlertType("error");
        setAlertTitle("Deletion Failed");
        setAlertMessage(
          `Failed to delete movie "${movieTitle}". Please try again.`
        );
        setShowAlertModal(true);
      } finally {
        setLoading(false);
      }
    });

    // Show the confirmation modal
    setShowConfirmModal(true);
  };

  // Utility function to convert minutes to a readable format (e.g., 155 → "2h 35m")
  const formatDuration = (minutes: number): string => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Utility function to convert readable format to minutes (e.g., "2h 35m" → 155)
  const parseDuration = (formattedDuration: string): number | null => {
    if (!formattedDuration) return null;

    // Handle existing string formats in the database
    const hoursMatch = formattedDuration.match(/(\d+)h/);
    const minutesMatch = formattedDuration.match(/(\d+)m/);

    if (hoursMatch || minutesMatch) {
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
      return hours * 60 + minutes;
    }

    // If it's just a number string, parse it directly
    if (!isNaN(Number(formattedDuration))) {
      return parseInt(formattedDuration, 10);
    }

    return null;
  };

  // Map of genre property names to display names
  const genreMapping: { [key: string]: string } = {
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
    InternationalMoviesThrillers: "International Thriller",
  };

  // Improved genre detection with deduplication to prevent duplicate genres
  const getAllGenres = (movieData: MovieFormData): string[] => {
    console.log("IMPROVED GENRE DETECTION WITH DEDUPLICATION");
    console.log("Content type:", movieData.type);

    // Use a Set to automatically deduplicate genres
    const genreSet = new Set<string>();

    // Track which keys we've already processed to avoid duplicates from different methods
    const processedKeys = new Set<string>();

    // Method 1: Direct property matching
    for (const key in genreMapping) {
      if ((movieData as any)[key] === 1) {
        console.log(`Found active genre ${key} with value 1`);
        genreSet.add(genreMapping[key]);
        processedKeys.add(key.toLowerCase());
      }
    }

    // Method 2: Lowercase property matching (only for keys not already found)
    const lowercaseKeyMap: { [key: string]: string } = {};
    Object.keys(genreMapping).forEach((key) => {
      lowercaseKeyMap[key.toLowerCase()] = key;
    });

    Object.keys(movieData).forEach((dataKey) => {
      const dataKeyLower = dataKey.toLowerCase();

      // Only process if we haven't already found this genre AND it's a valid genre with value 1
      if (
        !processedKeys.has(dataKeyLower) &&
        lowercaseKeyMap[dataKeyLower] &&
        (movieData as any)[dataKey] === 1
      ) {
        const originalKey = lowercaseKeyMap[dataKeyLower];
        console.log(
          `Found unique genre via lowercase match: ${dataKey} -> ${originalKey}`
        );
        genreSet.add(genreMapping[originalKey]);
        processedKeys.add(dataKeyLower);
      }
    });

    // If no genres found after all detection methods, use fallbacks as last resort
    if (genreSet.size === 0) {
      // For TV Shows
      if (movieData.type === "TV Show") {
        console.log("NO GENRES FOUND FOR TV SHOW - USING FALLBACK LOGIC");
        genreSet.add("TV Drama");
      }
      // For Movies
      else if (!movieData.type || movieData.type === "Movie") {
        console.log("NO GENRES FOUND FOR MOVIE - USING FALLBACK LOGIC");
        genreSet.add("Drama");
      }
    }

    // Convert Set back to array for return
    const uniqueGenres = Array.from(genreSet);
    console.log("Final unique genres:", uniqueGenres);
    return uniqueGenres;
  };

  // Function to get the selected genre from form data (for backward compatibility)
  const getSelectedGenre = (data: MovieFormData): string => {
    const genres = getAllGenres(data);
    return genres.length > 0 ? genres[0] : "Not specified";
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
      Musicals: 0,
    };

    // Set the selected genre to 1
    if (selectedGenre) {
      // Define the genres we support for the dropdown
      const validGenres = [
        "Action",
        "Adventure",
        "Comedies",
        "Dramas",
        "HorrorMovies",
        "Thrillers",
        "Documentaries",
        "FamilyMovies",
        "Fantasy",
        "Musicals",
      ];

      // Only set if it's a valid genre field
      if (validGenres.includes(selectedGenre)) {
        // Explicitly use type assertion
        (updatedFormData as any)[selectedGenre] = 1;
      }
    }

    setFormData(updatedFormData);
  };

  // Function to add a new genre
  const handleAddGenre = (genreKey: string, contentType: "movie" | "tv") => {
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
    Object.keys(movie).forEach((key) => {
      console.log(
        `${key}: ${(movie as any)[key]} (${typeof (movie as any)[key]})`
      );
    });

    // Log the API structure
    console.log("MOVIE API STRUCTURE:", Object.getOwnPropertyNames(movie));

    // Copy all genre fields dynamically and handle null/undefined values
    const genreFields = [
      "Action",
      "Adventure",
      "Comedies",
      "Dramas",
      "HorrorMovies",
      "Thrillers",
      "Documentaries",
      "FamilyMovies",
      "Fantasy",
      "Musicals",
      "TVAction",
      "TVComedies",
      "TVDramas",
      "Docuseries",
      "KidsTV",
      "RealityTV",
      "Children",
      "DocumentariesInternationalMovies",
      "DramasInternationalMovies",
      "DramasRomanticMovies",
      "ComediesRomanticMovies",
      "AnimeSeriesInternationalTVShows",
      "BritishTVShowsDocuseriesInternationalTVShows",
      "InternationalTVShowsRomanticTVShowsTVDramas",
      "TalkShowsTVComedies",
      "CrimeTVShowsDocuseries",
      "LanguageTVShows",
      "NatureTV",
      "Spirituality",
      "ComediesDramasInternationalMovies",
      "ComediesInternationalMovies",
      "InternationalMoviesThrillers",
    ];

    console.log("FORCED GENRE FIELD INSPECTION:");
    // Inspect every genre field, even if it doesn't seem to be in the movie object
    genreFields.forEach((field) => {
      // Access the value from movie with various case forms
      const value =
        (movie as any)[field] !== undefined
          ? (movie as any)[field]
          : (movie as any)[field.toLowerCase()] !== undefined
          ? (movie as any)[field.toLowerCase()]
          : (movie as any)[field.toUpperCase()] !== undefined
          ? (movie as any)[field.toUpperCase()]
          : null;

      console.log(
        `${field}: direct=${(movie as any)[field]}, lowercase=${
          (movie as any)[field.toLowerCase()]
        }, uppercase=${(movie as any)[field.toUpperCase()]}, chosen=${value}`
      );

      // Always copy the field to movieData, using 0 if null/undefined
      (movieData as any)[field] =
        value !== null && value !== undefined ? value : 0;

      if (value === 1) {
        console.log(`*** FOUND ACTIVE GENRE: ${field} = ${value} ***`);
      }
    });

    // Try accessing the API Movie type properties directly
    console.log("TRYING DIRECT TYPE ACCESS:");
    if (movie.Action !== undefined)
      console.log(`Direct Action = ${movie.Action}`);
    if (movie.Comedies !== undefined)
      console.log(`Direct Comedies = ${movie.Comedies}`);
    if (movie.Dramas !== undefined)
      console.log(`Direct Dramas = ${movie.Dramas}`);

    // Insert test data if nothing seems to be working
    if (!getAllGenres(movieData).length) {
      console.log(
        "NO GENRES DETECTED. CHECKING IF WE NEED TO FORCE TEST VALUES."
      );

      // Check if movie title contains keywords that might suggest a genre
      const title = movie.title.toLowerCase();
      if (
        title.includes("action") ||
        title.includes("fast") ||
        title.includes("furious")
      ) {
        console.log(
          "Title suggests Action genre. Setting Action = 1 for testing"
        );
        movieData.Action = 1;
      } else if (
        title.includes("comedy") ||
        title.includes("funny") ||
        title.includes("laugh")
      ) {
        console.log(
          "Title suggests Comedy genre. Setting Comedies = 1 for testing"
        );
        movieData.Comedies = 1;
      } else if (
        title.includes("horror") ||
        title.includes("scary") ||
        title.includes("fear")
      ) {
        console.log(
          "Title suggests Horror genre. Setting HorrorMovies = 1 for testing"
        );
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
  for (let i = 1; i <= totalMovies; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          {/* Add Film Button */}
          <button
            onClick={() => setIsAdding(true)}
            style={{
              backgroundColor: "#4CAF50",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "4px",
              color: "white",
              fontWeight: "500",
              fontSize: "0.95rem",
              border: "none",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
              e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
            }}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>+</span>{" "}
            Add New Film
          </button>
        </div>

        {error && (
          <div
            className="card mb-4"
            style={{
              backgroundColor: "#fff5f5",
              borderLeft: "4px solid var(--color-error)",
            }}
          >
            <p className="text-error">{error}</p>
          </div>
        )}

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <h2 style={{ margin: 0 }}>Film Management</h2>

            {/* Page Size Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              <label htmlFor="pageSize">Movies per page:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                style={{
                  padding: "var(--spacing-xs) var(--spacing-sm)",
                  width: "auto",
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
          <div style={{ marginBottom: "var(--spacing-md)" }}>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setCurrentPage(1);
                
                // Trigger an immediate search with the current parameters
                try {
                  setLoading(true);
                  
                  const response = await movieApi.searchMovies(
                    searchQuery,
                    searchField,
                    1, // Start at page 1 for new searches
                    pageSize
                  );
                  
                  // Update movies with the search results
                  const limitedResults = response.data.slice(0, pageSize);
                  setMovies(limitedResults);
                  setTotalMovies(response.data.length);
                  setError(null);
                } catch (err) {
                  console.error("Error searching movies:", err);
                  setError("Failed to search movies. Please try again later.");
                } finally {
                  setLoading(false);
                }
              }}
              style={{ marginBottom: "var(--spacing-sm)" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "var(--spacing-sm)",
                  marginBottom: "var(--spacing-sm)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                    border: "3px solid #95a5a6",
                    backgroundColor: "white",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 5px 12px rgba(0,0,0,0.25)";
                    e.currentTarget.style.borderColor = "#3498db";
                    e.currentTarget.style.borderWidth = "3px";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 10px rgba(0,0,0,0.2)";
                    e.currentTarget.style.borderColor = "#95a5a6";
                    e.currentTarget.style.borderWidth = "3px";
                  }}
                >
                  {/* Search icon */}
                  <div style={{ padding: "0 12px" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#95a5a6"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={`Search by ${searchField}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      border: "none",
                      outline: "none",
                      fontSize: "0.95rem",
                      color: "#34495e",
                      backgroundColor: "transparent",
                    }}
                  />
                  {/* Clear button (X) - only shows when there's text */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0 12px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label="Clear search"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="#95a5a6"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  )}
                </div>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  style={{
                    padding: "0 10px",
                    width: "120px",
                    backgroundColor: "white",
                    border: "3px solid #95a5a6",
                    borderRadius: "4px",
                    color: "#34495e",
                    fontSize: "0.95rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                >
                  <option value="title">Title</option>
                  <option value="director">Director</option>
                  <option value="cast">Cast</option>
                  <option value="year">Year</option>
                </select>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    padding: "0 20px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#2980b9";
                    e.currentTarget.style.boxShadow =
                      "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#3498db";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "white",
                    border: "none",
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-xs)",
                  }}
                >
                  <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                </button>
              </div>
            </form>

            {/* Additional Filters */}
            {showFilters && (
              <div
                style={{
                  backgroundColor: "var(--color-background)",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--spacing-md)",
                  }}
                >
                  <div style={{ minWidth: "200px", flex: 1 }}>
                    <label
                      htmlFor="typeFilter"
                      style={{
                        display: "block",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      Type
                    </label>
                    <select
                      id="typeFilter"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{ width: "100%", padding: "var(--spacing-sm)" }}
                    >
                      <option value="">All Types</option>
                      <option value="Movie">Movies</option>
                      <option value="TV Show">TV Shows</option>
                      <option value="Documentary">Documentaries</option>
                    </select>
                  </div>

                  <div style={{ minWidth: "200px", flex: 1 }}>
                    <label
                      htmlFor="genreFilter"
                      style={{
                        display: "block",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      Genre
                    </label>
                    <select
                      id="genreFilter"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      style={{ width: "100%", padding: "var(--spacing-sm)" }}
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

                  <div style={{ minWidth: "200px", flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      Release Year
                    </label>
                    <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                      <input
                        type="number"
                        placeholder="From"
                        value={yearFrom || ""}
                        onChange={(e) =>
                          setYearFrom(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        style={{ flex: 1, padding: "var(--spacing-sm)" }}
                        min="1900"
                        max="2099"
                      />
                      <input
                        type="number"
                        placeholder="To"
                        value={yearTo || ""}
                        onChange={(e) =>
                          setYearTo(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        style={{ flex: 1, padding: "var(--spacing-sm)" }}
                        min="1900"
                        max="2099"
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "var(--spacing-md)",
                  }}
                >
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("");
                      setSelectedGenre("");
                      setYearFrom(undefined);
                      setYearTo(undefined);
                      setCurrentPage(1);
                    }}
                    style={{
                      backgroundColor: "var(--color-error)",
                      color: "white",
                      border: "none",
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
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
            <div
              className="text-center"
              style={{ padding: "var(--spacing-xl)" }}
            >
              <p>Loading movies...</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {movies.length > 0 ? (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #d1d8e0",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Title</th>
                      <th style={tableHeaderStyle}>Type</th>
                      <th style={tableHeaderStyle}>Year</th>
                      <th style={tableHeaderStyle}>Genre</th>
                      <th style={tableHeaderStyle}>Director</th>
                      <th style={tableHeaderStyle}>Cast</th>
                      <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((movie) => (
                      <tr
                        key={movie.showId}
                        style={{
                          transition: "all 0.2s ease",
                          borderLeft: "3px solid transparent",
                          borderBottom: "1px solid #d1d8e0",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                          e.currentTarget.style.borderLeft =
                            "3px solid #3498db";
                          e.currentTarget.style.boxShadow =
                            "0 2px 4px rgba(0,0,0,0.05)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.borderLeft =
                            "3px solid transparent";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: "500" }}>
                            {movie.title}{" "}
                            {!movie.showId && (
                              <small style={{ color: "red" }}>
                                (Missing ID)
                              </small>
                            )}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              backgroundColor:
                                movie.type === "Movie" ? "#e3f2fd" : "#f3e5f5",
                              color:
                                movie.type === "Movie" ? "#1565c0" : "#7b1fa2",
                              fontSize: "0.85rem",
                              fontWeight: "500",
                            }}
                          >
                            {movie.type || "Unknown"}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          {movie.releaseYear || "Unknown"}
                        </td>
                        {/* Genre column - displays all genres separated by commas */}
                        <td style={tableCellStyle}>
                          {(() => {
                            // Get all genres using our detection function
                            const genres = getAllGenres(
                              movie as unknown as MovieFormData
                            );

                            // If no genres, show "Not specified"
                            if (genres.length === 0) return "Not specified";

                            // Always join all genres with commas for consistent display
                            return genres.join(", ");
                          })()}
                        </td>
                        {/* Director column with truncation for long values */}
                        <td
                          style={{
                            ...tableCellStyle,
                            maxWidth: "150px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {movie.director || "Not specified"}
                        </td>
                        {/* Cast column with truncation for long values */}
                        <td
                          style={{
                            ...tableCellStyle,
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {movie.cast || "Not specified"}
                        </td>
                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: "var(--spacing-xs)",
                            }}
                          >
                            <button
                              onClick={() => startEdit(movie)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#3498db",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#2980b9";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 8px rgba(0,0,0,0.15)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#3498db";
                                e.currentTarget.style.boxShadow =
                                  "0 2px 4px rgba(0,0,0,0.1)";
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMovie(movie.showId, movie.title)
                              }
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#e74c3c",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#c0392b";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 8px rgba(0,0,0,0.15)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#e74c3c";
                                e.currentTarget.style.boxShadow =
                                  "0 2px 4px rgba(0,0,0,0.1)";
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
                <div
                  className="text-center"
                  style={{ padding: "var(--spacing-xl)" }}
                >
                  <p>No movies found. Add some movies to get started!</p>
                </div>
              )}
            </div>
          )}
          {/*  */}

          {/* Pagination Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "var(--spacing-lg) 0 var(--spacing-sm) 0",
              flexWrap: "wrap",
              gap: "var(--spacing-xs)",
            }}
          >
            {/* First Page Button */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: "var(--spacing-xs) var(--spacing-md)",
                backgroundColor:
                  currentPage === 1
                    ? "var(--color-background)"
                    : "var(--color-primary)",
                color: currentPage === 1 ? "var(--color-text-light)" : "white",
                border: `1px solid ${
                  currentPage === 1
                    ? "var(--color-border)"
                    : "var(--color-primary)"
                }`,
                borderRadius: "var(--radius-md)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.7 : 1,
              }}
            >
              First
            </button>

            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "var(--spacing-xs) var(--spacing-md)",
                backgroundColor:
                  currentPage === 1
                    ? "var(--color-background)"
                    : "var(--color-primary)",
                color: currentPage === 1 ? "var(--color-text-light)" : "white",
                border: `1px solid ${
                  currentPage === 1
                    ? "var(--color-border)"
                    : "var(--color-primary)"
                }`,
                borderRadius: "var(--radius-md)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.7 : 1,
              }}
            >
              &larr; Previous
            </button>

            {/* Generate page numbers dynamically */}
            {(() => {
              const pageNumbersToShow = [];

              const previousPage = currentPage > 1 ? currentPage - 1 : null;
              const nextPage = currentPage < totalPages ? currentPage + 1 : null;

              if (previousPage) pageNumbersToShow.push(previousPage);
              pageNumbersToShow.push(currentPage);
              if (nextPage) pageNumbersToShow.push(nextPage);

              return pageNumbersToShow.map((number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  style={{
                    padding: "var(--spacing-xs) var(--spacing-md)",
                    backgroundColor:
                      currentPage === number
                        ? "var(--color-primary)"
                        : "var(--color-background)",
                    color:
                      currentPage === number ? "white" : "var(--color-text)",
                    border: `1px solid ${
                      currentPage === number
                        ? "var(--color-primary)"
                        : "var(--color-border)"
                    }`,
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    minWidth: "40px",
                  }}
                >
                  {number}
                </button>
              ));
            })()}

            {/* Next Page Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: "var(--spacing-xs) var(--spacing-md)",
                backgroundColor:
                  currentPage === totalPages || totalPages === 0
                    ? "var(--color-background)"
                    : "var(--color-primary)",
                color:
                  currentPage === totalPages || totalPages === 0
                    ? "var(--color-text-light)"
                    : "white",
                border: `1px solid ${
                  currentPage === totalPages || totalPages === 0
                    ? "var(--color-border)"
                    : "var(--color-primary)"
                }`,
                borderRadius: "var(--radius-md)",
                cursor:
                  currentPage === totalPages || totalPages === 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  currentPage === totalPages || totalPages === 0 ? 0.7 : 1,
              }}
            >
              Next &rarr;
            </button>

            </div>

            <div className="text-center" style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
              Showing page {currentPage} of {totalMovies > 0 ? Math.ceil(totalMovies / pageSize) : 1}  {/* Calculate total pages */}
            </div>

          {/*  */}
        </div>
      </div>

      {/* Add Movie Modal */}
      {isAdding && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ margin: 0 }}>Add New Film</h2>
              <button
                onClick={() => setIsAdding(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMovie}>
              {/* Movie ID is now auto-generated */}

              <div style={formGroupStyle}>
                <label htmlFor="type">Content Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="Movie">Movie</option>
                  <option value="TV Show">TV Show</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="title">Title *</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.title.trim()) {
                        // Use custom alert modal
                        setAlertType("info");
                        setAlertTitle("Missing Title");
                        setAlertMessage(
                          "Please enter a movie title first before using Auto-Fill."
                        );
                        setShowAlertModal(true);
                        return;
                      }

                      try {
                        setLoading(true);

                        // Search for the movie or TV show
                        const type =
                          formData.type === "TV Show" ? "tv" : "movie";
                        // Store current search query and type for pagination
                        setCurrentSearchQuery(formData.title);
                        setCurrentSearchType(type);
                        setSearchResultsPage(1); // Reset to page 1 for new search

                        const response = await tmdbApi.searchByTitle(
                          formData.title,
                          type
                        );

                        if (
                          !response.results ||
                          response.results.length === 0
                        ) {
                          alert("No results found for this title");
                          setLoading(false);
                          return;
                        }

                        // Store total pages for pagination
                        setSearchResultsTotalPages(response.total_pages || 1);

                        // Always show selection modal
                        setSearchResults(response.results);
                        setIsEditMode(false); // We're in Add mode
                        setShowSearchResultsModal(true);
                        setLoading(false);
                        // No need for additional code here - selection is handled in the modal
                        return;

                        // Auto-population complete, no need to show a modal
                        console.log("Auto-fill complete");
                      } catch (error) {
                        console.error("Error fetching movie data:", error);
                        alert("Failed to fetch movie data. Please try again.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      backgroundColor: "#4285F4",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 15px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Auto-Fill
                  </button>
                </div>
                <small
                  style={{
                    color: "#666",
                    fontSize: "0.8rem",
                    marginTop: "5px",
                    display: "block",
                  }}
                >
                  Enter a title and click "Auto-Fill" to fetch movie information
                  from TMDB.
                </small>
              </div>

              {/* Type is now at the top of the form */}

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
                  value={formData.director || ""}
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
                  value={formData.cast || ""}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country || ""}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={formGroupStyle}>
                  <label htmlFor="rating">Rating</label>
                  <select
                    id="rating"
                    name="rating"
                    value={formData.rating || ""}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Select a rating</option>
                    {formData.type === "Movie" ? (
                      // Movie ratings
                      <>
                        <option value="G">G</option>
                        <option value="PG">PG</option>
                        <option value="PG-13">PG-13</option>
                        <option value="R">R</option>
                        <option value="NC-17">NC-17</option>
                        <option value="Not Rated">Not Rated</option>
                      </>
                    ) : (
                      // TV ratings
                      <>
                        <option value="TV-Y">TV-Y (All Children)</option>
                        <option value="TV-Y7">TV-Y7 (Older Children)</option>
                        <option value="TV-G">TV-G (General Audience)</option>
                        <option value="TV-PG">TV-PG (Parental Guidance)</option>
                        <option value="TV-14">
                          TV-14 (Parents Strongly Cautioned)
                        </option>
                        <option value="TV-MA">TV-MA (Mature Audience)</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={parseDuration(formData.duration || "") || ""}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value);
                      if (!isNaN(minutes)) {
                        setFormData({
                          ...formData,
                          duration: minutes.toString(),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          duration: "",
                        });
                      }
                    }}
                    style={inputStyle}
                    min="1"
                    placeholder="Enter total minutes"
                  />
                  {formData.duration && !isNaN(parseInt(formData.duration)) && (
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      Display format:{" "}
                      {formatDuration(parseInt(formData.duration))}
                    </small>
                  )}
                </div>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  style={textareaStyle}
                  rows={4}
                />
              </div>

              <div style={formGroupStyle}>
                <label>Movie Poster</label>

                {/* Poster Image Preview */}
                <div
                  style={{
                    marginBottom: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px",
                    backgroundColor: "#f9f9f9",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={
                      formData.posterUrl ||
                      "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster&font=montserrat"
                    }
                    alt="Movie Poster"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/320x480/2c3e50/FFFFFF?text=Invalid+Image+URL&font=montserrat";
                    }}
                  />

                  {/* Centered Update Poster Button */}
                  <div style={{ textAlign: "center", marginTop: "15px" }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.title.trim()) {
                          // Use custom alert modal instead
                          setAlertType("info");
                          setAlertTitle("Missing Title");
                          setAlertMessage(
                            "Please enter a movie title first before updating the poster."
                          );
                          setShowAlertModal(true);
                          return;
                        }

                        try {
                          setLoading(true);

                          // Search more broadly for similar titles
                          const type =
                            formData.type === "TV Show" ? "tv" : "movie";

                          // Do a search for the title to get various options
                          const response = await tmdbApi.searchByTitle(
                            formData.title,
                            type
                          );

                          if (
                            !response.results ||
                            response.results.length === 0
                          ) {
                            alert("No matching titles found");
                            setLoading(false);
                            return;
                          }

                          // Get all results with posters
                          const resultsWithPosters = response.results.filter(
                            (result) => result.poster_path
                          );

                          if (!resultsWithPosters.length) {
                            alert("No posters found for similar titles");
                            setLoading(false);
                            return;
                          }

                          // Always show the modal with multiple options, even if there's just one result
                          setPosterSearchResults(resultsWithPosters);
                          setPosterForEditMode(false); // We're in Add mode
                          setShowPosterModal(true);
                        } catch (error) {
                          console.error(
                            "Error fetching poster options:",
                            error
                          );
                          alert(
                            "Failed to fetch poster options. Please try again."
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        backgroundColor: "#4285F4",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 20px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      Update Poster
                    </button>
                  </div>
                </div>

                {/* Hidden posterUrl field */}
                <input
                  type="hidden"
                  id="posterUrl"
                  name="posterUrl"
                  value={formData.posterUrl || ""}
                  onChange={handleInputChange}
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
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
      {/* TMDB Search Results Modal for Add or Edit Movie */}
      {showSearchResultsModal && searchResults.length > 0 && (
        <div style={{ ...modalOverlayStyle, zIndex: isEditMode ? 1500 : 1000 }}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: "800px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ margin: 0 }}>Select the Correct Movie/TV Show</h2>
              <button
                onClick={() => setShowSearchResultsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <p>
              Multiple matches found for "{formData.title}". Please select the
              correct one:
            </p>

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "15px",
              }}
            >
              {searchResults.map((result, index) => {
                const title = "title" in result ? result.title : result.name;
                const year =
                  "release_date" in result
                    ? result.release_date
                      ? new Date(result.release_date).getFullYear()
                      : "Unknown"
                    : result.first_air_date
                    ? new Date(result.first_air_date).getFullYear()
                    : "Unknown";
                const poster = result.poster_path
                  ? `${tmdbApi.POSTER_BASE_URL}${result.poster_path}`
                  : "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster&font=montserrat";
                const type = "title" in result ? "Movie" : "TV Show";
                const overview = result.overview || "No description available";

                return (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.boxShadow =
                        "0 5px 15px rgba(0,0,0,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 5px rgba(0,0,0,0.1)";
                    }}
                    onClick={async () => {
                      setLoading(true);

                      try {
                        // Check if we're in edit mode or add mode
                        if (isEditMode && editingMovie) {
                          // Handle edit mode - update editingMovie state
                          if ("title" in result) {
                            // It's a movie - get detailed information including cast, director, genres
                            const movieDetails = await tmdbApi.getMovieDetails(
                              result.id
                            );

                            // Extract director(s)
                            let directors = "";
                            if (movieDetails.credits?.crew) {
                              const directorCrew = movieDetails.credits.crew
                                .filter((person) => person.job === "Director")
                                .map((person) => person.name);

                              if (directorCrew.length > 0) {
                                directors = directorCrew.join(", ");
                              }
                            }

                            // Extract cast (take top 5)
                            let cast = "";
                            if (
                              movieDetails.credits?.cast &&
                              movieDetails.credits.cast.length > 0
                            ) {
                              cast = movieDetails.credits.cast
                                .slice(0, 5)
                                .map((actor) => actor.name)
                                .join(", ");
                            }

                            // Extract country information
                            let country = "";
                            if (
                              movieDetails.production_countries &&
                              movieDetails.production_countries.length > 0
                            ) {
                              country = movieDetails.production_countries
                                .map((c) => c.name)
                                .join(", ");
                            }

                            // Extract rating information (certification)
                            let rating = "";
                            if (
                              movieDetails.release_dates &&
                              movieDetails.release_dates.results
                            ) {
                              // Try to find US rating first
                              const usRelease =
                                movieDetails.release_dates.results.find(
                                  (r) => r.iso_3166_1 === "US"
                                );
                              if (
                                usRelease &&
                                usRelease.release_dates &&
                                usRelease.release_dates.length > 0
                              ) {
                                const certification =
                                  usRelease.release_dates.find(
                                    (d) => d.certification
                                  )?.certification;
                                if (certification) {
                                  rating = certification;
                                }
                              }
                            }

                            // Get duration in minutes (stored as a string)
                            let durationMinutes = "";
                            if (movieDetails.runtime) {
                              durationMinutes = movieDetails.runtime.toString();
                            }

                            // Map genres to our format
                            const genreMapping: { [key: string]: number } = {};
                            if (
                              movieDetails.genres &&
                              movieDetails.genres.length > 0
                            ) {
                              movieDetails.genres.forEach((genre) => {
                                const mappedGenre = genre.name.toLowerCase();

                                // Handle common movie genres
                                if (mappedGenre.includes("drama"))
                                  genreMapping.Dramas = 1;
                                if (mappedGenre.includes("comedy"))
                                  genreMapping.Comedies = 1;
                                if (mappedGenre.includes("action"))
                                  genreMapping.Action = 1;
                                if (mappedGenre.includes("adventure"))
                                  genreMapping.Adventure = 1;
                                if (mappedGenre.includes("horror"))
                                  genreMapping.HorrorMovies = 1;
                                if (mappedGenre.includes("thriller"))
                                  genreMapping.Thrillers = 1;
                                if (mappedGenre.includes("documentary"))
                                  genreMapping.Documentaries = 1;
                                if (mappedGenre.includes("family"))
                                  genreMapping.FamilyMovies = 1;
                                if (mappedGenre.includes("fantasy"))
                                  genreMapping.Fantasy = 1;
                                if (
                                  mappedGenre.includes("musical") ||
                                  mappedGenre.includes("music")
                                )
                                  genreMapping.Musicals = 1;
                                if (mappedGenre.includes("romance"))
                                  genreMapping.DramasRomanticMovies = 1;
                              });
                            }

                            // Set Dramas as default if no other genres were mapped
                            if (Object.keys(genreMapping).length === 0) {
                              genreMapping.Dramas = 1;
                            }

                            // Update the editing movie
                            setEditingMovie({
                              ...editingMovie,
                              title: movieDetails.title,
                              type: "Movie",
                              releaseYear: movieDetails.release_date
                                ? new Date(
                                    movieDetails.release_date
                                  ).getFullYear()
                                : undefined,
                              description: movieDetails.overview,
                              posterUrl: movieDetails.poster_path
                                ? `${tmdbApi.POSTER_BASE_URL}${movieDetails.poster_path}`
                                : undefined,
                              director: directors || "",
                              cast: cast || "",
                              country: country || "",
                              rating: rating || "",
                              duration: durationMinutes,
                              ...genreMapping,
                            });
                          } else {
                            // It's a TV show - get detailed information
                            const tvDetails = await tmdbApi.getTVShowDetails(
                              result.id
                            );

                            // Extract creator(s) as director(s)
                            let directors = "";
                            if (
                              tvDetails.created_by &&
                              tvDetails.created_by.length > 0
                            ) {
                              directors = tvDetails.created_by
                                .map((creator) => creator.name)
                                .join(", ");
                            } else if (tvDetails.credits?.crew) {
                              // Look for directors or writers in crew
                              const directorsList = tvDetails.credits.crew
                                .filter(
                                  (person) =>
                                    person.job === "Director" ||
                                    person.job === "Writer" ||
                                    person.department === "Writing"
                                )
                                .map((person) => person.name)
                                .slice(0, 3); // Take max 3 directors/writers

                              if (directorsList.length > 0) {
                                directors = directorsList.join(", ");
                              }
                            }

                            // Extract cast (take top 5)
                            let cast = "";
                            if (
                              tvDetails.credits?.cast &&
                              tvDetails.credits.cast.length > 0
                            ) {
                              cast = tvDetails.credits.cast
                                .slice(0, 5)
                                .map((actor) => actor.name)
                                .join(", ");
                            }

                            // Extract country information
                            let country = "";
                            if (
                              tvDetails.origin_country &&
                              tvDetails.origin_country.length > 0
                            ) {
                              country = tvDetails.origin_country.join(", ");
                            } else if (
                              tvDetails.production_countries &&
                              tvDetails.production_countries.length > 0
                            ) {
                              country = tvDetails.production_countries
                                .map((c: any) => c.name)
                                .join(", ");
                            }

                            // Map genres to our format
                            const genreMapping: { [key: string]: number } = {};
                            if (
                              tvDetails.genres &&
                              tvDetails.genres.length > 0
                            ) {
                              tvDetails.genres.forEach((genre) => {
                                const mappedGenre = genre.name.toLowerCase();

                                // Handle common TV genres
                                if (mappedGenre.includes("drama"))
                                  genreMapping.TVDramas = 1;
                                if (mappedGenre.includes("comedy"))
                                  genreMapping.TVComedies = 1;
                                if (mappedGenre.includes("action"))
                                  genreMapping.TVAction = 1;
                                if (mappedGenre.includes("documentary"))
                                  genreMapping.Docuseries = 1;
                                if (mappedGenre.includes("kids"))
                                  genreMapping.KidsTV = 1;
                                if (mappedGenre.includes("reality"))
                                  genreMapping.RealityTV = 1;
                                if (mappedGenre.includes("talk"))
                                  genreMapping.TalkShowsTVComedies = 1;
                                if (mappedGenre.includes("news"))
                                  genreMapping.NatureTV = 1;
                                if (mappedGenre.includes("crime"))
                                  genreMapping.CrimeTVShowsDocuseries = 1;
                              });
                            }

                            // Set TVDramas as default if no other genres were mapped
                            if (Object.keys(genreMapping).length === 0) {
                              genreMapping.TVDramas = 1;
                            }

                            // Update the editing movie
                            setEditingMovie({
                              ...editingMovie,
                              title: tvDetails.name,
                              type: "TV Show",
                              releaseYear: tvDetails.first_air_date
                                ? new Date(
                                    tvDetails.first_air_date
                                  ).getFullYear()
                                : undefined,
                              description: tvDetails.overview,
                              posterUrl: tvDetails.poster_path
                                ? `${tmdbApi.POSTER_BASE_URL}${tvDetails.poster_path}`
                                : undefined,
                              director: directors || "",
                              cast: cast || "",
                              country: country || "",
                              ...genreMapping,
                            });
                          }
                        } else {
                          // Handle add mode - update formData state
                          if ("title" in result) {
                            // It's a movie - get detailed information including cast, director, genres
                            const movieDetails = await tmdbApi.getMovieDetails(
                              result.id
                            );

                            // Extract director(s)
                            let directors = "";
                            if (movieDetails.credits?.crew) {
                              const directorCrew = movieDetails.credits.crew
                                .filter((person) => person.job === "Director")
                                .map((person) => person.name);

                              if (directorCrew.length > 0) {
                                directors = directorCrew.join(", ");
                              }
                            }

                            // Extract cast (take top 5)
                            let cast = "";
                            if (
                              movieDetails.credits?.cast &&
                              movieDetails.credits.cast.length > 0
                            ) {
                              cast = movieDetails.credits.cast
                                .slice(0, 5)
                                .map((actor) => actor.name)
                                .join(", ");
                            }

                            // Extract country information
                            let country = "";
                            if (
                              movieDetails.production_countries &&
                              movieDetails.production_countries.length > 0
                            ) {
                              country = movieDetails.production_countries
                                .map((c) => c.name)
                                .join(", ");
                            }

                            // Extract rating information (certification)
                            let rating = "";
                            if (
                              movieDetails.release_dates &&
                              movieDetails.release_dates.results
                            ) {
                              // Try to find US rating first
                              const usRelease =
                                movieDetails.release_dates.results.find(
                                  (r) => r.iso_3166_1 === "US"
                                );
                              if (
                                usRelease &&
                                usRelease.release_dates &&
                                usRelease.release_dates.length > 0
                              ) {
                                const certification =
                                  usRelease.release_dates.find(
                                    (d) => d.certification
                                  )?.certification;
                                if (certification) {
                                  rating = certification;
                                }
                              }
                            }

                            // Get duration in minutes (stored as a string)
                            let durationMinutes = "";
                            if (movieDetails.runtime) {
                              durationMinutes = movieDetails.runtime.toString();
                            }

                            // Map genres to our format
                            const genreMapping: { [key: string]: number } = {};
                            if (
                              movieDetails.genres &&
                              movieDetails.genres.length > 0
                            ) {
                              movieDetails.genres.forEach((genre) => {
                                const mappedGenre = genre.name.toLowerCase();

                                // Handle common movie genres
                                if (mappedGenre.includes("drama"))
                                  genreMapping.Dramas = 1;
                                if (mappedGenre.includes("comedy"))
                                  genreMapping.Comedies = 1;
                                if (mappedGenre.includes("action"))
                                  genreMapping.Action = 1;
                                if (mappedGenre.includes("adventure"))
                                  genreMapping.Adventure = 1;
                                if (mappedGenre.includes("horror"))
                                  genreMapping.HorrorMovies = 1;
                                if (mappedGenre.includes("thriller"))
                                  genreMapping.Thrillers = 1;
                                if (mappedGenre.includes("documentary"))
                                  genreMapping.Documentaries = 1;
                                if (mappedGenre.includes("family"))
                                  genreMapping.FamilyMovies = 1;
                                if (mappedGenre.includes("fantasy"))
                                  genreMapping.Fantasy = 1;
                                if (
                                  mappedGenre.includes("musical") ||
                                  mappedGenre.includes("music")
                                )
                                  genreMapping.Musicals = 1;
                                if (mappedGenre.includes("romance"))
                                  genreMapping.DramasRomanticMovies = 1;
                              });
                            }

                            // Set Dramas as default if no other genres were mapped
                            if (Object.keys(genreMapping).length === 0) {
                              genreMapping.Dramas = 1;
                            }

                            setFormData({
                              ...formData,
                              title: movieDetails.title,
                              type: "Movie",
                              releaseYear: movieDetails.release_date
                                ? new Date(
                                    movieDetails.release_date
                                  ).getFullYear()
                                : undefined,
                              description: movieDetails.overview,
                              posterUrl: movieDetails.poster_path
                                ? `${tmdbApi.POSTER_BASE_URL}${movieDetails.poster_path}`
                                : undefined,
                              director: directors || "",
                              cast: cast || "",
                              country: country || "",
                              rating: rating || "",
                              duration: durationMinutes,
                              ...genreMapping,
                            });
                          } else {
                            // It's a TV show - get detailed information
                            const tvDetails = await tmdbApi.getTVShowDetails(
                              result.id
                            );

                            // Extract creator(s) as director(s)
                            let directors = "";
                            if (
                              tvDetails.created_by &&
                              tvDetails.created_by.length > 0
                            ) {
                              directors = tvDetails.created_by
                                .map((creator) => creator.name)
                                .join(", ");
                            } else if (tvDetails.credits?.crew) {
                              // Look for directors or writers in crew
                              const directorsList = tvDetails.credits.crew
                                .filter(
                                  (person) =>
                                    person.job === "Director" ||
                                    person.job === "Writer" ||
                                    person.department === "Writing"
                                )
                                .map((person) => person.name)
                                .slice(0, 3); // Take max 3 directors/writers

                              if (directorsList.length > 0) {
                                directors = directorsList.join(", ");
                              }
                            }

                            // Extract cast (take top 5)
                            let cast = "";
                            if (
                              tvDetails.credits?.cast &&
                              tvDetails.credits.cast.length > 0
                            ) {
                              cast = tvDetails.credits.cast
                                .slice(0, 5)
                                .map((actor) => actor.name)
                                .join(", ");
                            }

                            // Map genres to our format
                            const genreMapping: { [key: string]: number } = {};
                            if (
                              tvDetails.genres &&
                              tvDetails.genres.length > 0
                            ) {
                              tvDetails.genres.forEach((genre) => {
                                const mappedGenre = genre.name.toLowerCase();

                                // Handle common TV genres
                                if (mappedGenre.includes("drama"))
                                  genreMapping.TVDramas = 1;
                                if (mappedGenre.includes("comedy"))
                                  genreMapping.TVComedies = 1;
                                if (mappedGenre.includes("action"))
                                  genreMapping.TVAction = 1;
                                if (mappedGenre.includes("documentary"))
                                  genreMapping.Docuseries = 1;
                                if (mappedGenre.includes("kids"))
                                  genreMapping.KidsTV = 1;
                                if (mappedGenre.includes("reality"))
                                  genreMapping.RealityTV = 1;
                                if (mappedGenre.includes("talk"))
                                  genreMapping.TalkShowsTVComedies = 1;
                                if (mappedGenre.includes("news"))
                                  genreMapping.NatureTV = 1;
                                if (mappedGenre.includes("crime"))
                                  genreMapping.CrimeTVShowsDocuseries = 1;
                              });
                            }

                            // Set TVDramas as default if no other genres were mapped
                            if (Object.keys(genreMapping).length === 0) {
                              genreMapping.TVDramas = 1;
                            }

                            setFormData({
                              ...formData,
                              title: tvDetails.name,
                              type: "TV Show",
                              releaseYear: tvDetails.first_air_date
                                ? new Date(
                                    tvDetails.first_air_date
                                  ).getFullYear()
                                : undefined,
                              description: tvDetails.overview,
                              posterUrl: tvDetails.poster_path
                                ? `${tmdbApi.POSTER_BASE_URL}${tvDetails.poster_path}`
                                : undefined,
                              director: directors || "",
                              cast: cast || "",
                              ...genreMapping,
                            });
                          }
                        }

                        // Close the modal without showing any notification
                        setShowSearchResultsModal(false);
                      } catch (error) {
                        console.error("Error fetching details:", error);
                        alert(
                          "Could not fetch complete details. Basic information has been populated."
                        );

                        // Fallback to basic information
                        if ("title" in result) {
                          setFormData({
                            ...formData,
                            title: result.title,
                            type: "Movie",
                            releaseYear: result.release_date
                              ? new Date(result.release_date).getFullYear()
                              : undefined,
                            description: result.overview,
                            posterUrl: result.poster_path
                              ? `${tmdbApi.POSTER_BASE_URL}${result.poster_path}`
                              : undefined,
                            // Set movie genre (default to Drama if none specified)
                            Dramas: 1,
                          });
                        } else {
                          setFormData({
                            ...formData,
                            title: result.name,
                            type: "TV Show",
                            releaseYear: result.first_air_date
                              ? new Date(result.first_air_date).getFullYear()
                              : undefined,
                            description: result.overview,
                            posterUrl: result.poster_path
                              ? `${tmdbApi.POSTER_BASE_URL}${result.poster_path}`
                              : undefined,
                            // Set TV genre (default to TVDramas if none specified)
                            TVDramas: 1,
                          });
                        }

                        // Close the modal
                        setShowSearchResultsModal(false);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <div style={{ position: "relative", paddingTop: "150%" }}>
                      <img
                        src={poster}
                        alt={title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div style={{ padding: "15px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>
                        {title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#e0e0e0",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {type}
                        </span>
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>
                          {year}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "0.9rem",
                          color: "#555",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {overview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={async () => {
                  if (searchResultsPage < searchResultsTotalPages) {
                    try {
                      setLoading(true);
                      // Load the next page
                      const nextPage = searchResultsPage + 1;
                      const response = await tmdbApi.searchByTitle(
                        currentSearchQuery,
                        currentSearchType,
                        nextPage
                      );

                      if (response.results && response.results.length > 0) {
                        // Append new results to existing results
                        setSearchResults([
                          ...searchResults,
                          ...response.results,
                        ]);
                        setSearchResultsPage(nextPage);
                      }
                    } catch (error) {
                      console.error("Error loading more results:", error);
                      setAlertType("error");
                      setAlertTitle("Error");
                      setAlertMessage(
                        "Failed to load more results. Please try again."
                      );
                      setShowAlertModal(true);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={
                  searchResultsPage >= searchResultsTotalPages || loading
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    searchResultsPage >= searchResultsTotalPages
                      ? "#e0e0e0"
                      : "#4285F4",
                  color:
                    searchResultsPage >= searchResultsTotalPages
                      ? "#757575"
                      : "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    searchResultsPage >= searchResultsTotalPages
                      ? "not-allowed"
                      : "pointer",
                  display:
                    searchResultsPage >= searchResultsTotalPages
                      ? "none"
                      : "block",
                }}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
              <button
                onClick={() => setShowSearchResultsModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poster Selection Modal */}
      {showPosterModal && posterSearchResults.length > 0 && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: "800px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ margin: 0 }}>Select a Poster</h2>
              <button
                onClick={() => setShowPosterModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <p>
              Multiple posters found for{" "}
              {posterForEditMode ? editingMovie?.title : formData.title}. Choose
              one:
            </p>

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              {posterSearchResults.map((result, index) => {
                const title = "title" in result ? result.title : result.name;
                const poster = result.poster_path
                  ? `${tmdbApi.POSTER_BASE_URL}${result.poster_path}`
                  : "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster&font=montserrat";

                return (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 5px 15px rgba(0,0,0,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 5px rgba(0,0,0,0.1)";
                    }}
                    onClick={() => {
                      const posterUrl = `${tmdbApi.POSTER_BASE_URL}${result.poster_path}`;

                      if (posterForEditMode && editingMovie) {
                        // We're in Edit mode
                        setEditingMovie({
                          ...editingMovie,
                          posterUrl,
                        });
                      } else {
                        // We're in Add mode
                        setFormData({
                          ...formData,
                          posterUrl,
                        });
                      }

                      // Close the modal without showing an alert
                      setShowPosterModal(false);
                    }}
                  >
                    <div style={{ position: "relative", paddingTop: "150%" }}>
                      <img
                        src={poster}
                        alt={title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div style={{ padding: "10px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#4285F4",
                          color: "white",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Select This Poster
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={async () => {
                  if (posterSearchPage < posterSearchTotalPages) {
                    try {
                      setLoading(true);
                      console.log(
                        "Loading more posters. Current page:",
                        posterSearchPage,
                        "Total pages:",
                        posterSearchTotalPages
                      );

                      // Load the next page
                      const nextPage = posterSearchPage + 1;
                      const query = posterForEditMode
                        ? editingMovie!.title
                        : formData.title;
                      console.log(
                        "Using query:",
                        query,
                        "Type:",
                        currentPosterType,
                        "Page:",
                        nextPage
                      );

                      const response = await tmdbApi.searchByTitle(
                        query,
                        currentPosterType,
                        nextPage
                      );

                      console.log(
                        "Got response for page",
                        nextPage,
                        "Total pages:",
                        response.total_pages,
                        "Results:",
                        response.results?.length
                      );

                      if (response.results && response.results.length > 0) {
                        // Filter results with posters
                        const resultsWithPosters = response.results.filter(
                          (result) => result.poster_path
                        );
                        console.log(
                          "Found",
                          resultsWithPosters.length,
                          "results with posters"
                        );

                        if (resultsWithPosters.length > 0) {
                          // Append new results to existing results
                          setPosterSearchResults([
                            ...posterSearchResults,
                            ...resultsWithPosters,
                          ]);
                          setPosterSearchPage(nextPage);
                        }
                      }
                    } catch (error) {
                      console.error("Error loading more posters:", error);
                      setAlertType("error");
                      setAlertTitle("Error");
                      setAlertMessage(
                        "Failed to load more posters. Please try again."
                      );
                      setShowAlertModal(true);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={posterSearchPage >= posterSearchTotalPages || loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    posterSearchPage >= posterSearchTotalPages
                      ? "#e0e0e0"
                      : "#4285F4",
                  color:
                    posterSearchPage >= posterSearchTotalPages
                      ? "#757575"
                      : "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    posterSearchPage >= posterSearchTotalPages
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
              <button
                onClick={() => setShowPosterModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {showAlertModal && (
        <div style={{ ...modalOverlayStyle, zIndex: 2000 }}>
          <div style={{ ...modalContentStyle, maxWidth: "400px" }}>
            <div
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid #eee",
                backgroundColor:
                  alertType === "success"
                    ? "#e8f5e9"
                    : alertType === "error"
                    ? "#ffebee"
                    : "#e3f2fd",
                borderRadius: "8px 8px 0 0",
                marginTop: "-20px",
                marginLeft: "-20px",
                marginRight: "-20px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color:
                    alertType === "success"
                      ? "#2e7d32"
                      : alertType === "error"
                      ? "#c62828"
                      : "#1565c0",
                }}
              >
                {alertTitle ||
                  (alertType === "success"
                    ? "Success"
                    : alertType === "error"
                    ? "Error"
                    : "Information")}
              </h3>
              <button
                onClick={() => setShowAlertModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                  lineHeight: "1",
                  padding: "0",
                  marginLeft: "10px",
                }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: "15px 0", fontSize: "1rem" }}>{alertMessage}</p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowAlertModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    alertType === "success"
                      ? "#4caf50"
                      : alertType === "error"
                      ? "#f44336"
                      : "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ ...modalOverlayStyle, zIndex: 1200 }}>
          <div style={{ ...modalContentStyle, maxWidth: "400px" }}>
            <div
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid #eee",
                backgroundColor: "#fff3e0",
                borderRadius: "8px 8px 0 0",
                marginTop: "-20px",
                marginLeft: "-20px",
                marginRight: "-20px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#e65100" }}>
                {confirmTitle || "Confirm Action"}
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                  lineHeight: "1",
                  padding: "0",
                  marginLeft: "10px",
                }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: "15px 0", fontSize: "1rem" }}>
              {confirmMessage}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e0e0e0",
                  color: "#212121",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmCallback();
                  setShowConfirmModal(false);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMovie && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ margin: 0 }}>Film Details</h2>
              <button
                onClick={() => setEditingMovie(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditMovie}>
              <div style={formGroupStyle}>
                <label htmlFor="edit-type">Type</label>
                <select
                  id="edit-type"
                  name="type"
                  value={editingMovie.type}
                  onChange={(e) =>
                    setEditingMovie({ ...editingMovie, type: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="Movie">Movie</option>
                  <option value="TV Show">TV Show</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="edit-title">Title *</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editingMovie.title}
                    onChange={(e) =>
                      setEditingMovie({
                        ...editingMovie,
                        title: e.target.value,
                      })
                    }
                    style={{ ...inputStyle, flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingMovie.title.trim()) {
                        // Use custom alert modal
                        setAlertType("info");
                        setAlertTitle("Missing Title");
                        setAlertMessage(
                          "Please enter a movie title first before using Auto-Fill."
                        );
                        setShowAlertModal(true);
                        return;
                      }

                      try {
                        if (!editingMovie) return;

                        setLoading(true);

                        // Search for the movie or TV show
                        const type =
                          editingMovie.type === "TV Show" ? "tv" : "movie";
                        const searchResponse = await tmdbApi.searchByTitle(
                          editingMovie.title,
                          type
                        );

                        if (
                          !searchResponse.results ||
                          searchResponse.results.length === 0
                        ) {
                          alert("No results found for this title");
                          setLoading(false);
                          return;
                        }

                        // Always show the search results modal, even for a single result
                        setSearchResults(searchResponse.results);
                        setIsEditMode(true); // We're in Edit mode
                        setShowSearchResultsModal(true);
                        setLoading(false);

                        // Use custom success modal
                        setAlertType("success");
                        setAlertTitle("Auto-Fill Successful");
                        setAlertMessage(
                          "Movie information has been updated from TMDB!"
                        );
                        setShowAlertModal(true);
                      } catch (error) {
                        console.error("Error fetching movie data:", error);
                        alert("Failed to fetch movie data. Please try again.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      backgroundColor: "#4285F4",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 15px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Auto-Fill
                  </button>
                </div>
                <small
                  style={{
                    color: "#666",
                    fontSize: "0.8rem",
                    marginTop: "5px",
                    display: "block",
                  }}
                >
                  Click "Auto-Fill" to fetch updated movie information from
                  TMDB.
                </small>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="edit-releaseYear">Release Year</label>
                <input
                  type="number"
                  id="edit-releaseYear"
                  name="releaseYear"
                  value={editingMovie.releaseYear}
                  onChange={(e) =>
                    setEditingMovie({
                      ...editingMovie,
                      releaseYear: parseInt(e.target.value) || undefined,
                    })
                  }
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
                  value={editingMovie.director || ""}
                  onChange={(e) =>
                    setEditingMovie({
                      ...editingMovie,
                      director: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="edit-country">Country</label>
                <input
                  type="text"
                  id="edit-country"
                  name="country"
                  value={editingMovie.country || ""}
                  onChange={(e) =>
                    setEditingMovie({
                      ...editingMovie,
                      country: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={formGroupStyle}>
                  <label htmlFor="edit-rating">Rating</label>
                  <select
                    id="edit-rating"
                    name="rating"
                    value={editingMovie.rating || ""}
                    onChange={(e) =>
                      setEditingMovie({
                        ...editingMovie,
                        rating: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">Select a rating</option>
                    {editingMovie.type === "Movie" ? (
                      // Movie ratings
                      <>
                        <option value="G">G</option>
                        <option value="PG">PG</option>
                        <option value="PG-13">PG-13</option>
                        <option value="R">R</option>
                        <option value="NC-17">NC-17</option>
                        <option value="Not Rated">Not Rated</option>
                      </>
                    ) : (
                      // TV ratings
                      <>
                        <option value="TV-Y">TV-Y (All Children)</option>
                        <option value="TV-Y7">TV-Y7 (Older Children)</option>
                        <option value="TV-G">TV-G (General Audience)</option>
                        <option value="TV-PG">TV-PG (Parental Guidance)</option>
                        <option value="TV-14">
                          TV-14 (Parents Strongly Cautioned)
                        </option>
                        <option value="TV-MA">TV-MA (Mature Audience)</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label htmlFor="edit-duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="edit-duration"
                    name="duration"
                    value={parseDuration(editingMovie.duration || "") || ""}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value);
                      if (!isNaN(minutes)) {
                        setEditingMovie({
                          ...editingMovie,
                          duration: minutes.toString(),
                        });
                      } else {
                        setEditingMovie({
                          ...editingMovie,
                          duration: "",
                        });
                      }
                    }}
                    style={inputStyle}
                    min="1"
                    placeholder="Enter total minutes"
                  />
                  {editingMovie.duration &&
                    !isNaN(parseInt(editingMovie.duration)) && (
                      <small
                        style={{
                          color: "#666",
                          display: "block",
                          marginTop: "5px",
                        }}
                      >
                        Display format:{" "}
                        {formatDuration(parseInt(editingMovie.duration))}
                      </small>
                    )}
                </div>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingMovie.description || ""}
                  onChange={(e) =>
                    setEditingMovie({
                      ...editingMovie,
                      description: e.target.value,
                    })
                  }
                  style={textareaStyle}
                  rows={4}
                />
              </div>

              <div style={formGroupStyle}>
                <label>Movie Poster</label>

                {/* Poster Image Preview */}
                <div
                  style={{
                    marginBottom: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px",
                    backgroundColor: "#f9f9f9",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={
                      editingMovie.posterUrl ||
                      "https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster&font=montserrat"
                    }
                    alt="Movie Poster"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/320x480/2c3e50/FFFFFF?text=Invalid+Image+URL&font=montserrat";
                    }}
                  />

                  {/* Centered Update Poster Button */}
                  <div style={{ textAlign: "center", marginTop: "15px" }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMovie.title.trim()) {
                          // Use custom alert modal
                          setAlertType("info");
                          setAlertTitle("Missing Title");
                          setAlertMessage(
                            "Please enter a movie title first before updating the poster."
                          );
                          setShowAlertModal(true);
                          return;
                        }

                        try {
                          setLoading(true);

                          // Search more broadly for similar titles
                          const type =
                            editingMovie.type === "TV Show" ? "tv" : "movie";
                          // Store current type for pagination
                          setCurrentPosterType(type);
                          // Store current query for pagination
                          setCurrentPosterQuery(editingMovie.title);
                          // Reset to page 1 for new search
                          setPosterSearchPage(1);

                          // Do a search for similar titles
                          const response = await tmdbApi.searchByTitle(
                            editingMovie.title,
                            type
                          );

                          if (
                            !response.results ||
                            response.results.length === 0
                          ) {
                            alert("No matching titles found");
                            setLoading(false);
                            return;
                          }

                          // Store total pages for pagination
                          setPosterSearchTotalPages(response.total_pages || 1);

                          // Get all results with posters
                          const resultsWithPosters = response.results.filter(
                            (result) => result.poster_path
                          );

                          if (!resultsWithPosters.length) {
                            alert("No posters found for similar titles");
                            setLoading(false);
                            return;
                          }

                          // Always show the modal with multiple title options, even if there's just one
                          setPosterSearchResults(resultsWithPosters);
                          setPosterForEditMode(true); // We're in Edit mode
                          setShowPosterModal(true);
                        } catch (error) {
                          console.error("Error fetching posters:", error);
                          alert("Failed to fetch posters. Please try again.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        backgroundColor: "#4285F4",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 20px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      Update Poster
                    </button>
                  </div>
                </div>

                {/* Hidden posterUrl field */}
                <input
                  type="hidden"
                  id="edit-posterUrl"
                  name="posterUrl"
                  value={editingMovie.posterUrl || ""}
                  onChange={(e) =>
                    setEditingMovie({
                      ...editingMovie,
                      posterUrl: e.target.value,
                    })
                  }
                />
              </div>

              {/* Genre Selection Section */}
              <div style={formGroupStyle}>
                <h3
                  style={{
                    marginBottom: "15px",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "5px",
                  }}
                >
                  Genre Management
                </h3>

                {/* Current genres with separate fields */}
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                    Current Genres:
                  </p>

                  {/* Show all active genres for the movie */}
                  {getAllGenres(editingMovie).length > 0 ? (
                    <div>
                      {getAllGenres(editingMovie).map((genre, index) => {
                        // Find the key in genreMapping that matches this genre
                        const genreKey =
                          Object.entries(genreMapping).find(
                            ([val]) => val === genre
                          )?.[0] || "";

                        return (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: "8px",
                              backgroundColor: "#f9f9f9",
                              padding: "8px",
                              borderRadius: "4px",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <label
                                htmlFor={`edit-genre-${index + 1}`}
                                style={{
                                  display: "block",
                                  marginBottom: "3px",
                                  fontSize: "0.9rem",
                                }}
                              >
                                Genre {index + 1}
                              </label>
                              <input
                                type="text"
                                id={`edit-genre-${index + 1}`}
                                value={genre}
                                readOnly
                                style={{
                                  ...inputStyle,
                                  backgroundColor: "#f2f2f2",
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGenre(genreKey)}
                              style={{
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "8px 12px",
                                marginLeft: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontStyle: "italic",
                        color: "#888",
                        marginBottom: "15px",
                      }}
                    >
                      No genres assigned
                    </p>
                  )}
                </div>

                {/* Add new genre section */}
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                    Add New Genre:
                  </p>

                  {/* Movie genres - only show if type is Movie or not specified */}
                  {(!editingMovie.type || editingMovie.type === "Movie") && (
                    <div style={formGroupStyle}>
                      <label htmlFor="edit-movie-genre">Add Movie Genre</label>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <select
                          id="edit-movie-genre"
                          value=""
                          onChange={(e) =>
                            handleAddGenre(e.target.value, "movie")
                          }
                          style={{ ...inputStyle, flex: 1 }}
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
                          <option value="DramasRomanticMovies">
                            Romantic Drama
                          </option>
                          <option value="ComediesRomanticMovies">
                            Romantic Comedy
                          </option>
                          <option value="DocumentariesInternationalMovies">
                            International Documentary
                          </option>
                          <option value="DramasInternationalMovies">
                            International Drama
                          </option>
                          <option value="ComediesInternationalMovies">
                            International Comedy
                          </option>
                          <option value="InternationalMoviesThrillers">
                            International Thriller
                          </option>
                          <option value="ComediesDramasInternationalMovies">
                            International Comedy-Drama
                          </option>

                          {/* Add Spirituality as it can be for both movies and TV shows */}
                          <option value="Spirituality">Spirituality</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TV Show genres - only show if type is TV Show */}
                  {editingMovie.type === "TV Show" && (
                    <div style={formGroupStyle}>
                      <label htmlFor="edit-tv-genre">Add TV Show Genre</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <select
                          id="edit-tv-genre"
                          value=""
                          onChange={(e) => handleAddGenre(e.target.value, "tv")}
                          style={{ ...inputStyle, flex: 1 }}
                        >
                          <option value="">Select a genre to add</option>
                          {/* TV Show genres */}
                          <option value="TVAction">Action</option>
                          <option value="TVComedies">Comedy</option>
                          <option value="TVDramas">Drama</option>
                          <option value="Docuseries">Docuseries</option>
                          <option value="KidsTV">Kids</option>
                          <option value="RealityTV">Reality</option>
                          <option value="TalkShowsTVComedies">
                            Talk Shows
                          </option>
                          <option value="AnimeSeriesInternationalTVShows">
                            Anime
                          </option>
                          <option value="BritishTVShowsDocuseriesInternationalTVShows">
                            British
                          </option>
                          <option value="InternationalTVShowsRomanticTVShowsTVDramas">
                            International Drama
                          </option>
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
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
  backgroundColor: "#f5f7fa",
  padding: "14px 16px",
  textAlign: "left",
  borderBottom: "2px solid #e0e4e8",
  color: "#2c3e50",
  fontWeight: "600",
  fontSize: "0.95rem",
  whiteSpace: "nowrap",
};

const tableCellStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #d1d8e0",
  fontSize: "0.95rem",
  color: "#34495e",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  maxWidth: "600px",
  width: "90%",
  maxHeight: "90vh",
  overflowY: "auto",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "15px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
  resize: "vertical",
};

export default AdminMoviesPage;
