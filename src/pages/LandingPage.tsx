import "./LandingPage.css";
import { FiStar } from "react-icons/fi";

export default function LandingPage() {
  return (
    <div className="landing-root">

      {/* ===================== HERO SECTION ===================== */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Teach Smarter, Not Harder:<br />
            Effortless Education Platform
          </h1>

          <p className="hero-subtitle">
            Dopamine empowers educators with intuitive tools for course creation, 
            student engagement, and seamless management — so you can focus on 
            what truly matters: inspiring young minds.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">Start Teaching Today</button>
            <button className="btn-secondary">Watch a Quick Demo</button>
          </div>
        </div>

        <div className="hero-image">
          <img src="/hero-dashboard.png" alt="Dashboard Preview" />
        </div>
      </section>

      {/* ===================== FEATURES SECTION ===================== */}
      <section className="features">
        <h2 className="section-title">Unlock Your Teaching Potential with Dopamine</h2>

        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Intuitive Course Builder</h3>
            <p>
              Create engaging courses with drag-and-drop tools, multimedia support, 
              and customizable templates — all in minutes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Streamlined Student Management</h3>
            <p>
              Effortlessly track progress, manage assignments, and communicate with 
              students and parents — all from one dashboard.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Interactive Learning Tools</h3>
            <p>
              Engage students with quizzes, discussions, and collaborative tools 
              that foster dynamic participation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Performance Analytics</h3>
            <p>
              Gain insights into student performance with clear reports and data-driven analytics.
            </p>
          </div>

        </div>
      </section>

      {/* ===================== TESTIMONIAL SECTION ===================== */}
      <section className="testimonials">
        <h2 className="section-title">What Teachers Are Saying</h2>

        <div className="testimonials-grid">

          <div className="testimonial-card">
            <h4>Sarah Kaplan</h4>
            <span className="role">High School English Teacher</span>
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p>
              Dopamine has transformed my classroom! I spend less time on admin and more
              time teaching. Highly recommended for modern educators.
            </p>
          </div>

          <div className="testimonial-card">
            <h4>Mehmet Yılmaz</h4>
            <span className="role">Middle School Math Teacher</span>
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p>
              My students love the interactive features. The platform is simple, powerful,
              and extremely helpful for lesson planning.
            </p>
          </div>

          <div className="testimonial-card">
            <h4>Elif Aydın</h4>
            <span className="role">Elementary Science Educator</span>
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p>
              Creating lessons feels effortless with the intuitive design. The resource 
              library is extremely useful as well.
            </p>
          </div>

          <div className="testimonial-card">
            <h4>Michael Brown</h4>
            <span className="role">University Lecturer, Economics</span>
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p>
              Setting up complex courses and managing large cohorts has never been easier.
              Dopamine is professional, reliable, and user-friendly.
            </p>
          </div>

        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="cta">
        <h2>Ready to Simplify Your Teaching?</h2>
        <p>
          Join thousands of educators already enhancing their teaching experience 
          with Dopamine. Get started today!
        </p>

        <button className="btn-primary">Get Started</button>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="footer">
        <span>© 2025 Dopamine. All rights reserved.</span>
        <div className="footer-links">
          <a>Privacy Policy</a>
          <a>Terms of Service</a>
          <a>Contact Us</a>
        </div>
      </footer>

    </div>
  );
}
