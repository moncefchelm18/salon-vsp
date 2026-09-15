import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Coins,
  RefreshCcw,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function ArdoiseManager() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modale Créer/Éditer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' ou 'edit'
  const [clientToEdit, setClientToEdit] = useState(null);

  const [formData, setFormData] = useState({ name: "", phone: "" });

  // Modale Paiement Ardoise
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [clientToPay, setClientToPay] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (err) {
      toast.error("Erreur de chargement des clients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (mode, client = null) => {
    setModalMode(mode);
    setClientToEdit(client);
    setFormData({
      name: client ? client.name : "",
      phone: client ? client.phone || "" : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Le nom est obligatoire");

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await api.post("/clients", formData);
        toast.success("Client enregistré !");
      } else {
        await api.put(`/clients/${clientToEdit.id}`, formData);
        toast.success("Client mis à jour !");
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement la fiche de "${name}" ?`))
      return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success("Client supprimé.");
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de suppression.");
    }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return toast.error("Montant invalide");
    if (amount > clientToPay.debt)
      return toast.error("Le montant dépasse la dette !");

    setIsSubmitting(true);
    try {
      await api.post(`/clients/${clientToPay.id}/pay`, { amount });
      toast.success(
        `Dette de ${amount} DZD réglée ! (Argent ajouté en caisse)`,
      );
      setIsPayModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Erreur de paiement. La caisse est-elle ouverte ?",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDebts = clients.reduce((sum, c) => sum + c.debt, 0);

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Users className="text-brand" size={24} /> Fichier Clients &amp;
            Ardoises
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez vos clients fidèles, leur historique de visites et le
            remboursement de leurs crédits.
          </p>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="bg-main border border-red-500/20 px-4 py-2 text-right shadow-inner">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
              Total Dettes Clients (Dehors)
            </p>
            <p className="text-xl font-mono font-bold text-red-500">
              DZD {totalDebts.toFixed(2)}
            </p>
          </div>
          <Button
            variant="success"
            onClick={() => handleOpenModal("add")}
            className="py-3 px-6 text-sm shadow-md"
          >
            <UserPlus size={16} className="mr-2" /> Nouveau Client
          </Button>
        </div>
      </div>

      {/* ── TABLEAU CRM ── */}
      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-brand font-bold uppercase tracking-widest text-xs">
          Synchronisation du carnet clients...
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Nom du Client" },
            { label: "Contact" },
            { label: "Inscription" },
            { label: "Dernière Visite" },
            { label: "Fréquence" },
            { label: "Solde Ardoise (Dette)", align: "right" },
            { label: "Actions", align: "right" },
          ]}
        >
          {clients.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                className="text-center py-12 text-t-muted font-bold uppercase tracking-widest text-xs border border-subtle border-dashed bg-surface m-4"
              >
                Aucun client enregistré.
              </td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors group"
              >
                <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                  {client.name}
                </td>

                <td className="px-6 py-4 font-mono font-bold text-t-muted text-[10px]">
                  {client.phone || "--"}
                </td>

                <td className="px-6 py-4 text-[10px] text-t-muted uppercase font-bold">
                  {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                </td>

                <td className="px-6 py-4 text-[10px] text-t-muted uppercase font-bold">
                  {client.lastVisit
                    ? new Date(client.lastVisit).toLocaleDateString("fr-FR")
                    : "--"}
                </td>

                <td className="px-6 py-4">
                  <span className="bg-main border border-subtle px-2 py-1 text-[10px] font-bold text-t-main uppercase">
                    {client._count?.tickets || 0} coupes
                  </span>
                </td>

                {/* BADGE DE DETTE */}
                <td className="px-6 py-4 text-right">
                  {client.debt > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-sm shadow-sm">
                      DZD {client.debt.toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-[10px] uppercase shadow-sm">
                      <CheckCircle size={10} /> Réglé
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {client.debt > 0 && (
                    <Button
                      variant="success"
                      onClick={() => {
                        setClientToPay(client);
                        setPayAmount(client.debt.toString());
                        setIsPayModalOpen(true);
                      }}
                      className="py-1.5 px-3 text-[10px] shadow-md mr-2"
                      title="Rembourser la dette"
                    >
                      <CreditCard size={14} className="mr-1.5" /> Encaisser
                      Dette
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenModal("edit", client)}
                    className="p-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    className="p-2 text-xs bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}

      {/* ── MODAL : CRÉER / ÉDITER CLIENT ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <form onSubmit={handleSaveClient} className="p-8 bg-surface">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add"
              ? "Créer une Fiche Client"
              : "Modifier la Fiche Client"}
          </h3>
          <div className="space-y-4">
            <Input
              label="Nom Complet *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Ex: Karim Benhabib"
              autoFocus
            />
            <Input
              label="Numéro de Téléphone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Ex: 0550 12 34 56"
            />
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={isSubmitting}
                className="py-4 font-bold shadow-md"
              >
                {isSubmitting ? "Enregistrement..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODAL : REMBOURSER L'ARDOISE ── */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => !isSubmitting && setIsPayModalOpen(false)}
      >
        <form
          onSubmit={handlePayDebt}
          className="p-8 bg-surface border-t-4 border-amber-500"
        >
          <h3 className="text-xl font-serif font-bold text-t-main mb-4 uppercase tracking-widest text-center">
            Remboursement de Crédit
          </h3>
          <p className="text-[10px] text-t-muted text-center uppercase font-bold tracking-widest border-b border-subtle pb-4 mb-6">
            L'argent entrera immédiatement dans le tiroir-caisse
          </p>

          <div className="bg-main border border-subtle p-4 mb-6 flex justify-between items-center shadow-inner">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-t-muted">
                Client débiteur
              </p>
              <p className="font-bold text-t-main uppercase mt-0.5">
                {clientToPay?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-red-500">
                Dette Enregistrée
              </p>
              <p className="font-mono font-bold text-xl text-red-500 mt-0.5">
                DZD {clientToPay?.debt.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Montant Remboursé en Espèces (DZD) *"
              type="number"
              step="0.01"
              max={clientToPay?.debt}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                disabled={isSubmitting}
                className="py-4 font-bold text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={isSubmitting}
                className="py-4 font-bold text-xs shadow-lg shadow-green-500/20"
              >
                {isSubmitting ? "Traitement..." : "Encaisser & Clôturer"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
