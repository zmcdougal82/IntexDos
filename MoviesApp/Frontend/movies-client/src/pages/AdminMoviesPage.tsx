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
  Action?: number;
  Adventure?: number;
  Comedies?: number;
  Dramas?: number;
  HorrorMovies?: number;
  Thrillers?: number;
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

  // Fetch movies on page/size change
  useEffect(() => {
    const fetchMovies = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await movieApi.getAll(currentPage, pageSize);
        setMovies(response.data);
        
        // In a real app, the API would return total count for pagination
        // Here we're just approximating
        setTotalMovies(currentPage * pageSize + (response.data.length === pageSize ? pageSize : 0));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage, pageSize, user]);

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
      
      // In a real app, you would have an API endpoint to create a movie
      // Here we're just simulating it
      alert('In a production app, this would create a new movie with the provided data');
      
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
      
      // In a real app, you would have an API endpoint to update a movie
      // Here we're just simulating it
      alert(`In a production app, this would update movie ID: ${editingMovie.showId}`);
      
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
      
      // In a real app, you would have an API endpoint to delete a movie
      // Here we're just simulating it
      alert(`In a production app, this would delete movie ID: ${movieId}`);
      
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

  const startEdit = (movie: Movie) => {
    setEditingMovie({
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
      posterUrl: movie.posterUrl
    });
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
            marginBottom: 'var(--spacing-lg)'
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
                      <th style={tableHeaderStyle}>ID</th>
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
                        <td style={tableCellStyle}>{movie.showId}</td>
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
              <div style={formGroupStyle}>
                <label htmlFor="showId">Movie ID *</label>
                <input
                  type="text"
                  id="showId"
                  name="showId"
                  value={formData.showId}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
              
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
              
              <h3>Genres</h3>
              <div style={checkboxGroupStyle}>
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="Action"
                    name="Action"
                    checked={formData.Action === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="Action">Action</label>
                </div>
                
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="Adventure"
                    name="Adventure"
                    checked={formData.Adventure === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="Adventure">Adventure</label>
                </div>
                
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="Comedies"
                    name="Comedies"
                    checked={formData.Comedies === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="Comedies">Comedy</label>
                </div>
                
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="Dramas"
                    name="Dramas"
                    checked={formData.Dramas === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="Dramas">Drama</label>
                </div>
                
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="HorrorMovies"
                    name="HorrorMovies"
                    checked={formData.HorrorMovies === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="HorrorMovies">Horror</label>
                </div>
                
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="Thrillers"
                    name="Thrillers"
                    checked={formData.Thrillers === 1}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="Thrillers">Thriller</label>
                </div>
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
