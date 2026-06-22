import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  CheckCircle,
  Wallet,
  FileText,
  Activity,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";

export default function CafeSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
  });

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [supplierToPay, setSupplierToPay] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payReference, setPayReference] = useState("Espèces");

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [supplierHistory, setSupplierHistory] = useState(null);

  const loadSuppliers = async () => {
    try {
      const res = await api.get("/cafe/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      toast.error("Erreur de chargement des fournisseurs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // --- CRUD FOURNISSEURS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/cafe/suppliers/${editingSupplier.id}`, formData);
        toast.success("Fournisseur mis à jour");
      } else {
        await api.post("/cafe/suppliers", formData);
        toast.success("Fournisseur ajouté");
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      setFormData({ name: "", contact: "", phone: "" });
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde");
    }
  };

  // --- LOGIQUE DE PAIEMENT ---
  const handleOpenPayModal = (supplier) => {
    setSupplierToPay(supplier);
    setPayAmount(
      (supplier.balance || 0) > 0 ? (supplier.balance || 0).toString() : "0",
    );
    setPayReference("Espèces");
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0)
      return toast.error("Montant invalide");

    try {
      await api.post(`/cafe/suppliers/${supplierToPay.id}/pay`, {
        amount: parseFloat(payAmount),
        reference: payReference,
      });
      toast.success(`Paiement de ${payAmount} DZD enregistré !`);
      setIsPayModalOpen(false);
      loadSuppliers();
    } catch (err) {
      toast.error("Erreur lors de l'paiement");
    }
  };

  // --- CALCULS GLOBAUX ---
  const totalDebt = suppliers.reduce(
    (sum, s) => sum + (s.balance > 0 ? s.balance : 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* HEADER & STATS (Design solide et lisible) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Truck size={24} className="text-brand" /> Gestion Fournisseurs
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez vos grossistes, suivez vos dettes d'approvisionnement et
            enregistrez les paiements.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Badge de Dette Globale mis en valeur en rouge vif */}
          <div className="bg-main border border-red-500/20 px-4 py-2 text-right shadow-inner w-full md:w-auto">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
              Dette Totale Fournisseurs
            </p>
            <p className="text-xl font-mono font-bold text-red-500 mt-1">
              DZD {totalDebt.toFixed(2)}
            </p>
          </div>
          <Button
            variant="success"
            onClick={() => setIsModalOpen(true)}
            className="py-3 px-6 text-sm shrink-0"
          >
            <Plus size={18} /> Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* TABLEAU DES FOURNISSEURS (Boutons solides et badges nets) */}
      <DataTable
        headers={[
          { label: "Nom de l'Entreprise" },
          { label: "Contact & Téléphone" },
          { label: "Solde (Dette)" },
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="4"
              className="text-center py-12 text-brand font-bold animate-pulse text-lg"
            >
              Chargement des fournisseurs...
            </td>
          </tr>
        ) : suppliers.length === 0 ? (
          <tr>
            <td
              colSpan="4"
              className="text-center py-12 text-t-muted border border-subtle border-dashed bg-surface font-bold text-lg"
            >
              Aucun fournisseur enregistré.
            </td>
          </tr>
        ) : (
          suppliers.map((supplier) => (
            <tr
              key={supplier.id}
              className="border-b border-subtle hover:bg-brand/5 transition-colors"
            >
              <td className="px-6 py-4 font-bold text-t-main uppercase text-sm">
                {supplier.name}
              </td>
              <td className="px-6 py-4 text-xs font-medium text-t-muted uppercase">
                <span className="font-bold">{supplier.contact || "--"}</span>
                {supplier.phone && (
                  <span className="block text-[10px] font-mono mt-1 font-bold text-t-muted">
                    {supplier.phone}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {supplier.balance > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-xs shadow-sm">
                    <AlertCircle size={12} /> DZD {supplier.balance.toFixed(2)}
                  </span>
                ) : supplier.balance < 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 font-mono font-bold text-xs shadow-sm">
                    <PlusCircle size={12} /> Avance: DZD{" "}
                    {Math.abs(supplier.balance).toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-xs shadow-sm">
                    <CheckCircle size={12} /> Réglé (0.00)
                  </span>
                )}
              </td>

              {/* BOUTONS D'ACTION INTERACTIFS ET COLORÉS (Fini les boutons transparents) */}
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSupplierHistory(supplier);
                    setIsHistoryModalOpen(true);
                  }}
                  className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  title="Voir l'historique d'activité"
                >
                  <Activity size={16} /> Historique
                </Button>

                <Button
                  variant="success"
                  onClick={() => handleOpenPayModal(supplier)}
                  className="py-2 text-sm shadow-md"
                >
                  <Wallet size={16} className="mr-2" /> Payer
                </Button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* --- MODAL : PAYER FOURNISSEUR --- */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)}>
        {supplierToPay && (
          <div className="p-8">
            <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
              Régler un Fournisseur
            </h3>

            <div className="bg-main border border-subtle p-4 mb-6 flex justify-between items-center shadow-inner">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-t-muted">
                  Fournisseur créancier
                </p>
                <p className="font-bold text-t-main uppercase text-sm">
                  {supplierToPay.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-red-500">
                  Dette Enregistrée
                </p>
                <p className="font-mono font-bold text-xl text-red-500 mt-1">
                  DZD {(supplierToPay.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <Input
                label="Montant à payer au fournisseur (DZD) *"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              <div className="w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Mode de Décaissement *
                </label>
                <select
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs"
                >
                  <option value="Espèces">Espèces (Tiroir-Caisse)</option>
                  <option value="Chèque">Chèque Bancaire</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-subtle">
                <Button
                  variant="outline"
                  onClick={() => setIsPayModalOpen(false)}
                  type="button"
                  className="py-4 font-bold"
                >
                  Annuler
                </Button>
                <Button
                  variant="success"
                  type="submit"
                  className="py-4 font-bold"
                >
                  Valider le décaissement
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* --- MODAL : HISTORIQUE DE TRANSACTIONS (REÇUS) --- */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      >
        {supplierHistory && (
          <div className="p-8 max-h-[80vh] flex flex-col bg-surface">
            <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
              Historique des Paiements : {supplierHistory.name}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {supplierHistory.transactions?.length === 0 ? (
                <div className="py-8 text-center text-t-muted font-bold text-sm uppercase">
                  Aucun paiement enregistré pour ce grossiste.
                </div>
              ) : (
                supplierHistory.transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-t-main text-xs uppercase flex items-center gap-2">
                        <FileText size={14} className="text-brand" />{" "}
                        {tx.reference}
                      </p>
                      <p className="text-[10px] text-t-muted font-mono font-bold mt-1">
                        Le {new Date(tx.createdAt).toLocaleDateString("fr-FR")}{" "}
                        à{" "}
                        {new Date(tx.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 font-mono font-bold text-xs bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm">
                      - DZD {tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsHistoryModalOpen(false)}
                className="py-4 font-bold"
              >
                Fermer l'historique
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL : AJOUTER/ÉDITER FOURNISSEUR --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-8 bg-surface">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            Créer une Fiche Fournisseur
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom de l'Entreprise / Grossiste *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Ex: Café Bonal Algérie"
            />
            <Input
              label="Nom du Contact"
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
              placeholder="Ex: Slimane"
            />
            <Input
              label="Numéro de Téléphone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Ex: 0550 12 34 56"
            />
            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-subtle">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="py-4 font-bold"
              >
                Enregistrer Fournisseur
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
