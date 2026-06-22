import { useState, useEffect } from "react";
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
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Input from "../common/Input";

export default function SettingsView() {
  // Matériel & Statuts (Mockés pour l'instant)
  const [printerStatus, setPrinterStatus] = useState("connected");
  const [localIp, setLocalIp] = useState("192.168.1.100:3000"); // Utile pour connecter les iPads

  // --- NOUVEAUX ÉTATS PARAMÈTRES SYSTÈME (REELS) ---
  const [businessDayStartHour, setBusinessDayStartHour] = useState("0"); // Heure de bascule
  const [taxRate, setTaxRate] = useState("20"); // TVA percentage
  const [receiptFooter, setReceiptFooter] = useState(
    "Merci de votre visite à Sallon Picasso !",
  );

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. CHARGER LES PARAMÈTRES DEPUIS LA BDD ---
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/settings");
      // On injecte les valeurs de la base de données (avec valeurs par défaut s'ils sont vides)
      setBusinessDayStartHour(res.data.business_day_start_hour || "0");
      setTaxRate(res.data.tax_rate || "20");
      setReceiptFooter(
        res.data.receipt_footer || "Merci pour votre visite à Sallon Picasso !",
      );
    } catch (err) {
      toast.error("Impossible de récupérer les paramètres.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // --- 2. SAUVEGARDER LES PARAMÈTRES EN BULK ---
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/settings", {
        business_day_start_hour: businessDayStartHour,
        tax_rate: taxRate,
        receipt_footer: receiptFooter,
      });
      toast.success("Paramètres enregistrés avec succès !");
    } catch (err) {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDb = () => {
    // Dans le futur, cette route lancera le téléchargement du fichier dev.db
    alert(
      "Simulation : Téléchargement du fichier de secours (picasso_backup.db)...",
    );
  };

  const handleRefreshHardware = () => {
    setPrinterStatus("refreshing...");
    setTimeout(() => {
      setPrinterStatus("connected");
      toast.success("Périphériques actualisés.");
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold">
        Chargement de la configuration...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Settings2 className="text-brand" size={24} /> Paramètres du Système
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Configurez le matériel de caisse, le réseau local, la TVA et l'heure
            de bascule.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE : MATÉRIEL & BDD */}
        <div className="space-y-6">
          {/* Connexions Matériel */}
          <div className="bg-surface border border-subtle p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-subtle pb-3">
              <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-wider">
                Connexions Matériel
              </h3>
              <button
                onClick={handleRefreshHardware}
                className="text-t-muted hover:text-brand transition-colors"
                title="Actualiser les périphériques"
              >
                <RefreshCcw
                  size={18}
                  className={
                    printerStatus === "refreshing..." ? "animate-spin" : ""
                  }
                />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imprimante Thermique */}
              <div className="flex items-center justify-between p-3 bg-main border border-subtle shadow-inner">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 bg-surface ${printerStatus === "connected" ? "text-brand" : "text-t-muted"}`}
                  >
                    <Printer size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-t-main text-sm">
                      Imprimante Thermique (USB)
                    </p>
                    <p className="text-xs text-t-muted">
                      Tickets de caisse physiques
                    </p>
                  </div>
                </div>
                <div>
                  {printerStatus === "connected" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-xs shadow-sm">
                      <CheckCircle2 size={12} /> Connecté
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs shadow-sm">
                      <XCircle size={12} /> Déconnecté
                    </span>
                  )}
                </div>
              </div>

              {/* Réseau iPads */}
              <div className="flex items-center justify-between p-3 bg-main border border-subtle shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface text-blue-500">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-t-main text-sm">
                      Réseau Local (iPads)
                    </p>
                    <p className="text-xs text-t-muted">
                      Adresse d'accès pour les coiffeurs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <code className="text-xs font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 select-all cursor-pointer">
                    http://{localIp}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Sauvegarde Base de données */}
          <div className="bg-surface border border-subtle p-6 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-wider border-b border-subtle pb-3 mb-6">
              Base de Données
            </h3>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-t-main text-sm font-semibold">
                <Database size={16} className="text-green-500" />
                <span>SQLite (dev.db) — Active et Connectée</span>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={handleBackupDb}
              className="py-3.5 bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
            >
              <Download size={18} /> Sauvegarder la base de données
            </Button>
            <p className="text-xs text-t-muted mt-3 text-center italic">
              Conseillé : Effectuer un backup hebdomadaire pour sécuriser vos
              ventes.
            </p>
          </div>
        </div>

        {/* COLONNE DROITE : PRÉFÉRENCES DE CAISSE ET HEURE DE BASCULE */}
        <div className="bg-surface border border-subtle p-6 h-fit shadow-sm">
          <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-wider border-b border-subtle pb-3 mb-6">
            Préférences de Caisse
          </h3>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* 1. L'HEURE DE BASCULE COMPTABLE (DYNAMIQUE) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Heure de bascule (Fin de journée comptable)
              </label>
              <div className="relative">
                <select
                  value={businessDayStartHour}
                  onChange={(e) => setBusinessDayStartHour(e.target.value)}
                  className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase"
                >
                  <option value="0">Minuit (00h00)</option>
                  <option value="1">01h00 du matin</option>
                  <option value="2">02h00 du matin</option>
                  <option value="3">03h00 du matin</option>
                  <option value="4">04h00 du matin</option>
                  <option value="5">05h00 du matin</option>
                  <option value="6">06h00 du matin (Défaut)</option>
                  <option value="7">07h00 du matin</option>
                  <option value="8">08h00 du matin</option>
                </select>
              </div>
              <p className="text-[10px] text-t-muted italic mt-1.5 uppercase leading-relaxed font-semibold">
                Heure à laquelle la caisse se réinitialise pour le lendemain.
              </p>
            </div>

            {/* Tax Setup */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Taux de TVA par Défaut (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-mono font-bold text-sm"
              />
            </div>

            {/* Message bas de ticket */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Message en bas de ticket (Impression)
              </label>
              <textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                rows={3}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-medium text-xs resize-none"
              />
            </div>

            {/* BOUTON DE SAUVEGARDE VERT SOLIDE */}
            <Button
              variant="success"
              type="submit"
              disabled={saving}
              className="w-full py-4 text-xs font-bold shadow-lg shadow-green-500/20"
            >
              <Save size={18} />
              {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
