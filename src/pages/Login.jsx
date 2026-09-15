import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import LoginForm from "../components/LoginForm"; // Adjust path based on your new folder structure

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (username, password) => {
    setIsLoading(true);

    // This makes the API call to your backend!
    const result = await login(username, password);

    if (result.success) {
      toast.success("Authentification réussie !");

      if (result.role === "admin" || result.role === "receptionist") {
        navigate("/administration/coiffure/dashboard");
      } else if (result.role === "barber_global") {
        // Redirection iPad globale
        navigate("/coiffeur");
      } else if (result.role === "barber") {
        console.log(result.user);
        const barberId = result.user?.barberId;
        if (!barberId) {
          toast.error(
            "Erreur de synchronisation : Fiche coiffeur introuvable.",
          );
        } else {
          navigate(`/coiffeur/salle/${barberId}`);
        }
      } else if (result.role === "cafe_staff") {
        navigate("/administration/cafe/commandes");
      } else {
        navigate("/");
      }
    } else {
      toast.error(result.message); // Displays "Identifiants invalides" from server
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Cool background abstract styling */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-olive-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Our Component */}
      <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoading} />
    </main>
  );
}
