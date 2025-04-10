import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, Form, Alert } from 'react-bootstrap';
import { MovieList, movieListApi } from '../services/api';

interface AddToListButtonProps {
  showId: string;
  buttonVariant?: string;
  buttonSize?: 'sm' | 'lg' | undefined;
  className?: string;
}

const AddToListButton: React.FC<AddToListButtonProps> = ({
  showId,
  buttonVariant = 'primary',
  buttonSize,
  className
}) => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for creating a new list
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Fetch user's lists
  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoading(true);
        const response = await movieListApi.getMyLists();
        setLists(response.data);
      } catch (err) {
        console.error('Error fetching lists:', err);
        setError('Failed to load your lists');
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  // Handle adding movie to a list
  const handleAddToList = async (listId: number) => {
    try {
      await movieListApi.addMovieToList(listId, showId);
      setSuccessMessage(`Movie added to list successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding movie to list:', err);
      setError('Failed to add movie to list');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Handle creating a new list and adding the movie to it
  const handleCreateList = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newListName.trim()) {
      setError('List name is required');
      return;
    }

    try {
      // Create new list
      const response = await movieListApi.createList({
        name: newListName,
        description: newListDescription || undefined
      });
      
      // Add movie to the newly created list
      await movieListApi.addMovieToList(response.data.listId, showId);
      
      // Update lists
      setLists([...lists, response.data]);
      
      // Reset form and close modal
      setNewListName('');
      setNewListDescription('');
      setShowCreateModal(false);
      
      // Show success message
      setSuccessMessage(`Movie added to new list "${newListName}"!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Failed to create list and add movie');
    }
  };

  return (
    <div className={className}>
      {/* Success/error messages */}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Dropdown>
        <Dropdown.Toggle variant={buttonVariant} size={buttonSize} id="dropdown-lists">
          Add to List
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {loading ? (
            <Dropdown.Item disabled>Loading lists...</Dropdown.Item>
          ) : lists.length > 0 ? (
            <>
              {lists.map(list => (
                <Dropdown.Item 
                  key={list.listId} 
                  onClick={() => handleAddToList(list.listId)}
                >
                  {list.name}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
            </>
          ) : (
            <Dropdown.Item disabled>No lists found</Dropdown.Item>
          )}
          <Dropdown.Item onClick={() => setShowCreateModal(true)}>
            <strong>Create New List</strong>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Create List Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New List</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateList}>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create List & Add Movie
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AddToListButton;
