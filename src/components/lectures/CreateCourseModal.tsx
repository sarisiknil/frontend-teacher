import { useState } from "react";
import { createCourse, updateCourse } from "../../api/CourseApi";
import "./CreateCourseModal.css";

export default function CreateCourseModal({ onClose }: { onClose: () => void }) {
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

  const handleSubmit = async () => {
    const res = await createCourse(form.start_date || null);

    await updateCourse(res.items[0].course_id, {
      course_name: form.course_name,
      price: form.price,
      capacity: Number(form.capacity),
      description: form.description,
      total_lessons: Number(form.total_lessons),
      difficulty: form.difficulty as any,
      course_type: form.course_type as any
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">

        <h2>Add Course</h2>

        <div className="form-section">
          <label>Course Name</label>
          <input value={form.course_name} onChange={(e) => updateField("course_name", e.target.value)} />
        </div>

        <div className="form-section">
          <label>Price </label>
          <input value={form.price} onChange={(e) => updateField("price", e.target.value)} />
        </div>

        <div className="form-section">
          <label>Capacity</label>
          <input value={form.capacity} onChange={(e) => updateField("capacity", e.target.value)} />
        </div>

        <div className="form-section">
          <label>Difficulty</label>
          <select onChange={(e) => updateField("difficulty", e.target.value)}>
            <option value="">Select difficulty</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>

        <div className="form-section">
          <label>Course Type</label>
          <select onChange={(e) => updateField("course_type", e.target.value)}>
            <option value="">Select course type</option>
            <option value="LECTURE">Lecture</option>
            <option value="QUESTIONS">Questions</option>
          </select>
        </div>

        <div className="form-section">
          <label>Total Lessons</label>
          <input value={form.total_lessons} onChange={(e) => updateField("total_lessons", e.target.value)} />
        </div>

        <div className="form-section">
          <label>Start Date</label>
          <input type="date" onChange={(e) => updateField("start_date", e.target.value)} />
        </div>

        <div className="form-section">
          <label>Course Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          ></textarea>
        </div>

        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button className="submit" onClick={handleSubmit}>Create Course</button>
        </div>

      </div>
    </div>
  );
}
