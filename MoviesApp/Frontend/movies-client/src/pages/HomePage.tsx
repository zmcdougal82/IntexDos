import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeRecommender from "../components/HomeRecommender";

const HomePage = () => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && typeof userData === "object" && userData.id) {
          setUser(userData.id);
        } else {
          setUser(userData);
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="container">
      {/* Home Page Promo */}
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: "1585px", height: "60vh" }}>
          <iframe
            src="/scrolling.html"
            title="Movies Scrolling Home"
            scrolling="no"
            style={{
              border: "none",
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              padding: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "5.5rem",
                fontWeight: 700,
                color: "var(--color-white)",
                textAlign: "center",
                marginBottom: "2rem",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              Welcome to CineNiche!
            </h1>

            {!user && (
              <div style={{ display: "flex", gap: "30px", marginTop: "1rem" }}>
                <button
                  onClick={handleLogin}
                  style={{
                    padding: "1rem 2.5rem",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    border: "2px solid white",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                  }}
                >
                  LOG IN
                </button>
                <button
                  onClick={handleRegister}
                  style={{
                    padding: "1rem 2.5rem",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    border: "2px solid white",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                  }}
                >
                  REGISTER
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!user && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              marginTop: "3rem",
            }}
          >
            <h3
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                textAlign: "center",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              About CineNiche
            </h3>
            <p>
              At CineNiche, we believe in bringing you the best movie and TV
              show experiences. Explore thousands of options, discover hidden
              gems, and enjoy recommendations based on your preferences. Let us
              help you find your next favorite!
            </p>
          </div>
        )}

        {user && (
          <div>
            <HomeRecommender userId={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
