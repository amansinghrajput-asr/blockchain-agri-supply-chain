import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Dashboard from "./components/Dashboard";
import BatchDetail from "./components/BatchDetail";
import CreateBatch from "./components/CreateBatch";
import QualityAssess from "./components/QualityAssess";
import Login from "./components/Login";
import Toast from "./components/Toast";

// ── Toast Context ──
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

// ── Simple router ──
function getInitialRoute() {
  // Handle ?batch= query param (QR code deep-link) BEFORE reading hash
  const batchParam = new URLSearchParams(window.location.search).get("batch");
  if (batchParam) {
    window.history.replaceState(null, "", `${window.location.pathname}#batch/${batchParam}`);
    return { page: "batch", params: { id: batchParam } };
  }
  const hash = window.location.hash.slice(1) || "dashboard";
  const [page, ...rest] = hash.split("/");
  return { page, params: { id: rest[0] || null } };
}

function useRouter() {
  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1) || "dashboard";
      const [page, ...rest] = hash.split("/");
      const id = rest[0] || null;
      setRoute({ page, params: { id } });
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigate = useCallback((page, id) => {
    window.location.hash = id ? `${page}/${id}` : page;
  }, []);

  return { ...route, navigate };
}

const ROLE_ICONS = {
  Farmer: "🚜",
  Distributor: "🚛",
  Retailer: "🏪",
  Inspector: "🔬",
};

export default function App() {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("agri_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState(false);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  function handleLogout() {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_user");
    setUser(null);
    setIsGuest(false);
    addToast("Signed out successfully", "success");
  }

  const renderPage = () => {
    switch (router.page) {
      case "create":
        return <CreateBatch navigate={router.navigate} currentUser={user} />;
      case "quality":
        return <QualityAssess navigate={router.navigate} />;
      case "batch":
        return (
          <BatchDetail
            batchId={router.params.id}
            navigate={router.navigate}
          />
        );
      default:
        return <Dashboard navigate={router.navigate} />;
    }
  };

  return (
    <ToastContext.Provider value={addToast}>
      {/* If user is not authenticated and not browsing as guest, show the Login / Register screen */}
      {!user && !isGuest ? (
        <Login
          onAuthSuccess={(userData) => setUser(userData)}
          onGuestLogin={() => setIsGuest(true)}
        />
      ) : (
        <>
          {/* Navbar */}
          <nav className="navbar">
            <div
              className="navbar-brand"
              onClick={() => router.navigate("dashboard")}
            >
              <div className="navbar-logo">🌾</div>
              <div>
                <div className="navbar-title">AgriChain</div>
                <div className="navbar-subtitle">
                  Farm-to-Market Transparency
                </div>
              </div>
            </div>
            <div className="navbar-nav">
              <button
                className={`nav-link ${router.page === "dashboard" ? "active" : ""}`}
                onClick={() => router.navigate("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-link ${router.page === "create" ? "active" : ""}`}
                onClick={() => router.navigate("create")}
              >
                New Batch
              </button>
              <button
                className={`nav-link ${router.page === "quality" ? "active" : ""}`}
                onClick={() => router.navigate("quality")}
              >
                Quality AI
              </button>

              {/* User Profile & Logout / Sign In */}
              {user ? (
                <div className="user-profile-badge">
                  <span className="user-role-icon">
                    {ROLE_ICONS[user.role] || "👤"}
                  </span>
                  <div className="user-info-text">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role-label">{user.role}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm btn-logout"
                    onClick={handleLogout}
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsGuest(false)}
                >
                  Sign In
                </button>
              )}
            </div>
          </nav>

          {/* Main Content */}
          <div className="app-container">
            <div className="fade-in" key={router.page + (router.params.id || "")}>
              {renderPage()}
            </div>
          </div>
        </>
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
