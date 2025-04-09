import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import { User, isAdmin } from '../services/api'; // make sure interfaces are imported correctly
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal';


const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  type EditableUser = Omit<User, 'id' | 'userId'>;
  const [editData, setEditData] = useState<EditableUser | null>(null);
  const [isModalOpen, setModalOpen] = useState(false); // modal visibility state

  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchUser = async () => {
      const storedUserId = localStorage.getItem('userId'); // or 'user' if you're storing full object

      if (!storedUserId) {
        navigate('/login', { state: { from: '/profile' } });
        return;
      }

      try {
        const response = await userApi.getById(storedUserId);
        setUser(response.data); // assuming you're using Axios (which returns `.data`)
        setEditData(response.data); // populate editData as well
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigate('/login', { state: { from: '/profile' } });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData(user); // prepopulate form with current data
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev!, [name]: value }));
  };

  const handleStreamingServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditData(prev => ({
      ...prev!,
      [name]: checked ? 1 : 0, // Store 1 for selected, 0 for unselected
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user); // reset form to original data
  };

  const handleSubmitChanges = async () => {
    try {
      // Check if we have the edit data and user ID
      if (!user || !user.userId) {
        console.error("User data is missing required fields.");
        return;
      }
  
      console.log("Updating user with data:", editData);
  
      // Prepare the data to be sent in the API call
      const updatedUser: Partial<User> = {
        ...editData,
        id: user.id,
        userId: user.userId
      };
      var currentUserId = String(user.userId);
  
      // Send the update request to the API
      const response = await userApi.update(currentUserId, updatedUser);
      console.log("API response:", response);
  
      // If the response status is 200, update the user state
      if (response.status === 200 || response.status === 204) {
        console.log("Profile successfully updated");
        setUser((prev) => prev ? { ...prev, ...editData! } : null);
        // Update the user state with the new data
        setIsEditing(false); // Close the edit form
      } else {
        console.error("Failed to update user, received response:", response);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      // If the error is an HTTP error, log it for better debugging
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response);
      }
    }
  };
  
  const handleDelete = async () => {
    setModalOpen(true); // open the modal when delete is clicked
  };

  const cancelDelete = async () => {
    setModalOpen(false); // open the modal when delete is clicked
  };

  const handleConfirmDelete = async () => {
    if (!user || !user.userId) {
      console.error("User data is missing required fields.");
      return;
    }

    const currentUserId = String(user.userId);

    try {
      const response = await userApi.delete(currentUserId);
      if (response.status === 200 || response.status === 204) {
        console.log("Profile successfully deleted");
        localStorage.removeItem('userId');
        setUser(null);
        window.location.href = '/login'; // Redirect to login page after successful deletion
        window.location.reload();
      } else {
        console.error("Failed to delete user, received response:", response);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response);
      }
    }
    
    localStorage.removeItem('userId'); //remove the current saved userId
    setModalOpen(false); // close the modal after confirming
  };
  
  if (loading) {
    return <div className="container mt-4">Loading profile...</div>;
  }

  if (!user) {
    return <div className="container mt-4">User not found.</div>;
  }

  const streamingServices = [
    { id: 'netflix', name: 'Netflix', value: editData?.netflix },
    { id: 'amazonPrime', name: 'Amazon Prime', value: editData?.amazonPrime },
    { id: 'disneyPlus', name: 'Disney+', value: editData?.disneyPlus },
    { id: 'paramountPlus', name: 'Paramount+', value: editData?.paramountPlus },
    { id: 'max', name: 'Max', value: editData?.max },
    { id: 'hulu', name: 'Hulu', value: editData?.hulu },
    { id: 'appleTVPlus', name: 'Apple TV+', value: editData?.appleTVPlus },
    { id: 'peacock', name: 'Peacock', value: editData?.peacock }
  ];

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-lg)' }}>
          My Profile
        </h1>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
            {/* Profile picture/avatar */}
            <div style={{ flexBasis: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-text)' }}>
                  {user.name}
                </div>

                {user.role && (
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: isAdmin(user) ? '#1d4ed8' : 'var(--color-secondary)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginTop: 'var(--spacing-xs)'
                  }}>
                    {user.role}
                  </div>
                )}
              </div>

              <div style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginTop: 'var(--spacing-xs)'
                  }}>
                    {/* Smaller Edit button underneath profile role */}
                    <button onClick={handleEditClick} style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.875rem', // smaller size
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                    Edit Profile
                    </button>
              </div>

              <div style={{
                    display: 'inline-block',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {/* Smaller Delete button underneath Edit button */}
                    <button onClick={handleDelete} style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.875rem', // smaller size
                      borderRadius: 'var(--radius-sm)', 
                      backgroundColor: '#8B0000'
                    }}>
                    Delete Profile
                    </button>

                    {/* Confirmation Modal */}
                    <ConfirmationModal 
                      isOpen={isModalOpen}
                      onConfirm={handleConfirmDelete}
                      onCancel={cancelDelete}
                    />

              </div>

            </div>

            {/* Profile details */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ color: 'var(--color-text)', fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>
                Account Information
              </h2>

              <div className="card" style={{ backgroundColor: 'var(--color-background)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                      Email
                    </div>
                    <div>{user.email}</div>
                  </div>

                  {user.age && (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                        Age
                      </div>
                      <div>{user.age}</div>
                    </div>
                  )}

                  {user.gender && (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                        Gender
                      </div>
                      <div>{user.gender}</div>
                    </div>
                  )}

                  {(user.city || user.state || user.zip) && (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                        Location
                      </div>
                      <div>
                        {[user.city, user.state, user.zip].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h2 style={{ 
                  color: 'var(--color-text)',
                  fontSize: '1.5rem',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  Streaming Services
                </h2>
                
                <div className="card" style={{ 
                  backgroundColor: 'var(--color-background)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                  }}>
                    {[
                      { key: 'netflix', name: 'Netflix' },
                      { key: 'amazonPrime', name: 'Amazon Prime' },
                      { key: 'disneyPlus', name: 'Disney+' },
                      { key: 'paramountPlus', name: 'Paramount+' },
                      { key: 'max', name: 'Max' },
                      { key: 'hulu', name: 'Hulu' },
                      { key: 'appleTVPlus', name: 'Apple TV+' },
                      { key: 'peacock', name: 'Peacock' }
                    ].map(service => (
                      <div 
                        key={service.key} 
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-md)',
                          backgroundColor: user[service.key as keyof User] === 1 ? 'var(--color-primary)' : 'var(--color-border)',
                          color: user[service.key as keyof User] === 1 ? 'white' : 'var(--color-text-light)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.9rem'
                        }}
                      >
                        {service.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/*  */}

              {/* Show Edit Form */}
              {isEditing && (
                <div
                  className="edit-form"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '2rem',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 9999,
                    width: '80%',
                    maxWidth: '500px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                  }}
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      color: 'var(--color-text-light)',
                    }}
                  >
                    X
                  </button>

                  <h3>Edit Your Profile</h3>

                  <form>
                    {/* Name */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData?.name || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editData?.email || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Age */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Age</label>
                      <input
                        type="number"
                        name="age"
                        value={editData?.age || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Gender */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Gender</label>
                      <input
                        type="text"
                        name="gender"
                        value={editData?.gender || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Location */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Location</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          name="city"
                          value={editData?.city || ''}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                        <input
                          type="text"
                          name="state"
                          value={editData?.state || ''}
                          onChange={handleInputChange}
                          placeholder="State"
                        />
                        <input
                          type="text"
                          name="zip"
                          value={editData?.zip || ''}
                          onChange={handleInputChange}
                          placeholder="Zip"
                        />
                      </div>
                    </div>

                    {/* Streaming Services */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label>Streaming Services</label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 'var(--spacing-sm)',
                        }}
                      >
                        {streamingServices.map((service) => (
                          <div
                            key={service.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: 'var(--spacing-sm)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                id={service.id}
                                name={service.id}
                                checked={!!(editData && editData[service.id as keyof EditableUser])}
                                onChange={handleStreamingServiceChange}
                                style={{ marginRight: 'var(--spacing-sm)' }}
                              />
                            </div>
                            <div>{service.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                          padding: 'var(--spacing-sm)',
                          backgroundColor: 'var(--color-border)',
                          color: 'white',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitChanges}
                        style={{
                          padding: 'var(--spacing-sm)',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Submit Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}


              {/*  */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ProfilePage;