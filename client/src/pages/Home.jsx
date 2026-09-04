// import { Link } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// export default function Home() {
//   const { t } = useTranslation();

//   return (
//     <main>
//       <section className="hero">
//         <div>
//           <p className="eyebrow">{t("smartAgriculture")}</p>

//           <h1>{t("heroTitle")}</h1>

//           <p>{t("heroDescription")}</p>

//           <div className="actions">
//             <Link className="btn" to="/markets">
//               {t("checkMarketPrices")}
//             </Link>

//             <Link className="btn secondary" to="/marketplace">
//               {t("findBuyers")}
//             </Link>
//           </div>
//         </div>

//         <div className="hero-card">
//           <span>🌾 + ₹ + 📈</span>

//           <h3>{t("smartSellingRecommendation")}</h3>

//           <p>{t("smartSellingDescription")}</p>
//         </div>
//       </section>

//       <section className="grid three">
//         <div className="card">
//           <h3>📊 {t("priceDiscovery")}</h3>
//           <p>{t("priceDiscoveryDescription")}</p>
//         </div>

//         <div className="card">
//           <h3>🤖 {t("aiPrediction")}</h3>
//           <p>{t("aiPredictionDescription")}</p>
//         </div>

//         <div className="card">
//           <h3>🤝 {t("marketLinkage")}</h3>
//           <p>{t("marketLinkageDescription")}</p>
//         </div>
//       </section>
//     </main>
//   );
// }


import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="home-page">

      {/* ================= HERO ================= */}
      <section className="home-hero">

        <div className="hero-content">

          <p className="hero-eyebrow">
            {t("smartAgriculture")}
          </p>

          <h1>
            Smart decisions.
            <br />
            Better markets.
          </h1>

          <p className="hero-description">
            {t("heroDescription")}
          </p>

          <div className="hero-actions">

            <Link
              className="home-btn primary"
              to="/markets"
            >
              <span className="btn-icon">▥</span>
              {t("checkMarketPrices")}
            </Link>

            <Link
              className="home-btn outline"
              to="/marketplace"
            >
              <span className="btn-icon">♧</span>
              {t("findBuyers")}
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}
      <section className="home-features">

        <div className="home-feature-card">

          <div className="feature-icon green">
            ▥
          </div>

          <h3>
            {t("priceDiscovery")}
          </h3>

          <p>
            {t("priceDiscoveryDescription")}
          </p>

        </div>


        <div className="home-feature-card">

          <div className="feature-icon blue">
            🧠
          </div>

          <h3>
            {t("aiPrediction")}
          </h3>

          <p>
            {t("aiPredictionDescription")}
          </p>

        </div>


        <div className="home-feature-card">

          <div className="feature-icon yellow">
            🤝
          </div>

          <h3>
            {t("marketLinkage")}
          </h3>

          <p>
            {t("marketLinkageDescription")}
          </p>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section className="how-section">

        <h2>How it works</h2>

        <div className="section-line"></div>

        <div className="how-grid">

          <div className="how-item">

            <div className="step-number">
              1
            </div>

            <div className="how-icon">
              ⌕
            </div>

            <h3>
              Check Prices
            </h3>

            <p>
              See real-time prices
              <br />
              in your markets.
            </p>

          </div>


          <div className="how-item">

            <div className="step-number">
              2
            </div>

            <div className="how-icon">
              ▦
            </div>

            <h3>
              Compare & Decide
            </h3>

            <p>
              Compare profit after
              <br />
              transport & costs.
            </p>

          </div>


          <div className="how-item">

            <div className="step-number">
              3
            </div>

            <div className="how-icon">
              ♧
            </div>

            <h3>
              Connect & Sell
            </h3>

            <p>
              Find buyers and
              <br />
              sell with confidence.
            </p>

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}
      <section className="home-cta">

        <div className="cta-plant">
          🌱
        </div>

        <div className="cta-content">

          <h2>
            Empowering every farmer
          </h2>

          <p>
            FasalDisha is here to help you grow
            <br className="desktop-only" />
            better and sell smarter.
          </p>

        </div>

        <Link
          className="home-btn primary cta-btn"
          to="/markets"
        >
          Get Started
        </Link>

      </section>

    </main>
  );
}