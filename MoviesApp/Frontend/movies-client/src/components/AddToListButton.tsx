import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
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
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');
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

    // Fetch lists when modal is opened
    if (showModal) {
      fetchLists();
    }
  }, [showModal]);

  // Handle adding movie to a list
  const handleAddToList = async (listId: number) => {
    try {
      await movieListApi.addMovieToList(listId, showId);
      setSuccessMessage(`Movie added to list successfully!`);
      setShowModal(false);
      
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
      setShowModal(false);
      
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

      {/* Main button to open modal */}
      <Button 
        variant={buttonVariant} 
        size={buttonSize} 
        onClick={() => setShowModal(true)}
        className="w-100"
      >
        Add to List
      </Button>

      {/* Combined Modal with Tabs for List Selection and Creation */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add to List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="existing">Select Existing List</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="create">Create New List</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              {/* Existing Lists Tab */}
              <Tab.Pane eventKey="existing">
                {loading ? (
                  <p className="text-center py-3">Loading your lists...</p>
                ) : (
                  <>
                    {lists.length > 0 ? (
                      <ListGroup className="my-3">
                        {lists.map(list => (
                          <ListGroup.Item 
                            key={list.listId}
                            action
                            onClick={() => handleAddToList(list.listId)}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-bold">{list.name}</div>
                              {list.description && (
                                <small className="text-muted">{list.description}</small>
                              )}
                            </div>
                            <Button variant="outline-primary" size="sm">Add</Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted mb-3">You haven't created any lists yet.</p>
                        <Button 
                          variant="primary" 
                          onClick={() => setActiveTab('create')}
                        >
                          Create Your First List
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Tab.Pane>
              
              {/* Create New List Tab */}
              <Tab.Pane eventKey="create">
                <Form onSubmit={(e: React.FormEvent) => handleCreateList(e as React.FormEvent<HTMLFormElement>)}>
                  <Form.Group className="mb-3">
                    <Form.Label>List Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="E.g., Oscar Winners 2024"
                      value={newListName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
                      required
                      autoFocus
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
                  <div className="d-flex justify-content-end mt-4">
                    <Button variant="primary" type="submit">
                      Create List & Add Movie
                    </Button>
                  </div>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AddToListButton;
