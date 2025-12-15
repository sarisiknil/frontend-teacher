import { useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import Modal from "../components/Modal";
import "./ProfileSetupModal.css";

export default function ProfileSetupModal() {
  const { needsProfileSetup, profile, updateProfile, updateTeacher } = useProfile();

  const [form, setForm] = useState({
    name: profile?.name ?? "",
    surname: profile?.surname ?? "",
    birth_date: profile?.birth_date ?? "",
    first_teaching_year: "",
    primary_branch: "",
    biography: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const [submitted, setSubmitted] = useState(false);
  
  if (!needsProfileSetup || submitted) return null;

  async function handleSubmit() {
    // --- 1. DOĞRULAMA (VALIDATION) BAŞLANGICI ---
    
    const currentYear = new Date().getFullYear();
    const teachingYear = parseInt(form.first_teaching_year);
    
    if (!form.name || !form.surname || !form.primary_branch) {
      alert("Lütfen İsim, Soyisim ve Branş alanlarını eksiksiz doldurunuz.");
      return;
    }

    if (!teachingYear || form.first_teaching_year.length !== 4) {
      alert("Lütfen mesleğe başlama yılını 4 haneli bir sayı olarak giriniz (Örn: 2015).");
      return;
    }

    if (teachingYear > currentYear) {
      alert(`Mesleğe başlama yılı içinde bulunduğumuz yıldan (${currentYear}) daha ileri olamaz.`);
      return;
    }

    if (teachingYear < 1950) {
      alert("Girdiğiniz yıl çok eski görünüyor, lütfen kontrol ediniz.");
      return;
    }

    try {
      await updateProfile({
        name: form.name,
        surname: form.surname,
        birthdate: form.birth_date,
      });

      await updateTeacher({
        first_teaching_year: teachingYear,
        primary_branch: form.primary_branch,
        biography: form.biography,
      });

      setSubmitted(true);

    } catch (error: any) {
      console.error("Profil güncelleme hatası:", error);
      
      const errorMessage = error?.response?.data?.detail || error?.message || "Profil güncellenirken bir sorun oluştu. Lütfen tekrar deneyin.";
      alert(`Hata: ${errorMessage}`);
    }
  }

  return (
    <Modal title="Profilinizi Tamamlayın" closable={false}>
      <div className="profile-setup-container">
        <div className="profile-setup-wrapper">
          
          <input
            className="profile-setup-input"
            placeholder="İsim"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />

          <input
            className="profile-setup-input"
            placeholder="Soyisim"
            value={form.surname}
            onChange={(e) => update("surname", e.target.value)}
          />

          <input
            type="date"
            className="profile-setup-input"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
          />

          <input
            type="number"
            className="profile-setup-input"
            placeholder="Öğretmenliğe başlama yılınız (Örn: 2018)"
            value={form.first_teaching_year}
            onChange={(e) => update("first_teaching_year", e.target.value)}
          />

          <select
            value={form.primary_branch}
            onChange={(e) => update("primary_branch", e.target.value)}
            className="profile-select"
          >
            <option value="">Ana Branşınızı seçin</option>
            {[
              "TURKCE", "MATEMATIK", "FIZIK", "KIMYA", "BIYOLOJI", "TARIH",
              "COGRAFYA", "FELSEFE", "DIN_KULTURU_VE_AHLAK_BILGISI",
              "TURK_DILI_VE_EDEBIYATI", "GEOMETRI", "PSIKOLOJI",
              "SOSYOLOJI", "MANTIK",
              "INGILIZCE", "ALMANCA", "FRANSIZCA", "ARAPCA", "RUSCA"
            ].map((b) => (
              <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
            ))}
          </select>

          <textarea
            className="profile-setup-textarea"
            placeholder="Hakkınızda"
            value={form.biography}
            onChange={(e) => update("biography", e.target.value)}
          />

          <button className="profile-setup-btn" onClick={handleSubmit}>
            Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
}