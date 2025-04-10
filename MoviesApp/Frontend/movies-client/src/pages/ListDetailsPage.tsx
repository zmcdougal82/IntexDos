import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Breadcrumb } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MovieList, Movie, movieListApi } from '../services/api';

const ListDetailsPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<MovieList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) return;

      try {
        setLoading(true);
        const response = await movieListApi.getListById(parseInt(listId, 10));
        setList(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching list details:', err);
        setError('Failed to load list details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId]);

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
      console.error('Error removing movie from list:', err);
      setError('Failed to remove movie from list. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <h1>Loading list...</h1>
      </Container>
    );
  }

  if (error || !list) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'List not found'}</Alert>
        <Button variant="primary" onClick={() => navigate('/lists')}>
          Back to My Lists
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/lists' }}>
          My Lists
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
        <Button variant="outline-primary" onClick={() => navigate('/movies')}>
          Add Movies
        </Button>
      </div>

      {list.items && list.items.length > 0 ? (
        <Row xs={2} md={3} lg={4} className="g-4">
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
                    {item.movie?.releaseYear || 'Unknown year'}
                  </Card.Text>
                  <div className="mt-auto d-flex justify-content-between">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/movies/${item.showId}`)}
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
          <h3>This list is empty</h3>
          <p>Start adding movies to build your collection!</p>
          <Button variant="primary" onClick={() => navigate('/movies')}>
            Browse Movies
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ListDetailsPage;
