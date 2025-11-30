import { useEffect, useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import "./ProfilePage.css";

export default function ProfilePage() {
    const {
        profile,
        overview,
        isProfileLoading,
        updateProfile,
        updateTeacher,
        updatePicture,
        refreshProfile
    } = useProfile();

    const [form, setForm] = useState({
        name: "",
        surname: "",
        birth_date: "",
        biography: "",
        first_teaching_year: "",
        primary_branch: "",
    });

    const [avatar, setAvatar] = useState<File | null>(null);

    useEffect(() => {
        if (!profile || !overview) return;

        setForm({
            name: profile.name ?? "",
            surname: profile.surname ?? "",
            birth_date: profile.birth_date ?? "",
            biography: overview.Biography ?? "",
            first_teaching_year: overview.First_Teaching_Year?.toString() ?? "",
            primary_branch: overview.Primary_Branch ?? "",
        });
    }, [profile, overview]);


    const updateField = (field: string, value: string) =>
        setForm((f) => ({ ...f, [field]: value }));

    async function saveAll() {
        await updateProfile({
            name: form.name,
            surname: form.surname,
            birthdate: form.birth_date,
        });

        await updateTeacher({
            biography: form.biography,
            primary_branch: form.primary_branch,
            first_teaching_year: Number(form.first_teaching_year),
        });

        if (avatar) {
            await updatePicture(avatar);
        }

        await refreshProfile();
    }

    if (isProfileLoading || !profile || !overview) {
        return <div className="profile-loading">Loading...</div>;
    }

    return (
        <div className="profile-page">

            <div className="profile-header">
                {/* Profile Picture Upload */}
                <div className="profile-pic-wrapper">
                <label htmlFor="avatar-input" className="profile-pic-label">
                    <img
                    className="profile-pic"
                    src={
                        avatar
                        ? URL.createObjectURL(avatar)
                        : profile?.avatar_link || "/default-avatar.png"
                    }
                    alt="avatar"
                    />
                    <div className="profile-pic-overlay">Change</div>
                </label>

                <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="profile-file-input"
                    onChange={(e) => {
                    if (e.target.files?.[0]) setAvatar(e.target.files[0]);
                    }}
                />
                </div>

                <div className="profile-info">
                    <h1>{profile.name} {profile.surname}</h1>
                    <p>{overview.Primary_Branch || "No primary branch"}</p>
                </div>
            </div>

            <div className="profile-sections">

                {/* PERSONAL INFO */}
                <section className="profile-section">
                    <h2>Personal Information</h2>

                    <div className="profile-form">
                        <input
                            value={form.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            placeholder="Name"
                        />
                        <input
                            value={form.surname}
                            onChange={(e) => updateField("surname", e.target.value)}
                            placeholder="Surname"
                        />
                        <input
                            value={form.birth_date}
                            type="date"
                            onChange={(e) => updateField("birth_date", e.target.value)}
                        />
                    </div>
                </section>

                {/* TEACHER INFO */}
                <section className="profile-section">
                    <h2>Teacher Profile</h2>

                    <div className="profile-form">
                        <input
                            value={form.first_teaching_year}
                            onChange={(e) => updateField("first_teaching_year", e.target.value)}
                            placeholder="First Teaching Year"
                        />

                        <input
                            value={form.primary_branch}
                            onChange={(e) => updateField("primary_branch", e.target.value)}
                            placeholder="Primary Branch"
                        />

                        <textarea
                            value={form.biography}
                            onChange={(e) => updateField("biography", e.target.value)}
                            placeholder="Biography"
                        />
                    </div>
                </section>

                {/* SAVE BUTTON */}
                <button className="profile-save-btn" onClick={saveAll}>
                    Save Changes
                </button>

            </div>
        </div>
    );
}
