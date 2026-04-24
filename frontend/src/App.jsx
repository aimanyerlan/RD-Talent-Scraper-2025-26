import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassword from "./pages/ForgotPassword";
import EmailVerificationSentPage from "./pages/EmailVerificationSentPage";
import PasswordResetSentPage from "./pages/PasswordResetSentPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VacanciesPage from "./pages/VacanciesPage";
import VacancyDetailPage from "./pages/VacancyDetailPage";
import WatchlistPage from "./pages/WatchlistPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route path="/vacancies/:id" element={<VacancyDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/email-verification-sent" element={<EmailVerificationSentPage />} />
        <Route path="/password-reset-sent" element={<PasswordResetSentPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;