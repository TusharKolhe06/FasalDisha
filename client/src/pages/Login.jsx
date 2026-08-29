import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const submit = async e => {
    e.preventDefault();
    setError("");

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || t("loginFailed"));
    }
  };

  return (
    <div className="auth card">
      <h2>{t("login")}</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={submit}>
        <input
          placeholder={t("email")}
          type="email"
          required
          value={form.email}
          onChange={e =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          placeholder={t("password")}
          type="password"
          required
          value={form.password}
          onChange={e =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="btn">
          {t("login")}
        </button>
      </form>

      <p>
        {t("newUser")}{" "}
        <Link to="/register">{t("register")}</Link>
      </p>
    </div>
  );
}