import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "farmer",
    phone: "",
    village: "",
    district: ""
  });

  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const update = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError("");

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        location: {
          village: form.village,
          district: form.district,
          state: "Maharashtra"
        }
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || t("registrationFailed")
      );
    }
  };

  return (
    <div className="auth card">
      <h2>{t("createAccount")}</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={submit}>
        <input
          name="name"
          placeholder={t("fullName")}
          required
          onChange={update}
        />

        <input
          name="email"
          type="email"
          placeholder={t("email")}
          required
          onChange={update}
        />

        <input
          name="password"
          type="password"
          placeholder={t("passwordHint")}
          minLength="6"
          required
          onChange={update}
        />

        <select
          name="role"
          value={form.role}
          onChange={update}
        >
          <option value="farmer">
            {t("farmer")}
          </option>

          <option value="buyer">
            {t("buyer")}
          </option>
        </select>

        <input
          name="phone"
          placeholder={t("phone")}
          onChange={update}
        />

        <input
          name="village"
          placeholder={t("village")}
          onChange={update}
        />

        <input
          name="district"
          placeholder={t("district")}
          onChange={update}
        />

        <button className="btn">
          {t("register")}
        </button>
      </form>
    </div>
  );
}