import { useEffect, useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import "./ProfilePage.css";
import { getLevels, readChildSubbranches } from "../api/CourseApi";
import type { Level, Subbranch } from "../api/CourseApi";


const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ProfilePage() {
    const {
        profile,
        overview,
        teacherApprovals,
        isProfileLoading,
        updateProfile,
        updateTeacher,
        updatePicture,
        updateSubbranches,
        refreshProfile,
        requestTeacherApproval
    } = useProfile();

    // -----------------------------
    // FORM STATE
    // -----------------------------
    const [form, setForm] = useState({
        name: "",
        surname: "",
        birth_date: "",
        biography: "",
        first_teaching_year: "",
        primary_branch: "",
    });

    const [avatar, setAvatar] = useState<File | null>(null);
    const [approvalComment, setApprovalComment] = useState("");
    const [approvalMessage, setApprovalMessage] = useState("");

    // -----------------------------
    // CURRICULUM STATE (levels + subbranches)
    // -----------------------------
    const [levels, setLevels] = useState<Level[]>([]);
    const [levelSubbranches, setLevelSubbranches] = useState<Record<string, Subbranch[]>>({});
    const [subbranches, setSubbranches] = useState<string[]>([]); // stores subbranch IDs



    // -----------------------------
    // INITIAL PROFILE LOAD
    // -----------------------------
    useEffect(() => {
        refreshProfile();
    }, []);

    useEffect(() => {
        if (!profile || !overview) return;

        // Fill form
        setForm({
            name: profile.name ?? "",
            surname: profile.surname ?? "",
            birth_date: profile.birth_date ?? "",
            biography: overview.Biography ?? "",
            first_teaching_year: overview.First_Teaching_Year?.toString() ?? "",
            primary_branch: overview.Primary_Branch ?? "",
        });

        // Existing subbranches → store ID strings
        if (overview.Subbranches) {
            setSubbranches(overview.Subbranches.map(sb => sb.branch_id));
        }
    }, [profile, overview]);
    
    useEffect(() => {
        async function loadCurriculum() {
            try {
                const lvlRes = await getLevels();
                const lvl = lvlRes.items;
                setLevels(lvl);

                const levelIds = lvl.map(l => l.id);
                const sbRes = await readChildSubbranches(levelIds);

                const map: Record<string, Subbranch[]> = {};
                lvl.forEach(level => {
                    map[level.id] = sbRes.items.filter(sb => sb.level_id === level.id);
                });

                setLevelSubbranches(map);
            } catch (e) {
                console.error("Failed to load curriculum:", e);
            }
        }

        loadCurriculum();
    }, []);

    // -----------------------------
    // TOGGLE SUBBRANCH
    // -----------------------------
    function toggleSubbranch(id: string) {
        setSubbranches(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    // -----------------------------
    // TEACHER STATUS BADGE
    // -----------------------------
    function renderStatusBadge() {
        if (!teacherApprovals || teacherApprovals.length === 0) {
            return <span className="status-badge neutral">Not Verified</span>;
        }

        const latest = teacherApprovals[0];

        switch (latest.Statu) {
            case "PENDING":
                return <span className="status-badge pending">Pending</span>;
            case "APPROVED":
                return <span className="status-badge approved">Verified</span>;
            case "REJECTED":
                return <span className="status-badge rejected">Rejected</span>;
            default:
                return <span className="status-badge neutral">Unknown</span>;
        }
    }

    // -----------------------------
    // TEACHER APPROVAL REQUEST
    // -----------------------------
    async function handleTeacherApproval() {
        try {
            await requestTeacherApproval(approvalComment);
            setApprovalMessage("Your teacher approval request was sent successfully!");
        } catch (err) {
            console.error(err);
            setApprovalMessage("Approval request failed.");
        }
    }

    // -----------------------------
    // UPDATE FORM FIELD
    // -----------------------------
    const updateField = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    // -----------------------------
    // SAVE CHANGES
    // -----------------------------
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

        const backendIds = overview?.Subbranches?.map(sb => sb.branch_id) ?? [];

        const added = subbranches.filter(id => !backendIds.includes(id));
        const removed = backendIds.filter(id => !subbranches.includes(id));

        await updateSubbranches({ added, removed });

        if (avatar) await updatePicture(avatar);

        await refreshProfile();
    }

    // -----------------------------
    // LOADING STATE
    // -----------------------------
    if (isProfileLoading || !profile || !overview) {
        return <div className="profile-loading">Loading...</div>;
    }

    // ============================================================
    //                      UI RENDER
    // ============================================================
    return (
        <div className="profile-page">
            <div className="profile-header">

                {/* LEFT - PROFILE PIC */}
                <div className="profile-pic-column">

                    <div className="profile-info-over">
                        <h1>{profile.name} {profile.surname}</h1>
                        <p>{overview.Primary_Branch || "No primary branch"}</p>
                    </div>

                    <div className="profile-pic-wrapper">
                        <img
                            className="profile-pic"
                            src={
                                profile.avatar_link
                                    ? `${API_BASE}/${profile.avatar_link}`
                                    : "/default-avatar.png"
                            }
                            alt="avatar"
                        />
                        <div
                            className="profile-pic-overlay"
                            onClick={() => document.getElementById("avatar-input")?.click()}
                        >
                            Change
                        </div>
                    </div>

                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        className="profile-file-input"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setAvatar(e.target.files[0]);
                                updatePicture(e.target.files[0]).then(refreshProfile);
                            }
                        }}
                    />
                </div>

                {/* RIGHT - TEACHER APPROVAL */}
                <div className="profile-info-right">
                    <div className="verification-box">
                        <div className="verification-header">Teacher Verification Status</div>
                        <div className="verification-status">{renderStatusBadge()}</div>

                        <textarea
                            className="verification-comment"
                            placeholder="Write a comment for your verification request…"
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                        />

                        <button className="verification-btn" onClick={handleTeacherApproval}>
                            Request Verification
                        </button>

                        {approvalMessage && (
                            <p className="verification-message">{approvalMessage}</p>
                        )}
                    </div>
                </div>

            </div>

            {/* INFO SECTIONS */}
            <div className="profile-sections">

                {/* PERSONAL INFO */}
                <section className="profile-section">
                    <h2>Personal Information</h2>

                    <div className="profile-form">
                        <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Name" />
                        <input value={form.surname} onChange={(e) => updateField("surname", e.target.value)} placeholder="Surname" />
                        <input value={form.birth_date} type="date" onChange={(e) => updateField("birth_date", e.target.value)} />
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

                        <select
                            value={form.primary_branch}
                            onChange={(e) => updateField("primary_branch", e.target.value)}
                            className="profile-select"
                        >
                            <option value="">Select Primary Branch</option>
                            {[
                                "TURKCE", "MATEMATIK", "FIZIK", "KIMYA", "BIYOLOJI", "TARIH",
                                "COGRAFYA", "FELSEFE", "DIN_KULTURU_VE_AHLAK_BILGISI",
                                "TURK_DILI_VE_EDEBIYATI", "GEOMETRI", "PSIKOLOJI",
                                "SOSYOLOJI", "MANTIK",
                                "INGILIZCE", "ALMANCA", "FRANSIZCA", "ARAPCA", "RUSCA"
                            ].map(b => (
                                <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
                            ))}
                        </select>

                        {/* SUBBRANCHES - GROUPED BY LEVEL */}
                        <div className="subbranch-section">
                            <h3>Select Subbranches</h3>

                            {levels.map(level => (
                                <details key={level.id} className="level-block">
                                    <summary className="level-name">{level.name}</summary>

                                    <div className="subbranch-list">
                                        {levelSubbranches[level.id]?.map(sb => (
                                            <label key={sb.id} className="subbranch-item">
                                                <input
                                                    type="checkbox"
                                                    checked={subbranches.includes(sb.id)}
                                                    onChange={() => toggleSubbranch(sb.id)}
                                                />
                                                {sb.name}
                                            </label>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>

                        <textarea
                            value={form.biography}
                            onChange={(e) => updateField("biography", e.target.value)}
                            placeholder="Biography"
                        />
                    </div>
                </section>

                <button className="profile-save-btn" onClick={saveAll}>
                    Save Changes
                </button>

            </div>

        </div>
    );
}
