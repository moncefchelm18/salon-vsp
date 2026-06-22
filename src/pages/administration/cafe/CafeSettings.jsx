import { useState } from "react";
import {
  Printer,
  Database,
  Wifi,
  Save,
  Download,
  Settings2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Receipt,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Common UI
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";

export default function CafeSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [printerStatus, setPrinterStatus] = useState("connected");
  const [localIp, setLocalIp] = useState("192.168.1.13:3000"); // Simulation de l'IP du serveur Node

  // --- ÉTATS DU FORMULAIRE DE CONFIGURATION ---
  const [formData, setFormData] = useState({
    receiptHeader: "SALLON PICASSO - ESPACE CAFÉ",
    receiptPhone: "0550 XX XX XX",
    receiptFooter: "Merci pour votre visite ! Bon appétit !",
    defaultTaxRate: "19", // TVA par défaut en Algérie (19% ou 9% selon les produits)
    taxMode: "included", // "included" (TTC) ou "added" (HT + TVA)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    // Simulation d'une sauvegarde en base de données ou dans un fichier de configuration
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Paramètres de la cafétéria mis à jour.");
    }, 800);
  };

  const handleRefreshHardware = () => {
    setPrinterStatus("refreshing...");
    setTimeout(() => {
      setPrinterStatus("connected");
      toast.success("Imprimante synchronisée.");
    }, 1500);
  };

  const handleBackupDb = () => {
    // Le vrai backup impliquera une route backend qui envoie le fichier "dev.db" au navigateur
    // Ex: window.location.href = "http://localhost:5000/api/system/backup";
    toast.success("Téléchargement de la base de données initié...");
  };

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
            <Settings2 className="text-brand" size={24} /> Paramètres Système
          </h2>
          <p className="text-t-muted text-[10px] font-bold uppercase mt-1 tracking-widest italic">
            Configuration matérielle, comptable et tickets de caisse
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ======================================================== */}
        {/* COLONNE GAUCHE : MATÉRIEL ET SYSTÈME                       */}
        {/* ======================================================== */}
        <div className="space-y-8">
          {/* --- CONNEXIONS MATÉRIEL --- */}
          <div className="bg-surface border border-subtle p-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-subtle pb-4 mb-6">
              <h3 className="text-sm font-bold text-brand uppercase tracking-widest">
                Matériel & Réseau
              </h3>
              <button
                onClick={handleRefreshHardware}
                className="text-t-muted hover:text-brand transition-colors"
              >
                <RefreshCcw
                  size={16}
                  className={
                    printerStatus === "refreshing..." ? "animate-spin" : ""
                  }
                />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imprimante Thermique */}
              <div className="flex items-center justify-between p-4 bg-main border border-subtle">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 bg-surface border border-subtle ${printerStatus === "connected" ? "text-brand" : "text-t-muted"}`}
                  >
                    <Printer size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-t-main text-xs uppercase tracking-wider">
                      Imprimante Caisse (USB)
                    </p>
                    <p className="text-[10px] text-t-muted uppercase font-bold tracking-widest mt-1">
                      Pour reçus clients
                    </p>
                  </div>
                </div>
                <div>
                  {printerStatus === "connected" ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-widest bg-green-50 px-2 py-1 border border-green-200">
                      <CheckCircle2 size={12} /> Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2 py-1 border border-red-200">
                      <XCircle size={12} /> Inactif
                    </span>
                  )}
                </div>
              </div>

              {/* Réseau Local */}
              <div className="flex items-center justify-between p-4 bg-main border border-subtle">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-surface border border-subtle text-blue-500">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-t-main text-xs uppercase tracking-wider">
                      Accès Serveur (WIFI)
                    </p>
                    <p className="text-[10px] text-t-muted uppercase font-bold tracking-widest mt-1">
                      Lien pour autres appareils
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <code className="text-xs font-mono font-bold text-brand bg-brand/10 px-2 py-1 border border-brand/20 select-all cursor-pointer">
                    http://{localIp}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* --- SAUVEGARDE BASE DE DONNÉES --- */}
          <div className="bg-surface border border-subtle p-8 shadow-sm">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest border-b border-subtle pb-4 mb-6 flex items-center gap-2">
              <Database size={16} /> Sécurité des Données
            </h3>

            <p className="text-xs text-t-main mb-6 leading-relaxed">
              Téléchargez une copie physique complète de votre base de données
              SQLite. Conservez ce fichier en sécurité sur une clé USB pour
              protéger votre historique comptable.
            </p>

            <Button
              variant="outline"
              fullWidth
              onClick={handleBackupDb}
              className="py-5 flex items-center justify-center gap-2 border-red-500/30 text-red-500 hover:bg-red-50 hover:border-red-500"
            >
              <Download size={18} />
              Générer Backup Complet (backup.db)
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLONNE DROITE : TICKET, FISCALITÉ ET VALIDATION         */}
        {/* ======================================================== */}
        <div className="bg-surface border border-subtle p-8 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-brand uppercase tracking-widest border-b border-subtle pb-4 mb-8 flex items-center gap-2">
            <Receipt size={18} /> Configuration du Ticket (POS)
          </h3>

          <div className="space-y-6">
            {/* Header Ticket */}
            <div className="space-y-4 border-b border-subtle pb-6">
              <Input
                label="Nom d'En-tête du Reçu *"
                name="receiptHeader"
                value={formData.receiptHeader}
                onChange={handleChange}
              />
              <Input
                label="Téléphone Imprimé sur Reçu"
                name="receiptPhone"
                value={formData.receiptPhone}
                onChange={handleChange}
              />
            </div>

            {/* Fiscalité / TVA */}
            <div className="space-y-4 border-b border-subtle pb-6">
              <h4 className="text-[10px] font-bold text-t-muted uppercase tracking-widest mb-4">
                TVA (Algérie)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Taux de TVA par Défaut (%)"
                    type="number"
                    name="defaultTaxRate"
                    value={formData.defaultTaxRate}
                    onChange={handleChange}
                  />
                </div>
                <div className="w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-2">
                    Mode de Calcul
                  </label>
                  <select
                    name="taxMode"
                    value={formData.taxMode}
                    onChange={handleChange}
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:border-brand rounded-none appearance-none font-bold uppercase text-[10px]"
                  >
                    <option value="included">Prix TTC (TVA Incluse)</option>
                    <option value="added">Prix HT + TVA Ajoutée</option>
                  </select>
                </div>
              </div>
              <p className="text-[9px] text-brand italic font-bold uppercase tracking-tighter">
                Info: Ce taux s'appliquera par défaut aux nouveaux achats/ventes
                (modifiable par produit).
              </p>
            </div>

            {/* Footer Ticket */}
            <div className="space-y-4 pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-2">
                Message bas de ticket (Impression)
              </label>
              <textarea
                name="receiptFooter"
                value={formData.receiptFooter}
                onChange={handleChange}
                rows={3}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:border-brand focus:outline-none transition-all rounded-none font-bold text-xs resize-none"
              />
            </div>

            <div className="pt-8">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="py-5 shadow-lg shadow-brand/20 font-bold tracking-widest text-xs"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? "Traitement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
