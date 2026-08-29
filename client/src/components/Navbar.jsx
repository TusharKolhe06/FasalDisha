

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  };

  return (
    <nav className="navbar">
      <Link className="brand" to="/">
        🌱📍➜ {t("appName")}
      </Link>

      <div className="navlinks">
        <Link to="/markets">{t("marketPrices")}</Link>

        <Link to="/marketplace">{t("marketplace")}</Link>

        {user ? (
          <>
            <Link to="/dashboard">{t("dashboard")}</Link>

            <button className="linkbtn" onClick={logout}>
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login">{t("login")}</Link>

            <Link to="/register">{t("register")}</Link>
          </>
        )}

        {/* Language Switcher */}
        <button
          className="language-btn"
          onClick={() => changeLanguage("en")}
        >
          English
        </button>

        <button
          className="language-btn"
          onClick={() => changeLanguage("mr")}
        >
          मराठी
        </button>
      </div>
    </nav>
  );
}