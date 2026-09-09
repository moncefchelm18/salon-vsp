import { useState, useEffect } from "react";
import {
  Printer,
  Database,
  Wifi,
  Save,
  Download,
  Settings2,
  CheckCircle2,
  CloudUpload,
  Copy,
  Receipt,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Input from "../common/Input";
import ImageUpload from "../common/ImageUpload";
import ThermalReceipt from "../common/ThermalReceipt";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState("hardware"); // 'hardware' ou 'tickets'
  const [previewType, setPreviewType] = useState("queue"); // 'queue' (Attente) ou 'receipt' (Facture)

  // Infos Réseau Réelles
  const [systemInfo, setSystemInfo] = useState({
    localIp: "127.0.0.1",
    tabletUrl: "http://localhost:3001/coiffeur",
    dbSizeMB: "0.00",
  });

  // ── PARAMÈTRES PERSONNALISATION TICKET ──
  const [ticketSettings, setTicketSettings] = useState({
    receipt_logo: "",
    receipt_header_title: "Salon VSP",
    receipt_header_subtitle: "Coiffure Masculine & Espace Café",
    receipt_phone: "0550 00 00 00",
    receipt_address: "Alger, Algérie - Instagram : @salon_vsp",
    receipt_footer: "Merci de votre visite !\nÀ très bientôt chez Salon VSP.",
    receipt_queue_message: "Veuillez patienter, votre tour approche.",
  });

  // Paramètres Caisse & Cloud
  const [businessDayStartHour, setBusinessDayStartHour] = useState("6");
  const [cloudBackupUrl, setCloudBackupUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const [testPrintTrigger, setTestPrintTrigger] = useState(0);
  const [dailyRevenueGoal, setDailyRevenueGoal] = useState("30000"); // 30 000 DZD par défaut

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, infoRes] = await Promise.all([
        api.get("/settings"),
        api.get("/settings/info"),
      ]);

      setBusinessDayStartHour(settingsRes.data.business_day_start_hour || "6");
      setCloudBackupUrl(settingsRes.data.cloud_backup_url || "");
      setDailyRevenueGoal(settingsRes.data.daily_revenue_goal || "30000");

      // Charger les textes personnalisés du ticket
      setTicketSettings({
        receipt_logo: settingsRes.data.receipt_logo || "",
        receipt_header_title:
          settingsRes.data.receipt_header_title || "Salon VSP",
        receipt_header_subtitle:
          settingsRes.data.receipt_header_subtitle ||
          "Coiffure Masculine & Espace Café",
        receipt_phone: settingsRes.data.receipt_phone || "0550 00 00 00",
        receipt_address: settingsRes.data.receipt_address || "Alger, Algérie",
        receipt_footer:
          settingsRes.data.receipt_footer ||
          "Merci de votre visite !\nÀ très bientôt chez Salon VSP.",
        receipt_queue_message:
          settingsRes.data.receipt_queue_message ||
          "Veuillez patienter, votre tour approche.",
      });

      setSystemInfo(infoRes.data);
    } catch (err) {
      toast.error("Erreur de synchronisation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sauvegarder TOUS les paramètres (Ticket + Caisse + Cloud)
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        business_day_start_hour: businessDayStartHour,
        cloud_backup_url: cloudBackupUrl.trim(),
        daily_revenue_goal: dailyRevenueGoal, // <-- AJOUT DE L'OBJECTIF
        ...ticketSettings,
      };

      await api.post("/settings", payload);
      localStorage.setItem("vsp_receipt_settings", JSON.stringify(payload));
      toast.success("Paramètres et personnalisation des tickets enregistrés !");
    } catch (err) {
      toast.error("Erreur d'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.open(`${API_BASE_URL}/settings/backup`, "_blank");
    toast.success("Téléchargement du fichier dev.db lancé.");
  };

  const handleSendCloudBackup = async () => {
    if (!cloudBackupUrl.trim())
      return toast.error("Configurez d'abord l'URL Cloud ci-dessous.");
    setIsUploadingCloud(true);
    try {
      const res = await api.post("/settings/cloud-backup");
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Échec de l'envoi.");
    } finally {
      setIsUploadingCloud(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold">
        Chargement des paramètres...
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    systemInfo.tabletUrl,
  )}&bgcolor=0f172a&color=d4af37&qzone=1`;

  return (
    <div className="space-y-6">
      {/* ── ONGLETS DU HAUT (MATÉRIEL vs TICKETS) ── */}
      <div className="flex gap-2 p-1 bg-surface border border-subtle w-fit">
        <button
          onClick={() => setActiveTab("hardware")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "hardware"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Settings2 size={16} /> Matériel, Réseau &amp; Sécurité
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "tickets"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Receipt size={16} /> Personnalisation des Tickets (Logo &amp; Textes)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE 1 : MATÉRIEL, IP, CLOUD & HEURE DE BASCULE
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "hardware" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* GAUCHE : QR CODE & IMPRIMANTE */}
          <div className="space-y-6">
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Wifi size={16} /> Accès Coiffeurs (Réseau Local)
                </h3>
                <span className="text-[9px] font-mono font-bold bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5">
                  IP FIXE ACTIVE
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-main p-4 border border-subtle">
                <div className="bg-slate-900 p-2 border-2 border-brand/40 shrink-0 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold text-t-muted">
                    IP Serveur :
                  </span>
                  <p className="font-mono font-bold text-brand text-lg">
                    {systemInfo.localIp}
                  </p>
                  <span className="text-[10px] uppercase font-bold text-t-muted">
                    Lien Tablette :
                  </span>
                  <code className="text-[11px] font-mono font-bold text-slate-200 bg-surface border border-subtle px-2 py-1 block truncate">
                    {systemInfo.tabletUrl}
                  </code>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(systemInfo.tabletUrl);
                      toast.success("Lien copié !");
                    }}
                    className="py-2 text-xs w-full justify-center mt-2"
                  >
                    <Copy size={13} className="mr-1" /> Copier l'URL
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Printer size={16} /> Imprimante Thermique (80mm)
              </h3>
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
                (Sortie Ticket)
              </Button>
            </div>
          </div>

          {/* DROITE : BDD CLOUD & RÈGLES */}
          <div className="space-y-6">
            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Database size={16} /> Sauvegarde Base de Données
                </h3>
                <span className="font-mono text-[10px] text-t-muted font-bold">
                  {systemInfo.dbSizeMB} MB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant="secondary"
                  onClick={handleDownloadBackup}
                  className="py-3.5 text-xs font-bold justify-center"
                >
                  <Download size={15} className="mr-1.5" /> Backup Local (.db)
                </Button>
                <Button
                  variant="success"
                  onClick={handleSendCloudBackup}
                  disabled={isUploadingCloud}
                  className="py-3.5 text-xs font-bold justify-center"
                >
                  <CloudUpload size={15} className="mr-1.5" />{" "}
                  {isUploadingCloud ? "Envoi..." : "Envoyer au Cloud"}
                </Button>
              </div>

              <div className="bg-main p-3 border border-subtle space-y-1">
                <label className="text-[10px] font-bold uppercase text-t-muted">
                  Lien Webhook Google Drive :
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

            <div className="bg-surface border border-subtle p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4 flex items-center gap-2">
                <Receipt size={16} /> Règle de Clôture Quotidienne
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                    Heure de bascule comptable (Fin de journée)
                  </label>
                  <select
                    value={businessDayStartHour}
                    onChange={(e) => setBusinessDayStartHour(e.target.value)}
                    className="w-full bg-main border border-subtle text-t-main px-4 py-3 font-bold text-xs uppercase focus:outline-none focus:border-brand cursor-pointer"
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
                {/* ── METTEZ LE BLOC EXACTEMENT ICI ! ── */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-1">
                    Objectif de Chiffre d'Affaires Journalier (DZD)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={dailyRevenueGoal}
                    onChange={(e) => setDailyRevenueGoal(e.target.value)}
                    placeholder="Ex: 30000"
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
                  {isSaving ? "Sauvegarde..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VUE 2 : PERSONNALISATION COMPLÈTE DU TICKET (LOGO & TEXTES)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* FORMULAIRE DE MODIFICATION DES TEXTES (7 colonnes) */}
          <div className="lg:col-span-7 bg-surface border border-subtle p-6 shadow-sm space-y-5">
            <div className="border-b border-subtle pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                <Sparkles size={16} /> Contenu &amp; Marque du Ticket
              </h3>
              <p className="text-[10px] text-t-muted font-bold mt-1">
                Tous les textes modifiés ici seront immédiatement appliqués sur
                les tickets thermiques.
              </p>
            </div>

            {/* 1. LOGO DU TICKET */}
            <div>
              <label className="block text-xs font-bold uppercase text-t-muted mb-2 flex items-center gap-2">
                <ImageIcon size={14} className="text-brand" /> Logo du Salon
                (Impression Thermique)
              </label>
              <ImageUpload
                label=""
                value={ticketSettings.receipt_logo}
                onChange={(base64) =>
                  setTicketSettings({ ...ticketSettings, receipt_logo: base64 })
                }
              />
              <p className="text-[10px] text-t-muted italic mt-1.5">
                * Utilisez de préférence un logo contrasté avec fond transparent
                ou blanc. Il sera converti en noir &amp; blanc net.
              </p>
            </div>

            {/* 2. EN-TÊTE DU TICKET */}
            <div className="space-y-3 pt-3 border-t border-subtle">
              <Input
                label="Nom du Salon (Laisser vide si déjà inclus dans le logo)"
                value={ticketSettings.receipt_header_title}
                onChange={(e) =>
                  setTicketSettings({
                    ...ticketSettings,
                    receipt_header_title: e.target.value,
                  })
                }
                placeholder="Optionnel si votre logo contient déjà le nom"
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
                placeholder="Ex: Coiffure Masculine & Cafétéria"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Numéro(s) de Téléphone"
                  value={ticketSettings.receipt_phone}
                  onChange={(e) =>
                    setTicketSettings({
                      ...ticketSettings,
                      receipt_phone: e.target.value,
                    })
                  }
                  placeholder="Ex: 0550 12 34 56"
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
                  placeholder="Ex: @salon_vsp"
                />
              </div>
            </div>

            {/* 3. MESSAGES DE BAS DE TICKET & ATTENTE */}
            <div className="space-y-3 pt-3 border-t border-subtle">
              <Input
                label="Message du Ticket d'Attente (File)"
                value={ticketSettings.receipt_queue_message}
                onChange={(e) =>
                  setTicketSettings({
                    ...ticketSettings,
                    receipt_queue_message: e.target.value,
                  })
                }
                placeholder="Ex: Veuillez patienter, votre tour approche."
              />
              <div>
                <label className="block text-xs font-bold uppercase text-t-muted mb-1">
                  Message de Pied de Page (Facture Client)
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
                  placeholder="Ex: Merci pour votre visite !"
                />
              </div>
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

          {/* SIMULATEUR TICKET PAPIER 80MM AVEC COMMUTATEUR (5 colonnes) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* SÉLECTEUR DE TYPE D'APERÇU */}
            <div className="flex gap-1.5 mb-3 bg-main p-1 border border-subtle">
              <button
                type="button"
                onClick={() => setPreviewType("queue")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-none ${
                  previewType === "queue"
                    ? "bg-brand text-white shadow-sm"
                    : "text-t-muted hover:text-t-main"
                }`}
              >
                🎟️ Ticket d'Attente (Entrée)
              </button>
              <button
                type="button"
                onClick={() => setPreviewType("receipt")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-none ${
                  previewType === "receipt"
                    ? "bg-brand text-white shadow-sm"
                    : "text-t-muted hover:text-t-main"
                }`}
              >
                🧾 Facture Caisse (Sortie)
              </button>
            </div>

            {/* LE ROULEAU PAPIER VIRTUEL 80MM */}
            <div className="w-[300px] bg-white text-black p-6 font-mono text-xs shadow-2xl border-t-8 border-slate-700 relative select-none">
              {/* Effet dentelé bas de ticket */}
              <div
                className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-transparent to-transparent bg-repeat-x"
                style={{ backgroundSize: "10px 10px" }}
              />

              {/* ── 1. LOGO PARTAGÉ ── */}
              {ticketSettings.receipt_logo && (
                <div className="text-center mb-3">
                  <img
                    src={ticketSettings.receipt_logo}
                    alt="Logo Salon"
                    className="max-h-14 max-w-[130px] mx-auto object-contain filter grayscale contrast-150"
                  />
                </div>
              )}

              {/* ── 2. EN-TÊTE PARTAGÉ (NOM, SLOGAN, CONTACT) ── */}
              <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-3 mb-3">
                {/* N'AFFICHE LE NOM QUE S'IL N'EST PAS VIDE */}
                {ticketSettings.receipt_header_title &&
                  ticketSettings.receipt_header_title.trim() !== "" && (
                    <h4 className="font-black text-base uppercase tracking-tight">
                      {ticketSettings.receipt_header_title}
                    </h4>
                  )}
                {ticketSettings.receipt_header_subtitle && (
                  <p className="text-[10px] font-bold text-gray-700">
                    {ticketSettings.receipt_header_subtitle}
                  </p>
                )}
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
              </div>

              {/* ── 3. CORPS DYNAMIQUE DU TICKET SELON LE BOUTON CHOISI ── */}

              {/* CAS A : APERÇU DU TICKET D'ATTENTE (SALLE D'ATTENTE) */}
              {previewType === "queue" ? (
                <div className="text-center py-2 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Votre Numéro
                  </p>
                  <p className="text-5xl font-black tracking-tight text-black my-1">
                    #12
                  </p>

                  <div className="border-2 border-black px-3 py-1 inline-block mx-auto">
                    <span className="font-black text-xs uppercase tracking-wider">
                      POSTE 06
                    </span>
                  </div>

                  {/* Message d'attente modifiable en direct */}
                  <p className="text-[10px] text-gray-700 italic pt-1">
                    "{ticketSettings.receipt_queue_message}"
                  </p>

                  <div className="border-t border-dashed border-gray-400 pt-2 text-[9px] text-left space-y-0.5 mt-3 text-gray-600">
                    <div className="flex justify-between">
                      <span>Client :</span>
                      <span className="font-bold text-black">Karim B.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coiffeur :</span>
                      <span className="font-bold text-black">AISSA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrivée :</span>
                      <span>Aujourd'hui à 14:30</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* CAS B : APERÇU DE LA FACTURE D'ENCAISSEMENT */
                <div>
                  <div className="text-center font-bold text-[10px] py-1 border-b border-dashed border-gray-300">
                    *** FACTURE D'ENCAISSEMENT ***
                  </div>

                  <div className="text-[10px] space-y-0.5 my-2">
                    <div className="flex justify-between">
                      <span>1x Dégradé + Barbe</span>
                      <span className="font-bold">1 000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Café Expresso</span>
                      <span className="font-bold">150.00</span>
                    </div>
                  </div>

                  <div className="border-t border-black pt-2 mt-2 font-black text-sm flex justify-between">
                    <span>TOTAL DZD :</span>
                    <span>1 150.00</span>
                  </div>
                </div>
              )}

              {/* ── 4. PIED DE PAGE EN DIRECT ── */}
              <div className="text-center text-[10px] font-bold border-t border-dashed border-gray-400 mt-4 pt-3 whitespace-pre-line text-gray-800">
                {ticketSettings.receipt_footer}
              </div>
            </div>

            <p className="text-[10px] text-t-muted italic text-center mt-3 max-w-[280px]">
              Basculez entre les deux aperçus pour vérifier la mise en page de
              l'entrée et de la sortie.
            </p>
          </div>
        </div>
      )}

      {/* Ticket test thermique */}
      <ThermalReceipt
        type="receipt"
        data={{
          ticketId: "TEST-TICKET",
          clientName: "Client Test",
          barber: "Démonstration",
          service: "Coupe Test Imprimante",
          haircutPrice: 500,
          items: [],
          grandTotal: 500,
          paidAmount: 500,
        }}
        printTrigger={testPrintTrigger}
      />
    </div>
  );
}
