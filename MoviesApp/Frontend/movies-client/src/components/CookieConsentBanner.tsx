import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import "./CookieConsentBanner.css";

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Check if the banner has been dismissed before
  useEffect(() => {
    if (localStorage.getItem("cookie-consent-dismissed")) {
      setVisible(false);
    }
  }, []);

  // Handle closing the banner
  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("cookie-consent-dismissed", "true"); // Optional: stores the user's action
  };

  // Handle the privacy policy navigation using a regular <a> tag
  const handleLearnMore = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault(); // Prevent default anchor tag behavior
    navigate("/privacy"); // Programmatically navigate to the PrivacyPage
  };

  return (
    visible && (
      <div className="cookie-consent-banner">
        <p>
          This website uses cookies to improve your experience. By using this
          website, you consent to the use of cookies.{" "}
          <a href="/PrivacyPage" onClick={handleLearnMore}>
            Learn more
          </a>
          . {/* Use regular <a> tag with onClick */}
        </p>
        <button onClick={handleDismiss}>Got it!</button>
      </div>
    )
  );
};

export default CookieConsentBanner;
