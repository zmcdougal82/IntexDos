import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useParams, useNavigate } from 'react-router-dom';
import { MovieList, movieListApi } from '../services/api';

const ListDetailsPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<MovieList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) return;

      try {
        setLoading(true);
        const response = await movieListApi.getListById(parseInt(listId, 10));
        setList(response.data);
        
        // Initialize edit form with current values
        setEditName(response.data.name || '');
        setEditDescription(response.data.description || '');
        setEditIsPublic(response.data.isPublic || false);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching list details:', err);
        setError('Failed to load collection details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId]);
  
  // Function to open the edit modal
  const openEditModal = () => {
    if (list) {
      setEditName(list.name);
      setEditDescription(list.description || '');
      setEditIsPublic(list.isPublic);
      setUpdateError(null);
      setShowEditModal(true);
    }
  };
  
  // Handle edit form submission
  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listId || !list) return;
    
    if (!editName.trim()) {
      setUpdateError('Collection name is required');
      return;
    }
    
    try {
      await movieListApi.updateList(
        parseInt(listId, 10), 
        {
          name: editName,
          description: editDescription || undefined,
          isPublic: editIsPublic
        }
      );
      
      // Update local state with new values
      setList({
        ...list,
        name: editName,
        description: editDescription,
        isPublic: editIsPublic
      });
      
      // Close the modal
      setShowEditModal(false);
      setUpdateError(null);
    } catch (err) {
      console.error('Error updating collection:', err);
      setUpdateError('Failed to update collection. Please try again.');
    }
  };

  const handleRemoveMovie = async (showId: string) => {
    if (!listId || !list) return;

    try {
      await movieListApi.removeMovieFromList(parseInt(listId, 10), showId);
      // Update the list in state by removing the movie
      setList({
        ...list,
        items: list.items?.filter(item => item.showId !== showId) || []
      });
    } catch (err) {
      console.error('Error removing movie from collection:', err);
      setError('Failed to remove movie from collection. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <h1>Loading collection...</h1>
      </Container>
    );
  }

  if (error || !list) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Collection not found'}</Alert>
        <Button onClick={() => navigate('/lists')}>
          Back to My Collections
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item href="/lists" onClick={(e) => { e.preventDefault(); navigate('/lists'); }}>
          My Collections
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{list.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>{list.name}</h1>
          {list.description && <p className="text-muted">{list.description}</p>}
          <p className="small text-muted">
            Created: {new Date(list.createdDate).toLocaleDateString()}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={openEditModal}
          >
            Edit Collection
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/movies')}
          >
            Add Movies
          </Button>
        </div>
      </div>

      {list.items && list.items.length > 0 ? (
        <Row className="g-4 row-cols-2 row-cols-md-3 row-cols-lg-4">
          {list.items.map(item => (
            <Col key={item.showId}>
              <Card className="h-100">
                {item.movie?.posterUrl && (
                  <Card.Img
                    variant="top"
                    src={item.movie.posterUrl}
                    alt={`${item.movie.title} poster`}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title as="h5" className="mb-2">
                    {item.movie?.title || 'Unknown Movie'}
                  </Card.Title>
                  <Card.Text className="small text-muted">
                    {item.movie?.releaseYear ? item.movie.releaseYear.toString() : 'Unknown year'}
                  </Card.Text>
                  <div className="mt-auto d-flex justify-content-between">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/movie/${item.showId}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveMovie(item.showId)}
                    >
                      Remove
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <h3>This collection is empty</h3>
          <p>Start adding movies to build your collection!</p>
          <Button onClick={() => navigate('/movies')}>
            Browse Movies
          </Button>
        </div>
      )}

      {/* Edit Collection Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Collection</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateList}>
          <Modal.Body>
            {updateError && (
              <Alert variant="danger">{updateError}</Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Collection Name</Form.Label>
              <Form.Control
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this collection public"
                checked={editIsPublic}
                onChange={(e) => setEditIsPublic(e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ListDetailsPage;
