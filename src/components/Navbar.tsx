import "./Navbar.css";
import { useNavigate, useLocation} from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Navbar(){
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useUser();
    const navItems = [
        {name: "Anasayfa", path: "/"},
        {name: "Market", path: "/market"},
        {name: "Derslerim", path: "/my-lectures"},
    ];
    const navItems_auth = [
        {name: "Anasayfa", path: "/home"},
        {name: "Derslerim", path: "/my-lectures"},
        {name: "Analizler", path: "/progress-tracker"},
        {name: "Materyaller", path: "/materials"},
    ];

    return (
        <header className="navbar">
            <div className="navbar_brand" onClick={() => navigate("/")}>
                Dopamine
            </div>
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
                <button className="navbar_login_btn" onClick={() => navigate("/login")}>
                    Giriş Yap
                </button>

                </>
            ) : (
                <>
                {navItems_auth.map((item) => (
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
                
                <button 
                    className="navbar_logout_btn"
                    onClick={() => {
                        logout();
                        navigate("/");
                    }}
                >
                    Çıkış yap

                </button>
                </>
            )}
            </nav>


        </header>

    );
}