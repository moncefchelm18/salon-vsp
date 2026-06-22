import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check storage when app loads
  useEffect(() => {
    const storedUser = localStorage.getItem("picasso_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, user: userData } = response.data;

      // Store auth session
      localStorage.setItem("picasso_token", token);
      localStorage.setItem("picasso_user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, role: userData.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Erreur de connexion",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("picasso_token");
    localStorage.removeItem("picasso_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
