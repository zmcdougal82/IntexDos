import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { MovieList, movieListApi } from '../services/api';

const ListsPage: React.FC = () => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<MovieList | null>(null);
  const navigate = useNavigate();

  // Form state
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(false);

  // Fetch all lists for the current user
  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await movieListApi.getMyLists();
      setLists(response.data);
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
  const handleCreateList = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setShowDeleteModal(false);
      setListToDelete(null);
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list. Please try again.');
    }
  };

  // Confirm delete modal
  const confirmDelete = (list: MovieList) => {
    setListToDelete(list);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <h1>My Movie Lists</h1>
        <p>Loading your lists...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Movie Lists</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Create New List
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {lists.length === 0 ? (
        <div className="text-center py-5">
          <h3>You don't have any movie lists yet</h3>
          <p>Create your first list to start organizing your favorite movies!</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create a List
          </Button>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {lists.map(list => (
            <Col key={list.listId}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{list.name}</Card.Title>
                  {list.description && <Card.Text>{list.description}</Card.Text>}
                  <Card.Text>
                    <small className="text-muted">
                      Created: {new Date(list.createdDate).toLocaleDateString()}
                    </small>
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/lists/${list.listId}`)}
                    >
                      View List
                    </Button>
                    <Button 
                      variant="outline-danger"
                      onClick={() => confirmDelete(list)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create List Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New List</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateList}>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>List Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="E.g., Matthew McConaughey Movies"
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add a description for your list"
                value={newListDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewListDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this list public"
                checked={newListIsPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListIsPublic(e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create List
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the list "{listToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteList}>
            Delete List
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ListsPage;
