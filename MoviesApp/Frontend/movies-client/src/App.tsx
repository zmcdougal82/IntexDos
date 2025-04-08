import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import AdminMoviesPage from './pages/AdminMoviesPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin/movies" element={<AdminMoviesPage />} />
          </Routes>
        </main>
        <footer style={{ 
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          marginTop: 'auto',
          backgroundColor: 'white'
        }}>
          <p>&copy; {new Date().getFullYear()} Movies App. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
