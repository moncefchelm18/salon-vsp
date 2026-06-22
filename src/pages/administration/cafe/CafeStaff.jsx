import { useState, useEffect } from "react";
import { UserPlus, Edit, Trash2, ShieldCheck, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

// Common UI Imports
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";

export default function CafeStaff() {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [itemToEdit, setItemToEdit] = useState(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cafe_staff"); // Par défaut, rôle café

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // On demande spécifiquement le staff du café au backend
      const res = await api.get("/cafe/staff?role=cafe_staff");
      setStaff(res.data);
    } catch (error) {
      toast.error("Erreur serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    setItemToEdit(user);

    setUsername(user ? user.username : "");
    setPassword(""); // On vide toujours le mot de passe par sécurité
    setRole(user ? user.role : "cafe_staff");

    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!username.trim())
      return toast.error("Le nom d'utilisateur est requis.");
    if (modalMode === "add" && !password)
      return toast.error("Le mot de passe est requis pour un nouveau compte.");

    setIsSubmitting(true);
    try {
      const payload = { username: username.trim(), role };
      if (password) payload.password = password; // On envoie le mot de passe que s'il a été tapé

      if (modalMode === "add") {
        await api.post("/cafe/staff", payload);
        toast.success("Compte serveur créé !");
      } else {
        await api.put(`/cafe/staff/${itemToEdit.id}`, payload);
        toast.success("Compte mis à jour !");
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement l'accès pour ${name} ?`))
      return;
    try {
      await api.delete(`/cafe/staff/${id}`);
      toast.success("Accès révoqué.");
      fetchStaff();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest">
            Équipe Cafétéria
          </h2>
          <p className="text-t-muted text-[10px] font-bold uppercase mt-1 tracking-widest italic">
            Gérez les accès au point de vente (Caisse)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-8 shadow-lg shadow-brand/20"
        >
          <UserPlus size={18} /> Nouveau Compte
        </Button>
      </div>

      {/* TABLEAU */}
      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-brand font-bold uppercase text-xs tracking-widest">
          Chargement de l'équipe...
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Utilisateur" },
            { label: "Niveau d'Accès" },
            { label: "Date de Création" },
            { label: "Actions", align: "right" },
          ]}
        >
          {staff.length > 0 ? (
            staff.map((s) => (
              <tr
                key={s.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-t-main uppercase tracking-wider text-xs">
                  {s.username}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 w-max px-2 py-1 bg-green-50 border border-green-200 text-green-600 text-[9px] font-bold uppercase tracking-widest">
                    <ShieldCheck size={12} /> {s.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-t-muted font-mono text-xs">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenModal("edit", s)}
                  >
                    <Edit size={14} className="text-t-muted hover:text-brand" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDelete(s.id, s.username)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="4"
                className="py-12 text-center text-t-muted uppercase text-xs font-bold tracking-widest"
              >
                Aucun serveur enregistré
              </td>
            </tr>
          )}
        </DataTable>
      )}

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <div className="p-8">
          <h3 className="text-xl font-serif font-bold text-brand uppercase border-b border-subtle pb-4 mb-8 tracking-widest">
            {modalMode === "add" ? "Nouvel Accès Caisse" : "Modifier Accès"}
          </h3>

          <div className="space-y-6">
            <div className="w-full">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-2">
                Identifiant de connexion *
              </label>
              <input
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:border-brand focus:outline-none rounded-none font-bold text-xs"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                } // Force lowercase sans espaces
                placeholder="Ex: amine_cafe"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="w-full">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-2">
                Mot de Passe{" "}
                {modalMode === "edit" && "(Laisser vide pour ne pas changer)"}
              </label>
              <input
                type="password"
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:border-brand focus:outline-none rounded-none font-mono text-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
