import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Key,
  RefreshCcw,
  ShieldAlert,
  BadgeAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";

// Cartographie visuelle des badges de rôles
const ROLE_THEMES = {
  admin: "bg-red-500/10 text-red-500 border border-red-500/20 font-bold",
  receptionist:
    "bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold",
  barber_global:
    "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold",
  barber:
    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold", // <-- NOUVEAU
};
export default function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" ou "edit"
  const [userToEdit, setUserToEdit] = useState(null);

  // Form State
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("receptionist");

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // Récupère tous les utilisateurs enregistrés
      const res = await api.get("/staff");
      setStaffList(res.data);
    } catch (err) {
      toast.error("Impossible de charger les utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    if (mode === "edit" && user) {
      setUserToEdit(user);
      setUsernameInput(user.username);
      setPasswordInput(""); // On ne préremplit pas le mot de passe pour la sécurité
      setRoleInput(user.role);
    } else {
      setUserToEdit(null);
      setUsernameInput("");
      setPasswordInput("");
      setRoleInput("receptionist");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return; // Empêche de fermer la modale si l'envoi API est en cours
    setIsModalOpen(false);
    setUserToEdit(null);
    setUsernameInput("");
    setPasswordInput("");
    setRoleInput("receptionist");
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim())
      return toast.error("Le nom d'utilisateur est requis.");
    if (modalMode === "add" && !passwordInput)
      return toast.error("Le mot de passe est obligatoire.");

    setIsSubmitting(true);
    try {
      const payload = {
        username: usernameInput.trim(),
        role: roleInput,
      };

      // On ajoute le mot de passe seulement s'il est tapé (requis à l'ajout, facultatif à l'édition)
      if (passwordInput.trim() !== "") {
        payload.password = passwordInput.trim();
      }

      if (modalMode === "add") {
        await api.post("/staff", payload);
        toast.success(`Compte ${usernameInput} créé avec succès !`);
      } else {
        await api.put(`/staff/${userToEdit.id}`, payload);
        toast.success(`Compte ${usernameInput} mis à jour !`);
      }

      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer définitivement le compte de ${name} ?`)) {
      try {
        await api.delete(`/staff/${id}`);
        toast.success("Compte supprimé.");
        fetchStaff();
      } catch (err) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE GESTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Key className="text-brand" size={24} /> Comptes d'Accès Système
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez les comptes des réceptionnistes et du personnel pour l'accès
            aux ordinateurs de caisse.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-sm"
        >
          <UserPlus size={18} /> Nouveau Compte
        </Button>
      </div>

      {/* TABLEAU DES COMPTES */}
      <DataTable
        headers={[
          { label: "Nom d'utilisateur" },
          { label: "Mot de Passe / PIN" },
          { label: "Rôle d'accès" },
          { label: "Date de création" },
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="4"
              className="py-12 text-center text-brand flex flex-col items-center gap-3"
            >
              <RefreshCcw className="animate-spin w-8 h-8" />
              <span className="font-bold text-lg">
                Chargement de l'équipe...
              </span>
            </td>
          </tr>
        ) : staffList.length === 0 ? (
          <tr>
            <td
              colSpan="4"
              className="py-12 text-center text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
            >
              Aucun compte utilisateur configuré.
            </td>
          </tr>
        ) : (
          staffList.map((st) => (
            <tr
              key={st.id}
              className="border-b border-subtle hover:bg-brand/5 transition-all"
            >
              <td className="px-6 py-4 font-bold text-t-main uppercase text-sm">
                {st.username}
              </td>
              {/* --- AFFICHAGE DU MOT DE PASSE EN CLAIR --- */}
              <td className="px-6 py-4 font-mono font-bold text-brand tracking-widest text-lg">
                {st.password}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 text-xs uppercase border rounded-none shadow-sm ${ROLE_THEMES[st.role] || ROLE_THEMES.receptionist}`}
                >
                  {st.role === "admin"
                    ? "Administrateur"
                    : st.role === "receptionist"
                      ? "Réceptionniste"
                      : st.role === "barber_global"
                        ? "Tablette Barbiers"
                        : "Coiffeur"}
                </span>
              </td>
              <td className="px-6 py-4 text-xs font-mono font-bold text-t-muted">
                {new Date(st.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                {/* On bloque l'édition/suppression pour le rôle "barber" car ça se gère dans l'équipe de coiffure */}
                {st.role !== "barber" ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenModal("edit", st)}
                      className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                    >
                      <Edit size={16} /> Modifier
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(st.id, st.username)}
                      className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-t-muted italic py-2">
                    Géré via l'onglet "Équipe"
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* --- MODAL AJOUT / ÉDITION --- */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <form onSubmit={handleSave} className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add" ? "Créer un Compte" : "Modifier le Compte"}
          </h3>

          <div className="space-y-4">
            <Input
              label="Nom d'utilisateur *"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              placeholder="Ex: caisse_entree"
              autoFocus
            />

            <Input
              label={
                modalMode === "add"
                  ? "Mot de Passe / PIN d'accès *"
                  : "Nouveau Mot de Passe (Laisser vide si inchangé)"
              }
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required={modalMode === "add"}
              placeholder="Ex: 0000"
            />

            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Rôle d'Accès *
              </label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase"
              >
                <option value="receptionist">
                  Réceptionniste (Accès Caisse & Salon)
                </option>
                <option value="barber_global">
                  Tablette Globale Barbiers (Interface arrière-salle)
                </option>
                <option value="admin">
                  Administrateur / Gérant (Accès complet)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseModal}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
