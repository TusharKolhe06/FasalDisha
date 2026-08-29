import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">{t("smartAgriculture")}</p>

          <h1>{t("heroTitle")}</h1>

          <p>{t("heroDescription")}</p>

          <div className="actions">
            <Link className="btn" to="/markets">
              {t("checkMarketPrices")}
            </Link>

            <Link className="btn secondary" to="/marketplace">
              {t("findBuyers")}
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <span>🌾 + ₹ + 📈</span>

          <h3>{t("smartSellingRecommendation")}</h3>

          <p>{t("smartSellingDescription")}</p>
        </div>
      </section>

      <section className="grid three">
        <div className="card">
          <h3>📊 {t("priceDiscovery")}</h3>
          <p>{t("priceDiscoveryDescription")}</p>
        </div>

        <div className="card">
          <h3>🤖 {t("aiPrediction")}</h3>
          <p>{t("aiPredictionDescription")}</p>
        </div>

        <div className="card">
          <h3>🤝 {t("marketLinkage")}</h3>
          <p>{t("marketLinkageDescription")}</p>
        </div>
      </section>
    </main>
  );
}