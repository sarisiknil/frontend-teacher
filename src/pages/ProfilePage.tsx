import { useEffect, useState, useRef } from "react";
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    // -----------------------------
    // HATA MESAJI FORMATLAYICI
    // -----------------------------
    const formatError = (error: any): string => {
        if (!error) return "Bilinmeyen bir hata oluştu.";
        const detail = error.response?.data?.detail;
        if (detail) {
            if (typeof detail === "string") return detail;
            if (Array.isArray(detail)) {
                return detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
            }
            return JSON.stringify(detail);
        }
        return error.message || "Sunucu ile iletişim hatası.";
    };

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

    const [approvalComment, setApprovalComment] = useState("");
    const [approvalMessage, setApprovalMessage] = useState("");

    const [levels, setLevels] = useState<Level[]>([]);
    const [levelSubbranches, setLevelSubbranches] = useState<Record<string, Subbranch[]>>({});
    const [subbranches, setSubbranches] = useState<string[]>([]);

    // -----------------------------
    // INITIAL LOAD
    // -----------------------------
    useEffect(() => {
        refreshProfile();
    }, []);

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
            } catch (e: any) {
                console.error("Müfredat yüklenemedi:", e);
                alert("Ders listesi yüklenirken hata: " + formatError(e));
            }
        }
        loadCurriculum();
    }, []);

    // -----------------------------
    // HANDLERS
    // -----------------------------
    function toggleSubbranch(id: string) {
        setSubbranches(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function renderStatusBadge() {
        if (!teacherApprovals || teacherApprovals.length === 0) return <span className="status-badge neutral">Doğrulanmamış</span>;
        const latest = teacherApprovals[0];
        
        // Backend 'Statu' veya 'status' dönebilir, ikisini de kontrol edelim.
        const statusValue = latest.Statu || (latest as any).status;

        switch (statusValue) {
            case "PENDING": return <span className="status-badge pending">Beklemede</span>;
            case "APPROVED": return <span className="status-badge approved">Doğrulandı</span>;
            case "REJECTED": return <span className="status-badge rejected">Reddedildi</span>;
            default: return <span className="status-badge neutral">Bilinmiyor</span>;
        }
    }

    async function handleTeacherApproval() {
        try {
            console.log("Manuel onay isteği gönderiliyor...");
            await requestTeacherApproval(approvalComment || "Onay talebi.");
            setApprovalMessage("Onay talebiniz başarıyla gönderildi!");
            setApprovalComment("");
            await refreshProfile();
            alert("Onay talebiniz başarıyla iletildi."); 
        } catch (err: any) {
            console.error("Manuel onay isteği hatası:", err);
            const msg = formatError(err);
            setApprovalMessage("Onay talebi başarısız oldu.");
            alert("Doğrulama isteği hatası: " + msg);
        }
    }

    const updateField = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("Dosya boyutu çok yüksek. Lütfen 5MB'dan küçük bir resim seçin.");
                return;
            }
            try {
                await updatePicture(file);
                await refreshProfile();
            } catch (error: any) {
                console.error("Resim yükleme hatası:", error);
                alert("Profil fotoğrafı yüklenirken hata oluştu:\n" + formatError(error));
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };

    // -----------------------------
    // KAYDETME HANDLER (DÜZELTİLMİŞ)
    // -----------------------------
    async function saveAll() {
        // 1. Temel Validasyon
        if (!form.name || !form.surname) {
            alert("İsim ve Soyisim alanları zorunludur.");
            return;
        }

        const teachingYear = parseInt(form.first_teaching_year);
        const currentYear = new Date().getFullYear();

        if (form.first_teaching_year && (isNaN(teachingYear) || teachingYear > currentYear || form.first_teaching_year.length !== 4)) {
            alert("Lütfen geçerli, 4 haneli bir mesleğe başlama yılı giriniz (Örn: 2015).");
            return;
        }

        // 2. Değişiklik Kontrolü
        const profileChanged = 
            form.name !== (profile?.name || "") || 
            form.surname !== (profile?.surname || "") || 
            form.birth_date !== (profile?.birth_date || "");

        const teacherChanged = 
            form.biography !== (overview?.Biography || "") ||
            form.primary_branch !== (overview?.Primary_Branch || "") ||
            String(form.first_teaching_year) !== String(overview?.First_Teaching_Year || "");

        const backendIds = overview?.Subbranches?.map(sb => sb.branch_id) ?? [];
        const added = subbranches.filter(id => !backendIds.includes(id));
        const removed = backendIds.filter(id => !subbranches.includes(id));
        const subbranchesChanged = added.length > 0 || removed.length > 0;

        if (!profileChanged && !teacherChanged && !subbranchesChanged) {
            alert("Herhangi bir değişiklik yapmadınız.");
            return;
        }

        // 3. Güncellemeleri Uygula (Try-Catch Blokları Ayrıldı)
        let updateSuccess = true;
        let approvalNote = "";

        try {
            if (profileChanged) {
                await updateProfile({
                    name: form.name,
                    surname: form.surname,
                    birthdate: form.birth_date,
                });
            }

            if (teacherChanged) {
                await updateTeacher({
                    biography: form.biography,
                    primary_branch: form.primary_branch,
                    first_teaching_year: teachingYear,
                });
            }

            if (subbranchesChanged) {
                await updateSubbranches({ added, removed });
            }
            
        } catch (error: any) {
            console.error("Profil güncelleme hatası:", error);
            alert("Değişiklikler kaydedilirken hata oluştu: " + formatError(error));
            updateSuccess = false;
        }

        // Eğer güncellemeler başarılıysa Onay Durumunu kontrol et
        if (updateSuccess) {
            // Statü kontrolü
            const latestStatus = teacherApprovals?.[0]?.Statu;
            console.log("Mevcut Onay Durumu:", latestStatus);


            // Başarı Mesajı
            setApprovalMessage("");
            alert("Değişiklikler başarıyla kaydedildi." + approvalNote);
            
            // Sayfayı yenile (verileri tekrar çek)
            await refreshProfile();
        }
    }

    if (isProfileLoading || !profile || !overview) {
        return <div className="profile-loading">Yükleniyor...</div>;
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
                        <p>{overview.Primary_Branch ? overview.Primary_Branch.replace(/_/g, " ") : "Branş Seçilmedi"}</p>
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
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Değiştir
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="profile-file-input"
                        onChange={handleFileChange}
                    />
                </div>

                {/* RIGHT - TEACHER APPROVAL */}
                <div className="profile-info-right">
                    <div className="verification-box">
                        <div className="verification-header">Eğitmen Doğrulama Durumu</div>
                        <div className="verification-status">{renderStatusBadge()}</div>
                        
                        <textarea
                            className="verification-comment"
                            placeholder="Profilinizi düzenlemeyi bitirdiğinizde öğrencilerin sizi bulabilmesi için profilinizi onaya gönderin."
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                        />

                        <button className="verification-btn" onClick={handleTeacherApproval}>
                            Onaya Gönder
                        </button>

                        {approvalMessage && (
                            <p className="verification-message">{approvalMessage}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* INFO SECTIONS */}
            <div className="profile-sections">
                <section className="profile-section">
                    <h2>Kişisel Bilgiler</h2>
                    <div className="profile-form">
                        <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="İsim" />
                        <input value={form.surname} onChange={(e) => updateField("surname", e.target.value)} placeholder="Soyisim" />
                        <input value={form.birth_date} type="date" onChange={(e) => updateField("birth_date", e.target.value)} />
                    </div>
                </section>

                <section className="profile-section">
                    <h2>Eğitmen Profili</h2>
                    <div className="profile-form">
                        <input
                            type="number"
                            value={form.first_teaching_year}
                            onChange={(e) => updateField("first_teaching_year", e.target.value)}
                            placeholder="Mesleğe Başlama Yılı (Örn: 2018)"
                        />

                        <select
                            value={form.primary_branch}
                            onChange={(e) => updateField("primary_branch", e.target.value)}
                            className="profile-select"
                        >
                            <option value="">Ana Branş Seçiniz</option>
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

                        <div className="subbranch-section">
                            <h3>Verebileceğiniz Dersleri Seçin</h3>
                            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>
                                Aşağıdaki listeden yetkin olduğunuz ve ders vermek istediğiniz konuları işaretleyiniz.
                            </p>
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
                            placeholder="Biyografi / Hakkımda"
                        />
                    </div>
                </section>
                <button className="profile-save-btn" onClick={saveAll}>
                    Değişiklikleri Kaydet
                </button>
            </div>
        </div>
    );
}