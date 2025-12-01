import { useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import Modal from "../components/Modal";
import "./ProfileSetupModal.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ProfileSetupModal() {
  const {
    needsProfileSetup,
    profile,
    updateProfile,
    updateTeacher,
    updatePicture,
  } = useProfile();

  const [form, setForm] = useState({
    name: profile?.name ?? "",
    surname: profile?.surname ?? "",
    birth_date: profile?.birth_date ?? "",
    first_teaching_year: "",
    primary_branch: "",
    biography: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!needsProfileSetup || submitted) return null;

  async function handleSubmit() {
    await updateProfile({
      name: form.name,
      surname: form.surname,
      birthdate: form.birth_date,
    });

    await updateTeacher({
      first_teaching_year: Number(form.first_teaching_year),
      primary_branch: form.primary_branch,
      biography: form.biography,
    });

    if (avatarFile) {
      await updatePicture(avatarFile);
    }

    setSubmitted(true); // modal closes
  }

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));


  // ------------------------
  //  RENDER
  // ------------------------
  return (
    <Modal title="Complete Your Profile" closable={false}>
      <div className="profile-setup-container">

        {/* Avatar Upload */}
        <div className="profile-pic-wrapper">
          <div
            className="profile-pic-label"
            onClick={() => document.getElementById("avatar-setup-input")?.click()}
          >
            <img
              className="profile-pic"
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : profile?.avatar_link
                    ? `${API_BASE}/${profile.avatar_link}`
                    : "/default-avatar.png"
              }
              alt="avatar"
            />

            <div className="profile-pic-overlay">Change</div>
          </div>

          {/* Hidden file input */}
          <input
            id="avatar-setup-input"
            type="file"
            accept="image/*"
            className="profile-file-input"
            onChange={(e) => {
              if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
            }}
          />
        </div>

        {/* Form Inputs */}
        <div className="profile-setup-wrapper">
          <input
            className="profile-setup-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <input
            className="profile-setup-input"
            placeholder="Surname"
            value={form.surname}
            onChange={(e) => update("surname", e.target.value)}
          />
          <input
            className="profile-setup-input"
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
          />
          <input
            className="profile-setup-input"
            placeholder="First Teaching Year"
            value={form.first_teaching_year}
            onChange={(e) => update("first_teaching_year", e.target.value)}
          />
          <input
            className="profile-setup-input"
            placeholder="Primary Branch"
            value={form.primary_branch}
            onChange={(e) => update("primary_branch", e.target.value)}
          />

          <textarea
            className="profile-setup-textarea"
            placeholder="Biography"
            value={form.biography}
            onChange={(e) => update("biography", e.target.value)}
          />

          <button className="profile-setup-btn" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
