import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import MoviesPage from "./pages/MoviesPage";
import TVShowsPage from "./pages/TVShowsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdminMoviesPage from "./pages/AdminMoviesPage";
import ProfilePage from "./pages/ProfilePage";
import WatchlistPage from "./pages/WatchlistPage";
import RatingsPage from "./pages/RatingsPage";
import Navbar from "./components/Navbar";
import CookieConsentBanner from "./components/CookieConsentBanner";

function App() {

  return (
    <Router>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <CookieConsentBanner /> {/* Show this only on the homepage */}
                  <HomePage />
                </>
              }
            />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/tvshows" element={<TVShowsPage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin/movies" element={<AdminMoviesPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
          </Routes>
        </main>
        <footer
          style={{
            padding: "var(--spacing-lg)",
            textAlign: "center",
            borderTop: "1px solid var(--color-border)",
            marginTop: "auto",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-light)",
          }}
        >
          <div>
            <p>
              &copy; {new Date().getFullYear()} CineNiche. All rights reserved.
            </p>
            <div style={{ marginTop: "var(--spacing-sm)" }}>
              <Link
                to="/privacy"
                style={{
                  color: "var(--color-text-light)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
