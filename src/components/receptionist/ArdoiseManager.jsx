import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  CreditCard,
  CheckCircle,
  Search,
  AlertCircle,
  Coins,
  RefreshCcw,
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
  const [searchTerm, setSearchTerm] = useState("");

  // Create Client Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Pay Debt Modal
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

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return toast.error("Le nom est obligatoire");

    try {
      await api.post("/clients", {
        name: newClientName,
        phone: newClientPhone,
      });
      toast.success("Client enregistré !");
      setIsCreateModalOpen(false);
      setNewClientName("");
      setNewClientPhone("");
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de création");
    }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return toast.error("Montant invalide");
    if (amount > clientToPay.debt)
      return toast.error("Le montant dépasse la dette !");

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
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)),
  );

  const totalDebts = clients.reduce((sum, c) => sum + c.debt, 0);

  return (
    <div className="space-y-6">
      {/* EN-TÊTE : Design coloré et moderne avec bilan des dettes à l'extérieur */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Users className="text-brand" size={24} /> Fichier Clients &
            Ardoises
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez la liste de vos clients fidèles et le suivi de leurs ardoises.
          </p>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto">
          {/* Badge de Dette Globale mis en valeur */}
          <div className="bg-main border border-red-500/20 px-4 py-2 text-right shadow-inner">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
              Total Dettes Clients Dehors
            </p>
            <p className="text-xl font-mono font-bold text-red-500">
              DZD {totalDebts.toFixed(2)}
            </p>
          </div>
          <Button
            variant="success" // <-- CHANGÉ EN VERT (Action positive)
            onClick={() => setIsCreateModalOpen(true)}
            className="py-3 px-6 text-sm"
          >
            <UserPlus size={16} /> Enregistrer Client
          </Button>
        </div>
      </div>

      {/* ZONE DE RECHERCHE TACTILE */}
      <div className="bg-surface border border-subtle p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted"
          />
          <input
            placeholder="Rechercher un client (Nom ou Tél)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-main border border-subtle text-t-main px-4 py-2.5 pl-9 text-xs focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* TABLEAU DES CLIENTS ET DES CRÉDITS */}
      <DataTable
        headers={[
          { label: "Nom du Client" },
          { label: "Numéro de Téléphone" },
          { label: "Fréquence Visites" },
          { label: "Solde Ardoise (Dette)" },
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="5"
              className="py-12 text-center text-brand flex flex-col items-center gap-3"
            >
              <RefreshCcw className="animate-spin w-8 h-8" />
              <span className="font-bold text-lg">
                Mise à jour du fichier...
              </span>
            </td>
          </tr>
        ) : filteredClients.length === 0 ? (
          <tr>
            <td
              colSpan="5"
              className="text-center py-12 text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
            >
              Aucun client enregistré dans le carnet.
            </td>
          </tr>
        ) : (
          filteredClients.map((client) => (
            <tr
              key={client.id}
              className="border-b border-subtle hover:bg-brand/5 transition-colors"
            >
              <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                {client.name}
              </td>
              <td className="px-6 py-4 font-mono font-bold text-t-muted text-xs">
                {client.phone || "--"}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-t-muted">
                {client._count?.tickets || 0} visite(s) au salon
              </td>

              {/* BADGES DE DETTE CRISTALLINS (Vert / Rouge) */}
              <td className="px-6 py-4">
                {client.debt > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-xs shadow-sm">
                    <AlertCircle size={12} /> DZD {client.debt.toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-xs shadow-sm">
                    <CheckCircle size={12} /> Réglé (0.00)
                  </span>
                )}
              </td>

              {/* BOUTON REMBOURSER VERT SOLID */}
              <td className="px-6 py-4 text-right">
                {client.debt > 0 && (
                  <Button
                    variant="success" // <-- CHANGÉ EN SOLID SUCCESS (Vert franc)
                    onClick={() => {
                      setClientToPay(client);
                      setPayAmount(client.debt.toString());
                      setIsPayModalOpen(true);
                    }}
                    className="py-2 px-4 text-xs font-bold shadow-md shadow-green-500/10"
                  >
                    <CreditCard size={14} className="mr-2" /> Rembourser
                  </Button>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* MODAL : ENREGISTRER UN NOUVEAU CLIENT */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form onSubmit={handleCreateClient} className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            Créer une Fiche Client
          </h3>
          <div className="space-y-4">
            <Input
              label="Nom Complet *"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              required
              placeholder="Ex: Karim Benhabib"
            />
            <Input
              label="Numéro de Téléphone"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Ex: 0550 12 34 56"
            />
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="py-4 font-bold"
              >
                Enregistrer Client
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL : REMBOURSER L'ARDOISE */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)}>
        <form onSubmit={handlePayDebt} className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-4 border-b border-subtle pb-4">
            Encaisser un Remboursement d'Ardoise
          </h3>

          <div className="bg-main border border-subtle p-4 mb-6 flex justify-between items-center shadow-inner">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-t-muted">
                Client débiteur
              </p>
              <p className="font-bold text-t-main uppercase">
                {clientToPay?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-red-500">
                Montant de l'ardoise
              </p>
              <p className="font-mono font-bold text-xl text-red-500">
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
            <p className="text-xs text-t-muted italic text-center flex items-center justify-center gap-1.5 bg-main p-2 border border-subtle">
              <Coins size={14} className="text-brand animate-pulse" />
              Ce montant sera automatiquement enregistré dans le tiroir-caisse
              d'aujourd'hui.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="py-4 font-bold"
              >
                Encaisser & Clôturer la dette
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
