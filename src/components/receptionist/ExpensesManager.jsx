import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit, // <-- NOUVEL IMPORT
  RefreshCcw,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";

const CATEGORY_THEMES = {
  loyer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  electricite: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  eau: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  salaire: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  maintenance: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  autre: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const emptyForm = {
  title: "",
  amount: "",
  category: "loyer",
  reference: "",
  date: "",
};

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State (Gestion Ajout & Édition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" ou "edit"
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data);
    } catch (err) {
      toast.error("Échec de synchronisation des charges.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Ouvrir en mode création
  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10), // Date du jour par défaut
    });
    setIsModalOpen(true);
  };

  // Ouvrir en mode modification
  const handleOpenEdit = (expense) => {
    setModalMode("edit");
    setEditingId(expense.id);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      reference: expense.reference || "",
      date: expense.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) {
      return toast.error(
        "Le libellé, le montant et la catégorie sont obligatoires.",
      );
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date ? new Date(formData.date) : new Date(),
      };

      if (modalMode === "add") {
        await api.post("/expenses", payload);
        toast.success("Charge fixe enregistrée !");
      } else {
        await api.put(`/expenses/${editingId}`, payload);
        toast.success("Charge modifiée avec succès !");
      }

      setIsModalOpen(false);
      setFormData(emptyForm);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer définitivement la charge "${title}" ?`))
      return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Charge supprimée.");
      fetchExpenses();
    } catch (err) {
      toast.error("Erreur de suppression.");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <TrendingDown className="text-red-500" size={24} /> Registre des
            Charges (OPEX)
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Enregistrez et modifiez les dépenses de fonctionnement du salon
            (loyer, factures, achats de produits...).
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-main border border-red-500/20 px-4 py-2 text-right shadow-inner w-full md:w-auto">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
              Cumul des Charges Saisies
            </p>
            <p className="text-xl font-mono font-bold text-red-500 mt-1">
              DZD {totalExpenses.toFixed(2)}
            </p>
          </div>
          <Button
            variant="success"
            onClick={handleOpenAdd}
            className="py-3 px-6 text-sm shrink-0"
          >
            <Plus size={18} /> Nouvelle Charge
          </Button>
        </div>
      </div>

      {/* TABLEAU DES CHARGES AVEC PAGINATION ET ÉDITION */}
      <DataTable
        headers={[
          { label: "Date de paiement" },
          { label: "Catégorie" },
          { label: "Libellé de la dépense" },
          { label: "N° Facture / BL" },
          { label: "Montant Payé", align: "right" },
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="6"
              className="py-12 text-center text-brand flex flex-col items-center gap-3"
            >
              <RefreshCcw className="animate-spin w-8 h-8" />
              <span className="font-bold text-lg">
                Synchronisation des registres...
              </span>
            </td>
          </tr>
        ) : expenses.length === 0 ? (
          <tr>
            <td
              colSpan="6"
              className="py-12 text-center text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
            >
              Aucune charge enregistrée pour le moment.
            </td>
          </tr>
        ) : (
          expenses.map((e) => (
            <tr
              key={e.id}
              className="border-b border-subtle hover:bg-brand/5 transition-colors"
            >
              <td className="px-6 py-4 text-xs font-mono font-bold text-t-muted">
                {new Date(e.date).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 font-bold text-xs border rounded-none shadow-sm ${
                    CATEGORY_THEMES[e.category] || CATEGORY_THEMES.autre
                  }`}
                >
                  {e.category.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-t-main uppercase text-sm">
                {e.title}
              </td>
              <td className="px-6 py-4 font-mono font-bold text-xs text-t-muted">
                {e.reference || "--"}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="inline-block px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-sm">
                  DZD {e.amount.toFixed(2)}
                </span>
              </td>

              {/* ACTIONS : BOUTON MODIFIER (BLEU) ET SUPPRIMER (ROUGE) */}
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleOpenEdit(e)}
                  className="py-2 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  title="Modifier cette dépense"
                >
                  <Edit size={15} className="mr-1" /> Modifier
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(e.id, e.title)}
                  className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                  title="Supprimer cette dépense"
                >
                  <Trash2 size={15} />
                </Button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* MODAL : NOUVELLE CHARGE OU MODIFICATION */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="p-8 bg-surface">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4 flex items-center gap-2">
            <Receipt className="text-brand" />{" "}
            {modalMode === "add"
              ? "Enregistrer une Charge Fixe"
              : "Modifier la Charge"}
          </h3>

          <div className="space-y-4">
            <Input
              label="Libellé / Désignation de la charge *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="Ex: Loyer Local commercial - Juin 2026"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant réglé (DZD) *"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                placeholder="0.00"
              />

              <div className="w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Catégorie de la charge *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase"
                >
                  <option value="loyer">Loyer (Location)</option>
                  <option value="electricite">Électricité (Sonelgaz)</option>
                  <option value="eau">Eau (ADE)</option>
                  <option value="salaire">Salaire Employé</option>
                  <option value="maintenance">Maintenance / Travaux</option>
                  <option value="autre">Autre Dépense / Achat Stock</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="N° Facture / Reçu papier"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="Ex: Sonelgaz-9201"
              />
              <div className="w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Date de Paiement
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-mono font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-subtle">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                type="button"
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
                {isSubmitting
                  ? "Enregistrement..."
                  : modalMode === "add"
                    ? "Enregistrer la Charge"
                    : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
