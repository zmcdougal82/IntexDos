import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MovieList } from '../services/api';

interface ListCardProps {
  list: MovieList;
  onDelete: (list: MovieList) => void;
}

const ListCard: React.FC<ListCardProps> = ({ list, onDelete }) => {
  const navigate = useNavigate();
  
  // Get up to 4 movie posters from the list items (if available)
  let posterUrls: string[] = [];
  
  if (list.items && list.items.length > 0) {
    // Debug the raw list items
    console.log(`List "${list.name}" raw items:`, list.items);
    
    // Check if each item has a movie with posterUrl
    list.items.forEach((item, index) => {
      console.log(`Item ${index} has movie:`, !!item.movie, 
                 "has posterUrl:", item.movie ? !!item.movie.posterUrl : false,
                 "posterUrl value:", item.movie?.posterUrl);
    });
    
    // Clone the items array to avoid modifying the original
    posterUrls = [...list.items]
      // Filter only items with movies that have posterUrls FIRST
      .filter(item => item.movie && item.movie.posterUrl)
      // THEN sort by dateAdded (oldest first - to get the first 4 films added)
      .sort((a, b) => {
        if (!a.dateAdded || !b.dateAdded) return 0;
        return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      })
      // Map to the poster URLs
      .map(item => item.movie!.posterUrl!)
      // Take only the first 4
      .slice(0, 4);
      
    console.log(`List "${list.name}" showing the first ${posterUrls.length} added films:`, posterUrls);
  }
  
  // If we don't have 4 posters, fill with placeholders
  const placeholderUrl = `https://placehold.co/320x480/2c3e50/FFFFFF?text=No+Poster&font=montserrat`;
  while (posterUrls.length < 4) {
    posterUrls.push(placeholderUrl);
  }

  return (
    <div 
      className="list-card"
      onClick={() => navigate(`/lists/${list.listId}`)}
    >
      <div className="list-card-posters">
        {posterUrls.map((url, index) => (
          <div key={index} className={`poster poster-${index + 1}`}>
            <img src={url} alt={`Movie poster ${index + 1}`} />
          </div>
        ))}
      </div>
      
      <div className="list-card-content">
        <h3 className="list-title">{list.name}</h3>
        {list.description && (
          <p className="list-description">{list.description}</p>
        )}
        <div className="list-meta">
          <span className="list-date">
            {new Date(list.createdDate).toLocaleDateString()}
          </span>
          <span className="list-count">
            {list.items?.length || 0} films
          </span>
        </div>
      </div>
      
      <button 
        className="list-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(list);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
  );
};

export default ListCard;
