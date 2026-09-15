import { useState, useEffect, useRef } from "react";
import {
  Printer,
  Database,
  Wifi,
  Save,
  Download,
  Upload,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  Copy,
  Receipt,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Monitor,
  Wallet,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Input from "../common/Input";
import Modal from "../common/Modal";
import ImageUpload from "../common/ImageUpload";
import ThermalReceipt from "../common/ThermalReceipt";

import { QRCodeSVG } from "qrcode.react";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState("hardware"); // 'hardware' ou 'tickets'
  const [previewType, setPreviewType] = useState("queue");

  // Infos Système & Imprimante Détectée
  const [systemInfo, setSystemInfo] = useState({
    localIp: "127.0.0.1",
    tabletUrl: "http://localhost:5000/coiffeur",
    dbSizeMB: "0.00",
  });
  const [detectedPrinter, setDetectedPrinter] = useState(null);

  // ── PARAMÈTRES MATÉRIEL : ÉCRAN VERT ARRIÈRE (COM2 VALIDÉ) ──
  const [customerDisplayPort, setCustomerDisplayPort] = useState("COM2");
  const [cashDrawerPort, setCashDrawerPort] = useState("COM3");

  // ── PARAMÈTRES TICKETS ──
  const [ticketSettings, setTicketSettings] = useState({
    receipt_logo: "",
    receipt_header_title: "Salon VSP",
    receipt_header_subtitle: "Coiffure Masculine & Espace Café",
    receipt_phone: "0550 00 00 00",
    receipt_address: "Alger, Algérie",
    receipt_footer: "Merci pour votre visite !\nÀ très bientôt.",
    receipt_queue_message: "Veuillez patienter, votre tour approche.",
  });

  // Paramètres Caisse & Cloud
  const [businessDayStartHour, setBusinessDayStartHour] = useState("6");
  const [dailyRevenueGoal, setDailyRevenueGoal] = useState("30000");
  const [cloudBackupUrl, setCloudBackupUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const [testPrintTrigger, setTestPrintTrigger] = useState(0);

  // États pour la Réinitialisation et l'Importation de la Base de Données
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // ── ÉTATS POUR LES MISES À JOUR AUTOMATIQUES (OTA) ──
  const [updateStatus, setUpdateStatus] = useState("idle"); // idle, checking, available, downloading, downloaded
  const [newVersion, setNewVersion] = useState("");
  const [downloadPercent, setDownloadPercent] = useState(0);

  const fileInputRef = useRef(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, infoRes] = await Promise.all([
        api.get("/settings"),
        api.get("/settings/info"),
      ]);

      setBusinessDayStartHour(settingsRes.data.business_day_start_hour || "6");
      setDailyRevenueGoal(settingsRes.data.daily_revenue_goal || "30000");
      setCloudBackupUrl(settingsRes.data.cloud_backup_url || "");
      setCustomerDisplayPort(settingsRes.data.customer_display_port || "COM2");
      setCashDrawerPort(settingsRes.data.cash_drawer_port || "COM3");

      setTicketSettings({
        receipt_logo: settingsRes.data.receipt_logo || "",
        receipt_header_title:
          settingsRes.data.receipt_header_title !== undefined
            ? settingsRes.data.receipt_header_title
            : "Salon VSP",
        receipt_header_subtitle: settingsRes.data.receipt_header_subtitle || "",
        receipt_phone: settingsRes.data.receipt_phone || "",
        receipt_address: settingsRes.data.receipt_address || "",
        receipt_footer:
          settingsRes.data.receipt_footer || "Merci pour votre visite !",
        receipt_queue_message:
          settingsRes.data.receipt_queue_message ||
          "Veuillez patienter, votre tour approche.",
      });

      setSystemInfo(infoRes.data);

      // Détection de l'imprimante réelle via Electron
      if (window.electronAPI && window.electronAPI.getPrinters) {
        const printers = await window.electronAPI.getPrinters();
        const active =
          printers.find((p) => {
            const n = p.name.toLowerCase();
            return (
              n.includes("xprinter") ||
              n.includes("xp-80") ||
              n.includes("pos-80")
            );
          }) ||
          printers.find((p) => p.isDefault) ||
          printers[0];
        setDetectedPrinter(active || null);
      }
    } catch (err) {
      toast.error("Erreur de synchronisation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ── ÉCOUTEURS D'ÉVÉNEMENTS ELECTRON POUR LA MISE À JOUR ──
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((version) => {
        setNewVersion(version);
        setUpdateStatus("available");
        toast.success(`Nouvelle version ${version} disponible !`);
      });

      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateStatus("idle");
        toast.success("Votre logiciel est déjà à jour !");
      });

      window.electronAPI.onDownloadProgress((percent) => {
        setUpdateStatus("downloading");
        setDownloadPercent(Math.round(percent));
      });

      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateStatus("downloaded");
        toast.success("Mise à jour prête ! Cliquez pour redémarrer.");
      });
    }
  }, []);

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        business_day_start_hour: businessDayStartHour,
        daily_revenue_goal: dailyRevenueGoal,
        cloud_backup_url: cloudBackupUrl.trim(),
        customer_display_port: customerDisplayPort,
        cash_drawer_port: cashDrawerPort,
        ...ticketSettings,
      };

      await api.post("/settings", payload);
      localStorage.setItem("vsp_receipt_settings", JSON.stringify(payload));
      toast.success("Paramètres enregistrés avec succès !");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // Test de l'écran vert client
  const handleTestDisplay = async () => {
    try {
      await api.post("/settings/customer-display", {
        amount: 1250.0,
        autoResetSeconds: 5,
      });
      toast.success("Affichage test (Retour à 0.00 dans 5 secondes)");
    } catch (e) {
      toast.error("Erreur de transmission à l'écran.");
    }
  };

  // Téléchargement sécurisé du Backup local
  const handleDownloadBackup = () => {
    const link = document.createElement("a");
    link.href = "/api/settings/backup";
    link.setAttribute(
      "download",
      `Salon_VSP_Backup_${new Date().toISOString().slice(0, 10)}.db`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Téléchargement du fichier dev.db lancé.");
  };

  // Importation d'un fichier .db
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".db")) {
      return toast.error(
        "Veuillez sélectionner un fichier valide se terminant par .db",
      );
    }

    if (
      !window.confirm(
        `Remplacer la base de données actuelle par "${file.name}" ? Vos données actuelles seront écrasées.`,
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        await api.post("/settings/import-db", { filedata: base64Data });
        toast.success("Base de données restaurée avec succès !");
        loadAllData();
      } catch (err) {
        toast.error("Échec de la restauration de la base de données.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Envoi Cloud Drive
  const handleSendCloudBackup = async () => {
    if (!cloudBackupUrl.trim())
      return toast.error("Veuillez renseigner l'URL Cloud ci-dessous.");
    setIsUploadingCloud(true);
    try {
      const res = await api.post("/settings/cloud-backup");
      toast.success(res.data.message);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Échec de l'envoi vers le Cloud.",
      );
    } finally {
      setIsUploadingCloud(false);
    }
  };

  // Réinitialisation d'usine complète (salonvspdelete)
  const handleConfirmResetDb = async (e) => {
    e.preventDefault();
    if (deletePassword !== "salonvspdelete") {
      return toast.error("Mot de passe de sécurité incorrect.");
    }

    setIsResetting(true);
    try {
      await api.post("/settings/reset-db", { password: deletePassword });
      toast.success("Base de données réinitialisée à zéro !");
      setIsResetModalOpen(false);
      setDeletePassword("");
      loadAllData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la réinitialisation.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  // Déclencher la recherche de mise à jour
  const handleTriggerCheckUpdates = () => {
    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      setUpdateStatus("checking");
      window.electronAPI.checkForUpdates();
    } else {
      toast.error(
        "Les mises à jour automatiques sont actives uniquement dans l'application installée (.exe).",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold">
        Chargement de la configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── ONGLETS DE NAVIGATION ── */}
      <div className="flex gap-2 p-1 bg-surface border border-subtle w-fit">
        <button
          onClick={() => setActiveTab("hardware")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "hardware"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Settings2 size={16} /> Matériel, Réseau &amp; Données
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "tickets"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Receipt size={16} /> Personnalisation des Tickets
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE 1 : MATÉRIEL, BDD, IMPRIMANTE, ÉCRAN CLIENT & MAJ
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "hardware" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* COLONNE GAUCHE : RÉSEAU, IMPRIMANTE & ÉCRAN CLIENT VERT */}
          <div className="space-y-6">
            {/* QR CODE & ADRESSE SERVEUR */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Wifi size={16} /> Accès Coiffeurs (Wi-Fi Local)
                </h3>
                <span className="text-[9px] font-mono font-bold bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5">
                  SERVEUR ACTIF
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-main p-4 border border-subtle">
                <div className="bg-slate-900 p-2 border-2 border-brand/40 shrink-0 shadow-lg">
                  <QRCodeSVG
                    value={systemInfo.tabletUrl}
                    size={128}
                    bgColor="#0f172a"
                    fgColor="#779e45"
                    level="H"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-t-muted">
                      IP Machine :
                    </span>
                    <p className="font-mono font-bold text-brand text-lg">
                      {systemInfo.localIp}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-t-muted">
                      Lien Tablette :
                    </span>
                    <code className="text-[11px] font-mono font-bold text-slate-200 bg-surface border border-subtle px-2 py-1 block truncate">
                      {systemInfo.tabletUrl}
                    </code>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(systemInfo.tabletUrl);
                      toast.success("Lien copié !");
                    }}
                    className="py-2 text-xs w-full justify-center mt-2"
                  >
                    <Copy size={13} className="mr-1.5" /> Copier l'URL
                  </Button>
                </div>
              </div>
            </div>

            {/* IMPRIMANTE THERMIQUE DÉTECTÉE */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Printer size={16} /> Imprimante Thermique (Détection Réelle)
              </h3>

              <div className="flex items-center justify-between p-4 bg-main border border-subtle mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-surface border border-subtle text-green-500">
                    <Printer size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-t-main text-xs uppercase">
                      {detectedPrinter
                        ? detectedPrinter.name
                        : "Xprinter XP-80"}
                    </p>
                    <p className="text-[10px] text-t-muted font-bold mt-0.5">
                      {detectedPrinter?.isDefault
                        ? "Définie par Défaut Windows (Recommandé)"
                        : "Imprimante USB connectée"}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase bg-green-500/10 border border-green-500/20 px-2 py-1">
                  <CheckCircle2 size={12} /> Prête
                </span>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setTestPrintTrigger((p) => p + 1);
                  toast.success("Impression test envoyée !");
                }}
                className="py-4 text-xs font-bold justify-center"
              >
                <Printer size={16} className="mr-2" /> Tester l'Imprimante
                (Sortie Ticket Directe)
              </Button>
            </div>

            {/* AFFICHEUR CLIENT ARRIÈRE (ÉCRAN VERT NEWPOS) */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Monitor size={16} /> Afficheur Client Arrière (Écran Vert
                NewPOS)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                    Port Série (COM) de l'afficheur arrière :
                  </label>
                  <select
                    value={customerDisplayPort}
                    onChange={(e) => setCustomerDisplayPort(e.target.value)}
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 font-bold text-xs uppercase focus:outline-none focus:border-brand rounded-none cursor-pointer"
                  >
                    <option value="COM2">COM2 (Standard Validé)</option>
                    <option value="COM1">COM1</option>
                    <option value="COM3">COM3</option>
                    <option value="COM4">COM4</option>
                    <option value="none">Désactivé</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleTestDisplay}
                    className="py-3 text-xs font-bold justify-center bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white"
                  >
                    <Sparkles size={15} className="mr-1.5" /> Tester (1250 DA)
                  </Button>

                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await api.post("/settings/customer-display", {
                          amount: 0,
                        });
                        toast.success("Écran remis à 0.00");
                      } catch (e) {
                        toast.error("Erreur.");
                      }
                    }}
                    className="py-3 text-xs font-bold justify-center"
                  >
                    Vider (0.00)
                  </Button>
                </div>
              </div>
            </div>

            {/* CARTE : TIROIR-CAISSE USB */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Wallet size={16} /> Tiroir-Caisse USB (Éjection Automatique)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                    Port Série COM du tiroir :
                  </label>
                  <select
                    value={cashDrawerPort}
                    onChange={(e) => setCashDrawerPort(e.target.value)}
                    className="w-full bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold focus:outline-none focus:border-brand rounded-none cursor-pointer"
                  >
                    <option value="COM3">COM 3 (Validé USB Prolific)</option>
                    <option value="COM1">COM 1</option>
                    <option value="COM2">COM 2</option>
                    <option value="COM4">COM 4</option>
                    <option value="none">Désactivé</option>
                  </select>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  onClick={async () => {
                    try {
                      await api.post("/settings/open-drawer");
                      toast.success("Signal d'ouverture envoyé !");
                    } catch (e) {
                      toast.error("Erreur de communication avec le tiroir.");
                    }
                  }}
                  className="py-3 text-xs font-bold justify-center"
                >
                  Tester l'Ouverture (Ouvrir le Tiroir)
                </Button>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : GESTION BDD, MISES À JOUR & ZONE DE DANGER */}
          <div className="space-y-6">
            {/* ── NOUVEAU : CARTE MISE À JOUR LOGICIEL (OTA) ── */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <ArrowDownCircle size={16} /> Mises à jour du Logiciel
                </h3>
                <span className="text-[10px] text-t-muted font-bold font-mono">
                  {updateStatus === "idle" && "Version 1.0.0"}
                  {updateStatus === "available" && `v${newVersion} prête`}
                  {updateStatus === "downloading" && `${downloadPercent}%`}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-t-muted leading-relaxed">
                  Vérifiez en un clic si une nouvelle version avec des
                  améliorations est disponible pour votre caisse.
                </p>

                {updateStatus === "idle" && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleTriggerCheckUpdates}
                    className="py-3.5 text-xs font-bold justify-center"
                  >
                    Rechercher une mise à jour
                  </Button>
                )}

                {updateStatus === "checking" && (
                  <div className="p-3 bg-main text-center text-xs font-bold text-amber-500 animate-pulse border border-subtle">
                    Vérification des mises à jour en cours...
                  </div>
                )}

                {updateStatus === "available" && (
                  <Button
                    variant="success"
                    fullWidth
                    onClick={() => window.electronAPI.downloadUpdate()}
                    className="py-3.5 text-xs font-bold justify-center"
                  >
                    Télécharger la Version {newVersion}
                  </Button>
                )}

                {updateStatus === "downloading" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold text-t-muted">
                      <span>Téléchargement...</span>
                      <span>{downloadPercent}%</span>
                    </div>
                    <div className="w-full bg-main h-3 border border-subtle overflow-hidden">
                      <div
                        className="bg-brand h-full transition-all duration-300"
                        style={{ width: `${downloadPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {updateStatus === "downloaded" && (
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => window.electronAPI.installUpdate()}
                    className="py-4 text-xs font-bold justify-center bg-green-600 hover:bg-green-500 text-white shadow-lg animate-pulse"
                  >
                    Redémarrer &amp; Installer la Mise à Jour
                  </Button>
                )}
              </div>
            </div>

            {/* CARTE SAUVEGARDE & IMPORT */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Database size={16} /> Sauvegardes &amp; Restauration BDD
                </h3>
                <span className="font-mono text-[10px] font-bold text-t-muted">
                  {systemInfo.dbSizeMB} MB
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".db"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Button
                  variant="secondary"
                  onClick={handleDownloadBackup}
                  className="py-3.5 text-xs font-bold justify-center"
                >
                  <Download size={15} className="mr-1.5" /> Exporter (.db)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3.5 text-xs font-bold justify-center bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500 hover:text-white"
                >
                  <Upload size={15} className="mr-1.5" /> Importer Backup (.db)
                </Button>
              </div>

              <Button
                variant="success"
                fullWidth
                onClick={handleSendCloudBackup}
                disabled={isUploadingCloud}
                className="py-3.5 text-xs font-bold justify-center mb-4"
              >
                <CloudUpload size={15} className="mr-1.5" />{" "}
                {isUploadingCloud
                  ? "Envoi en cours..."
                  : "Sauvegarder dans le Cloud (Drive)"}
              </Button>

              <div className="bg-main p-3 border border-subtle space-y-1">
                <label className="text-[10px] font-bold uppercase text-t-muted">
                  Lien Webhook Cloud Google Drive :
                </label>
                <input
                  type="url"
                  value={cloudBackupUrl}
                  onChange={(e) => setCloudBackupUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-surface border border-subtle text-t-main px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* RÈGLES DE CAISSE ET OBJECTIF */}
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Receipt size={16} /> Règle de Clôture &amp; Objectif
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                    Heure de bascule comptable (Fin de journée)
                  </label>
                  <select
                    value={businessDayStartHour}
                    onChange={(e) => setBusinessDayStartHour(e.target.value)}
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 font-bold text-xs uppercase focus:outline-none focus:border-brand rounded-none cursor-pointer"
                  >
                    <option value="0">Minuit (00h00)</option>
                    <option value="2">02h00 du matin</option>
                    <option value="4">04h00 du matin</option>
                    <option value="6">
                      06h00 du matin (Recommandé Salon de nuit)
                    </option>
                    <option value="8">08h00 du matin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                    Objectif de Chiffre d'Affaires Journalier (DZD)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={dailyRevenueGoal}
                    onChange={(e) => setDailyRevenueGoal(e.target.value)}
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 font-mono font-bold text-sm focus:outline-none focus:border-brand rounded-none"
                  />
                  <p className="text-[10px] text-t-muted italic mt-1 font-semibold">
                    Définit la cible à 100% de la jauge sur le Tableau de Bord
                    principal.
                  </p>
                </div>

                <Button
                  variant="success"
                  fullWidth
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="py-4 text-xs font-bold"
                >
                  <Save size={16} className="mr-2" />{" "}
                  {isSaving ? "Sauvegarde..." : "Enregistrer les Paramètres"}
                </Button>
              </div>
            </div>

            {/* ── ZONE DE DANGER : RÉINITIALISATION COMPLÈTE ── */}
            <div className="bg-red-950/20 border-2 border-red-500/40 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle size={20} />
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Zone de Danger (Remise à Zéro)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Cette opération supprime définitivement tous les tickets,
                clients, dépenses et ventes pour remettre le logiciel à neuf.
                Action irréversible protégée par mot de passe.
              </p>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  setDeletePassword("");
                  setIsResetModalOpen(true);
                }}
                className="py-3.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
              >
                <Trash2 size={16} className="mr-2" /> Réinitialiser toute la
                Base de Données
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VUE 2 : PERSONNALISATION DU TICKET AVEC APERÇU EN DIRECT
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-subtle p-6 shadow-sm space-y-4">
            <div className="border-b border-subtle pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                <Sparkles size={16} /> Contenu &amp; Marque du Ticket
              </h3>
            </div>

            <ImageUpload
              label="Logo du Salon (Optionnel)"
              value={ticketSettings.receipt_logo}
              onChange={(base64) =>
                setTicketSettings({ ...ticketSettings, receipt_logo: base64 })
              }
            />

            <Input
              label="Nom du Salon (Laisser vide si déjà inclus dans le logo)"
              value={ticketSettings.receipt_header_title}
              onChange={(e) =>
                setTicketSettings({
                  ...ticketSettings,
                  receipt_header_title: e.target.value,
                })
              }
              placeholder="Ex: SALON VSP"
            />
            <Input
              label="Sous-titre / Slogan"
              value={ticketSettings.receipt_header_subtitle}
              onChange={(e) =>
                setTicketSettings({
                  ...ticketSettings,
                  receipt_header_subtitle: e.target.value,
                })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Numéro de Téléphone"
                value={ticketSettings.receipt_phone}
                onChange={(e) =>
                  setTicketSettings({
                    ...ticketSettings,
                    receipt_phone: e.target.value,
                  })
                }
              />
              <Input
                label="Adresse / Instagram"
                value={ticketSettings.receipt_address}
                onChange={(e) =>
                  setTicketSettings({
                    ...ticketSettings,
                    receipt_address: e.target.value,
                  })
                }
              />
            </div>

            <Input
              label="Message du Ticket d'Attente (Salle)"
              value={ticketSettings.receipt_queue_message}
              onChange={(e) =>
                setTicketSettings({
                  ...ticketSettings,
                  receipt_queue_message: e.target.value,
                })
              }
            />

            <div>
              <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                Message de Pied de Page (Facture)
              </label>
              <textarea
                value={ticketSettings.receipt_footer}
                onChange={(e) =>
                  setTicketSettings({
                    ...ticketSettings,
                    receipt_footer: e.target.value,
                  })
                }
                rows={2}
                className="w-full bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <Button
              variant="success"
              fullWidth
              onClick={handleSaveAll}
              disabled={isSaving}
              className="py-4 text-xs font-bold shadow-lg"
            >
              <Save size={16} className="mr-2" />{" "}
              {isSaving
                ? "Enregistrement..."
                : "Enregistrer la Personnalisation"}
            </Button>
          </div>

          {/* SIMULATEUR 80MM */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="flex gap-1.5 mb-3 bg-main p-1 border border-subtle">
              <button
                type="button"
                onClick={() => setPreviewType("queue")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-none ${
                  previewType === "queue"
                    ? "bg-brand text-white"
                    : "text-t-muted hover:text-t-main"
                }`}
              >
                🎟️ Ticket d'Attente
              </button>
              <button
                type="button"
                onClick={() => setPreviewType("receipt")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-none ${
                  previewType === "receipt"
                    ? "bg-brand text-white"
                    : "text-t-muted hover:text-t-main"
                }`}
              >
                🧾 Facture Caisse
              </button>
            </div>

            <div className="w-[300px] bg-white text-black p-6 font-mono text-xs shadow-2xl border-t-8 border-slate-700 relative select-none">
              {/* Entête */}
              <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-3 mb-3">
                {previewType !== "queue" && ticketSettings.receipt_logo && (
                  <img
                    src={ticketSettings.receipt_logo}
                    alt="Logo"
                    className="max-h-12 mx-auto mb-2 filter grayscale contrast-150"
                  />
                )}
                {ticketSettings.receipt_header_title?.trim() && (
                  <h4 className="font-black text-base uppercase">
                    {ticketSettings.receipt_header_title}
                  </h4>
                )}
                {previewType !== "queue" && (
                  <>
                    <p className="text-[10px] font-bold text-gray-700">
                      {ticketSettings.receipt_header_subtitle}
                    </p>
                    {ticketSettings.receipt_phone && (
                      <p className="text-[10px]">
                        Tél : {ticketSettings.receipt_phone}
                      </p>
                    )}
                    {ticketSettings.receipt_address && (
                      <p className="text-[9px] text-gray-600 italic">
                        {ticketSettings.receipt_address}
                      </p>
                    )}
                  </>
                )}
              </div>

              {previewType === "queue" ? (
                <div className="text-center py-2 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500">
                    Votre Numéro de Passage
                  </p>
                  <p className="text-5xl font-black text-black my-1">#12</p>
                  <div className="border-2 border-black px-3 py-1 inline-block mx-auto font-black text-xs uppercase">
                    POSTE 06
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-2 text-[9px] text-left space-y-0.5 mt-3 text-gray-600">
                    <div className="flex justify-between">
                      <span>Coiffeur :</span>
                      <span className="font-bold text-black">AISSA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client :</span>
                      <span className="font-bold text-black">Karim B.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heure :</span>
                      <span>14:30</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-700 italic pt-1">
                    "{ticketSettings.receipt_queue_message}"
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-center font-bold text-[10px] py-1 border-b border-dashed border-gray-300">
                    *** FACTURE D'ENCAISSEMENT ***
                  </div>
                  <div className="text-[10px] space-y-0.5 my-2">
                    <div className="flex justify-between">
                      <span>1x Dégradé</span>
                      <span className="font-bold">1 000.00</span>
                    </div>
                  </div>
                  <div className="border-t border-black pt-2 mt-2 font-black text-sm flex justify-between">
                    <span>TOTAL DZD :</span>
                    <span>1 000.00</span>
                  </div>
                  <div className="text-center text-[10px] font-bold border-t border-dashed border-gray-400 mt-4 pt-3 whitespace-pre-line text-gray-800">
                    {ticketSettings.receipt_footer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL : CONFIRMATION RÉINITIALISATION BASE DE DONNÉES ── */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
      >
        <form
          onSubmit={handleConfirmResetDb}
          className="p-8 bg-slate-950 border-t-4 border-red-600"
        >
          <div className="flex items-center gap-3 text-red-500 mb-4 justify-center">
            <AlertTriangle size={28} />
            <h3 className="text-xl font-bold uppercase tracking-widest">
              Zone de Danger Absolue
            </h3>
          </div>

          <p className="text-xs text-slate-300 text-center mb-6 leading-relaxed">
            Vous êtes sur le point d'
            <strong>effacer l'intégralité des données</strong> du salon
            (tickets, clients, argent en caisse, historique). Pour confirmer,
            tapez le mot de passe de sécurité :
          </p>

          <div className="bg-main border border-slate-800 p-3 text-center mb-5">
            <code className="text-sm font-mono font-bold text-red-400 select-all">
              salonvspdelete
            </code>
          </div>

          <div className="space-y-4">
            <Input
              label="Mot de passe de confirmation *"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Tapez salonvspdelete"
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="py-3 text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={isResetting || deletePassword !== "salonvspdelete"}
                className="py-3 text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-30"
              >
                {isResetting
                  ? "Suppression en cours..."
                  : "Confirmer l'Effacement"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Moteur d'impression test */}
      <ThermalReceipt
        type="receipt"
        data={{
          ticketId: "TEST-01",
          clientName: "Test Impression",
          barber: "Technicien",
          service: "Test Imprimante Thermique",
          haircutPrice: 0,
          items: [],
          grandTotal: 0,
          paidAmount: 0,
        }}
        printTrigger={testPrintTrigger}
      />
    </div>
  );
}
