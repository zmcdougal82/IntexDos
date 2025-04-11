import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { MovieList, movieListApi } from '../services/api';
import ListCard from '../components/ListCard';

// Import CSS
import './ListsPage.css';
import '../components/ListCard.css';

const ListsPage: React.FC = () => {
  // State hooks
  const [lists, setLists] = useState<MovieList[]>([]);
  const [recentLists, setRecentLists] = useState<MovieList[]>([]);
  const [popularLists, setPopularLists] = useState<MovieList[]>([]);
  const [communityLists, setCommunityLists] = useState<MovieList[]>([]);
  const [curatedLists, setCuratedLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<MovieList | null>(null);

  // Form state
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(false);

  // Fetch lists data
  const fetchLists = async () => {
    try {
      setLoading(true);
      
      // Fetch my lists
      const myListsResponse = await movieListApi.getMyLists();
      const allLists = myListsResponse.data;
      
      // Sort lists by creation date (newest first)
      const sortedLists = [...allLists].sort((a, b) => 
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
      
      setLists(allLists);
      
      // Get recent lists (5 most recent)
      setRecentLists(sortedLists.slice(0, 5));
      
      // For demo purposes, use the same lists but sorted differently for "popular"
      // In a real app, you would sort by view count or likes
      setPopularLists(
        [...allLists].sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0)).slice(0, 5)
      );
      
      // Fetch community lists (public lists from other users)
      try {
        const communityResponse = await movieListApi.getPublicLists();
        setCommunityLists(communityResponse.data);
      } catch (communityErr) {
        console.error('Error fetching community lists:', communityErr);
        // Don't set the main error - just log this one
      }
      
      // Fetch curated collections (recommendation-based lists)
      try {
        const curatedResponse = await movieListApi.getCuratedLists();
        setCuratedLists(curatedResponse.data);
      } catch (curatedErr) {
        console.error('Error fetching curated collections:', curatedErr);
        // Don't set the main error - just log this one
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to load your lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Handle create list form submission
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      setCreateError('List name is required');
      return;
    }

    try {
      await movieListApi.createList({
        name: newListName,
        description: newListDescription || undefined,
        isPublic: newListIsPublic
      });
      
      // Reset form and close modal
      setNewListName('');
      setNewListDescription('');
      setNewListIsPublic(false);
      setShowCreateModal(false);
      setCreateError(null);
      
      // Refresh lists
      fetchLists();
    } catch (err) {
      console.error('Error creating list:', err);
      setCreateError('Failed to create list. Please try again.');
    }
  };

  // Handle delete list confirmation
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      await movieListApi.deleteList(listToDelete.listId);
      setLists(lists.filter(list => list.listId !== listToDelete.listId));
      setRecentLists(recentLists.filter(list => list.listId !== listToDelete.listId));
      setPopularLists(popularLists.filter(list => list.listId !== listToDelete.listId));
      setShowDeleteModal(false);
      setListToDelete(null);
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list. Please try again.');
    }
  };

  // Delete functionality has been removed from the UI

  if (loading) {
    return (
      <div className="lists-page">
        <Container>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <h2>Loading your lists...</h2>
              <div className="spinner-border text-light mt-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="lists-page">
      {/* Header Section */}
      <div className="lists-header">
        <Container>
          <h1>Movie Lists</h1>
          <p>Collect, curate, and share. Lists are the perfect way to group films.</p>
        </Container>
      </div>

      <Container>
        {error && <Alert variant="danger">{error}</Alert>}

        {lists.length === 0 ? (
          <div className="empty-list-container">
            <h3>You don't have any movie lists yet</h3>
            <p>Create your first list to start organizing your favorite movies!</p>
            <button onClick={() => setShowCreateModal(true)}>
              Create a List
            </button>
          </div>
        ) : (
          <>
            {/* Recent Lists Section */}
            {recentLists.length > 0 && (
              <div className="lists-section">
                <h2 className="section-title">Recent Lists</h2>
                <div className="lists-grid">
                  {recentLists.map(list => (
                    <ListCard 
                      key={list.listId} 
                      list={list}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Popular Lists Section */}
            {popularLists.length > 0 && (
              <div className="lists-section">
                <h2 className="section-title">Popular Lists</h2>
                <div className="lists-grid">
                  {popularLists.map(list => (
                    <ListCard 
                      key={list.listId} 
                      list={list}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Community Lists Section */}
            {communityLists.length > 0 && (
              <div className="lists-section">
                <h2 className="section-title">Community Lists</h2>
                <div className="lists-grid">
                  {communityLists.map(list => (
                    <ListCard 
                      key={list.listId} 
                      list={list}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Curated Collections Section */}
            {curatedLists.length > 0 && (
              <div className="lists-section">
                <h2 className="section-title">Curated Collections</h2>
                <div className="lists-grid">
                  {curatedLists.map(list => (
                    <ListCard 
                      key={list.listId} 
                      list={list}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Lists Section */}
            <div className="lists-section">
              <h2 className="section-title">My Lists</h2>
              <div className="lists-grid">
                {lists.map(list => (
                  <ListCard 
                    key={list.listId} 
                    list={list}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Floating Action Button */}
        <button 
          className="create-list-btn" 
          onClick={() => setShowCreateModal(true)}
          aria-label="Create new list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </Container>

      {/* Create List Modal */}
      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        centered
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New List</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e: React.FormEvent) => handleCreateList(e)}>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <div className="mb-3">
              <Form.Label>List Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="E.g., Best Science Fiction Films"
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add a description for your list"
                value={newListDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewListDescription(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this list public"
                checked={newListIsPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListIsPublic(e.target.checked)}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              className="btn-letterboxd-outline"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="btn-letterboxd-green"
            >
              Create List
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the list "{listToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            className="btn-letterboxd-outline"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteList}
            className="btn-letterboxd-danger"
          >
            Delete List
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ListsPage;
