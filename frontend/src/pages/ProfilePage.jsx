import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe, updateMe } from "../services/api";

const AVATARS = [
  "/avatars/avatar-1.jpg",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
  "/avatars/avatar-6.png",
  "/avatars/avatar-7.jpg",
  "/avatars/avatar-8.jpg",
];

const DEFAULT_AVATAR = AVATARS[0];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  const v = value.trim();
  return v.length > 0 && EMAIL_RE.test(v);
}

function phoneDigitCount(value) {
  return value.replace(/\D/g, "").length;
}

function isValidPhoneWhenPresent(value) {
  const t = value.trim();
  if (!t) return true;
  const n = phoneDigitCount(t);
  return n >= 10 && n <= 15;
}

function IconPencil() {
  return (
    <svg className="profile-current__pencil" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const location = useLocation();
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const profileLoaded = useRef(false);
  const emailSnapshot = useRef("");

  useEffect(() => {
    if (location.state?.passwordUpdated) {
      setMessage("Password updated successfully.");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await fetchMe();
        const url = me.avatar_url?.trim();
        setSelectedAvatar(url || DEFAULT_AVATAR);
        const em = (me.email || "").trim();
        const ph = (me.phone_number || "").trim();
        setEmail(em);
        setPhone(ph);
        setFullName((me.full_name || "").trim());
        emailSnapshot.current = em;
        profileLoaded.current = true;
      } catch {
        setError("Failed to load profile.");
      }
    };
    loadProfile();
  }, []);

  const displayAvatar = showAvatarPicker && avatarDraft != null ? avatarDraft : selectedAvatar;

  const openAvatarPicker = () => {
    setAvatarDraft(selectedAvatar);
    setShowAvatarPicker(true);
  };

  const closeAvatarPicker = () => {
    setShowAvatarPicker(false);
    setAvatarDraft(null);
  };

  const saveAvatar = async () => {
    if (avatarDraft == null) return;
    if (avatarDraft === selectedAvatar) {
      closeAvatarPicker();
      return;
    }
    setSavingAvatar(true);
    setError("");
    try {
      await updateMe({ avatar_url: avatarDraft });
      setSelectedAvatar(avatarDraft);
      window.dispatchEvent(new Event("profile-updated"));
      setShowAvatarPicker(false);
      setAvatarDraft(null);
      setMessage("Profile picture saved.");
      window.setTimeout(() => setMessage(""), 2200);
    } catch (err) {
      setError(err.message || "Failed to update avatar.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileLoaded.current) return;
    setError("");
    const em = email.trim().toLowerCase();
    if (em && !isValidEmail(em)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isValidPhoneWhenPresent(phone)) {
      setError("Enter a valid phone number (10–15 digits), or leave the field empty.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone_number: phone.trim(),
      };
      if (em && em !== emailSnapshot.current.trim().toLowerCase()) {
        payload.email = em;
      }
      const updated = await updateMe(payload);
      if (updated.email) {
        emailSnapshot.current = (updated.email || "").trim();
        setEmail(emailSnapshot.current);
      }
      window.dispatchEvent(new Event("profile-updated"));
      setMessage("Profile saved.");
      window.setTimeout(() => setMessage(""), 2200);
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const needsEmail = !email.trim();
  const needsPhone = !phone.trim();
  const avatarDirty = showAvatarPicker && avatarDraft != null && avatarDraft !== selectedAvatar;

  return (
    <div className="container home-page profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-current">
            <button
              type="button"
              className="profile-current__button"
              onClick={() => (showAvatarPicker ? closeAvatarPicker() : openAvatarPicker())}
              aria-label={showAvatarPicker ? "Close photo picker" : "Change profile photo"}
            >
              <img src={displayAvatar} alt="" className="profile-current__image" />
              <span className="profile-current__edit">
                <IconPencil />
              </span>
            </button>
          </div>
          <div className="profile-header__content">
            <h1 className="profile-title">{fullName.trim() || "Your profile"}</h1>
          </div>
        </div>

        {showAvatarPicker ? (
          <div className="profile-avatars-wrap">
            <div className="profile-avatars">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`profile-avatars__item ${avatarDraft === avatar ? "is-active" : ""}`}
                  onClick={() => setAvatarDraft(avatar)}
                >
                  <img src={avatar} alt="" />
                </button>
              ))}
            </div>
            <div className="profile-avatars-actions">
              <button type="button" className="btn btn--secondary" onClick={closeAvatarPicker}>
                Close
              </button>
              <button type="button" className="btn btn--primary" onClick={saveAvatar} disabled={savingAvatar}>
                {savingAvatar ? "Saving…" : avatarDirty ? "Save photo" : "Done"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="profile-form profile-form--personal">
          <h2 className="profile-section-title">Personal info</h2>

          <div className="form-field profile-field">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          <div className="form-field profile-field">
            <label htmlFor="profile-email">Mail</label>
            {needsEmail ? (
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            ) : (
              <input
                id="profile-email"
                type="email"
                readOnly
                value={email}
                className="profile-input-readonly profile-input-readonly--email"
                tabIndex={0}
                aria-readonly="true"
              />
            )}
          </div>

          <div className="form-field profile-field">
            <label htmlFor="profile-phone">Phone number</label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={needsPhone ? "+7 …" : ""}
              autoComplete="tel"
              className="profile-phone-input"
            />
          </div>

          <div className="profile-save-row">
            <button
              type="button"
              className="btn btn--primary profile-save-btn"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>

          <div className="profile-field profile-field--password">
            <h3 className="profile-subsection-title">Password</h3>
            <Link to="/change-password" className="btn btn--primary profile-password-btn profile-password-btn--primary">
              Change password
            </Link>
          </div>
        </div>

        {error ? <p className="auth-field-error">{error}</p> : null}
        {message ? <p className="profile-message">{message}</p> : null}
      </div>
    </div>
  );
}
