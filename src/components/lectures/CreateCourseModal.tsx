import { useState } from "react";
import { createCourse, updateCourse } from "../../api/CourseApi";
import "./CreateCourseModal.css";

export default function CreateCourseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    course_name: "",
    price: "",
    capacity: "",
    difficulty: "",
    course_type: "",
    total_lessons: "",
    start_date: "",
    description: ""
  });

  const updateField = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const validateForm = () => {
    if (!form.course_name.trim()) {
      alert("Lütfen kurs adını giriniz.");
      return false;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      alert("Lütfen geçerli bir fiyat giriniz.");
      return false;
    }
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      alert("Lütfen geçerli bir kontenjan sayısı giriniz.");
      return false;
    }
    if (!form.difficulty) {
      alert("Lütfen bir zorluk seviyesi seçiniz.");
      return false;
    }
    if (!form.course_type) {
      alert("Lütfen bir kurs tipi seçiniz.");
      return false;
    }
    if (!form.total_lessons || isNaN(Number(form.total_lessons)) || Number(form.total_lessons) <= 0) {
      alert("Lütfen toplam ders sayısını giriniz.");
      return false;
    }
    if (!form.start_date) {
      alert("Lütfen bir başlangıç tarihi seçiniz.");
      return false;
    }
    if (!form.description.trim()) {
      alert("Lütfen kurs açıklamasını giriniz.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // 1. Validate inputs before sending to server
    if (!validateForm()) return;

    try {
      // 2. Create the initial course record
      const res = await createCourse(form.start_date || null);

      if (!res || !res.items || res.items.length === 0) {
        throw new Error("Kurs oluşturulurken bir hata oluştu.");
      }

      // 3. Update with full details
      await updateCourse(res.items[0].course_id, {
        course_name: form.course_name,
        price: form.price,
        capacity: Number(form.capacity),
        description: form.description,
        total_lessons: Number(form.total_lessons),
        difficulty: form.difficulty as any,
        course_type: form.course_type as any
      });

      // 4. Success feedback and close
      alert("Kurs başarıyla oluşturuldu!");
      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu. Lütfen tekrar deneyiniz.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">

        <h2>Kurs Ekle</h2>

        <div className="form-section">
          <label>Kurs Adı</label>
          <input 
            value={form.course_name} 
            onChange={(e) => updateField("course_name", e.target.value)} 
            placeholder="Örn: TYT Tarih - Hızlandırılmış Kamp"
          />
        </div>

        <div className="form-section">
          <label>Fiyat (₺)</label>
          <input 
            type="number"
            value={form.price} 
            onChange={(e) => updateField("price", e.target.value)} 
            placeholder="0.00"
          />
        </div>

        <div className="form-section">
          <label>Kontenjan</label>
          <input 
            type="number"
            value={form.capacity} 
            onChange={(e) => updateField("capacity", e.target.value)} 
            placeholder="Örn: 20"
          />
        </div>

        <div className="form-section">
          <label>Zorluk Seviyesi</label>
          <select onChange={(e) => updateField("difficulty", e.target.value)} defaultValue="">
            <option value="" disabled>Seviye seçiniz</option>
            <option value="BEGINNER">Başlangıç </option>
            <option value="INTERMEDIATE">Orta </option>
            <option value="ADVANCED">İleri </option>
          </select>
        </div>

        <div className="form-section">
          <label>Kurs Tipi</label>
          <select onChange={(e) => updateField("course_type", e.target.value)} defaultValue="">
            <option value="" disabled>Tip seçiniz</option>
            <option value="LECTURE">Ders Anlatımı </option>
            <option value="QUESTIONS">Soru Çözümü </option>
          </select>
        </div>

        <div className="form-section">
          <label>Toplam Ders Sayısı</label>
          <input 
            type="number"
            value={form.total_lessons} 
            onChange={(e) => updateField("total_lessons", e.target.value)} 
            placeholder="Örn: 12"
          />
        </div>

        <div className="form-section">
          <label>Başlangıç Tarihi</label>
          <input 
            type="date" 
            onChange={(e) => updateField("start_date", e.target.value)} 
          />
        </div>

        <div className="form-section">
          <label>Kurs Açıklaması</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Kurs içeriği hakkında kısa bir özet giriniz..."
          ></textarea>
        </div>

        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>İptal</button>
          <button className="submit" onClick={handleSubmit}>Oluştur</button>
        </div>

      </div>
    </div>
  );
}