import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { FiCalendar, FiCreditCard } from "react-icons/fi";
import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useUser();
    const [profileOpen, setProfileOpen] = useState(false);

    const navItems = [
        { name: "Anasayfa", path: "/" },
        { name: "Özellikler", path: "/features" },
        { name: "Fiyatlandırma", path: "/pricing" },
    ];

    const navItemsAuth = [
        { name: "Anasayfa", path: "/home" },
        { name: "Derslerim", path: "/my-lectures" },
        { name: "Analizler", path: "/progress-tracker" },
        { name: "Materyaller", path: "/materials" },
    ];

    return (
        <header className="navbar">
            
            {/* LEFT */}
            <div className="navbar_brand" onClick={() => navigate("/")}>
                Dopamine
            </div>

            {/* CENTER */}
            <nav className="navbar_links">
                {!isAuthenticated ? (
                    <>
                        {navItems.map((item) => (
                            <span
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`navbar_link ${
                                    location.pathname === item.path ? "active" : ""
                                }`}
                            >
                                {item.name}
                            </span>
                        ))}
                    </>
                ) : (
                    <>
                        {navItemsAuth.map((item) => (
                            <span
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`navbar_link ${
                                    location.pathname === item.path ? "active" : ""
                                }`}
                            >
                                {item.name}
                            </span>
                        ))}
                    </>
                )}
            </nav>

            {/* RIGHT */}
            <div className="navbar_actions">
                {!isAuthenticated ? (
                    <button 
                        className="navbar_login_btn"
                        onClick={() => navigate("/login")}
                    >
                        Giriş Yap
                    </button>
                ) : (
                    <>
                        <FiCalendar className="navbar_icon" />
                        <FiCreditCard className="navbar_icon" />

                        <div
                            className="profile"
                            onClick={() => navigate("/profile")}
                            onMouseEnter={() => setProfileOpen(true)}
                            onMouseLeave={() => setProfileOpen(false)}
                        >
                            <div className="profile-btn">Profil</div>

                            {profileOpen && (
                                <div className="profile-menu">
                                    <span onClick={() => navigate("/notifications")}>
                                        Bildirimler
                                    </span>
                                    <span onClick={() => navigate("/settings")}>
                                        Ayarlar
                                    </span>
                                    <span
                                        onClick={() => {
                                            logout();
                                            navigate("/");
                                        }}
                                    >
                                        Çıkış yap
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

        </header>

    );
}
