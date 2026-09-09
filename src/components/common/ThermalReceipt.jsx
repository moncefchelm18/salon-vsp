import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../utils/api";

export default function ThermalReceipt({
  type = "receipt",
  data,
  printTrigger,
}) {
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem("vsp_receipt_settings");
    return cached ? JSON.parse(cached) : {};
  });

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        setSettings(res.data);
        localStorage.setItem("vsp_receipt_settings", JSON.stringify(res.data));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (printTrigger > 0 && data) {
      const timer = setTimeout(() => {
        // Avec le mode kiosk-printing activé dans main.cjs,
        // cette ligne imprime DIRECTEMENT sans jamais ouvrir la boîte noire !
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printTrigger]);

  if (!data) return null;

  const headerTitle =
    settings.receipt_header_title !== undefined
      ? settings.receipt_header_title
      : settings.receipt_logo
        ? ""
        : "Salon VSP";

  const headerSubtitle = settings.receipt_header_subtitle || "";
  const phone = settings.receipt_phone || "";
  const address = settings.receipt_address || "";
  const footerMessage = settings.receipt_footer || "Merci pour votre visite !";
  const queueSubtitle =
    settings.receipt_queue_message ||
    "Veuillez patienter, votre tour approche.";
  const logo = settings.receipt_logo;

  return createPortal(
    <div id="thermal-receipt-root" className="print-only">
      {/* ── EN-TÊTE COMMUN (UNIQUEMENT POUR LES FACTURES ET COMMANDES, PAS POUR L'ATTENTE) ── */}
      {type !== "queue" && (
        <div
          className="receipt-header"
          style={{ textAlign: "center", marginBottom: "3mm" }}
        >
          {logo && (
            <div style={{ marginBottom: "2mm" }}>
              <img
                src={logo}
                alt="Logo Salon"
                style={{
                  maxHeight: "22mm",
                  maxWidth: "55mm",
                  objectFit: "contain",
                  filter: "grayscale(100%) contrast(160%)",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            </div>
          )}

          {headerTitle && headerTitle.trim() !== "" && (
            <h1
              style={{
                fontSize: "16pt",
                fontWeight: "900",
                margin: "1mm 0",
                textTransform: "uppercase",
              }}
            >
              {headerTitle}
            </h1>
          )}

          {headerSubtitle && headerSubtitle.trim() !== "" && (
            <p
              style={{ fontSize: "9pt", margin: "0.5mm 0", fontWeight: "bold" }}
            >
              {headerSubtitle}
            </p>
          )}
          {phone && (
            <p style={{ fontSize: "8pt", margin: "0.5mm 0" }}>Tél : {phone}</p>
          )}
          {address && (
            <p
              style={{
                fontSize: "8pt",
                margin: "0.5mm 0",
                fontStyle: "italic",
              }}
            >
              {address}
            </p>
          )}
        </div>
      )}

      {/* ── TICKET D'ATTENTE CLIENT (ÉPURÉ, SANS LOGO, COIFFEUR & CLIENT CÔTE-À-CÔTE) ── */}
      {type === "queue" && (
        <div style={{ textAlign: "center", padding: "1mm 0" }}>
          {/* Nom du Salon */}
          <p
            style={{
              fontSize: "11pt",
              textTransform: "uppercase",
              fontWeight: "900",
              margin: "0 0 2mm 0",
              letterSpacing: "0.1em",
            }}
          >
            {headerTitle || "SALON VSP"}
          </p>

          <div
            style={{ borderBottom: "1px dashed #000", margin: "2mm 0" }}
          ></div>

          <p
            style={{
              fontSize: "8pt",
              textTransform: "uppercase",
              fontWeight: "bold",
              margin: "1mm 0",
            }}
          >
            VOTRE NUMÉRO DE PASSAGE
          </p>

          {/* GROS NUMÉRO */}
          <p
            style={{
              fontSize: "44pt",
              fontWeight: "900",
              margin: "1mm 0",
              lineHeight: 1,
            }}
          >
            #{data.queueNumber || data.id}
          </p>

          {/* POSTE */}
          {data.poste && data.poste !== "--" && (
            <div
              style={{
                border: "2px solid #000",
                padding: "1.5mm 4mm",
                margin: "2mm auto",
                width: "fit-content",
              }}
            >
              <p
                style={{
                  fontSize: "12pt",
                  fontWeight: "900",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                POSTE {data.poste}
              </p>
            </div>
          )}

          {/* COIFFEUR & CLIENT CÔTE À CÔTE + HEURE */}
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              margin: "3mm 0",
              padding: "2mm 0",
              fontSize: "8pt",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
              }}
            >
              <span>Coiffeur :</span>
              <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                {data.barber || "--"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Heure :</span>
              <span>
                {new Date().toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <p
            style={{
              fontSize: "8pt",
              fontStyle: "italic",
              marginTop: "2mm",
              marginBottom: "1mm",
            }}
          >
            {queueSubtitle}
          </p>
        </div>
      )}

      {/* ── REÇU DE PAIEMENT OU COMMANDE TABLE (FACTURATION) ── */}
      {(type === "receipt" || type === "order") && (
        <>
          <div
            className="receipt-type-label"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "10pt",
              margin: "2mm 0",
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "1mm 0",
            }}
          >
            {type === "order"
              ? "*** COMMANDE EN COURS ***"
              : "*** FACTURE D'ENCAISSEMENT ***"}
          </div>

          <div
            className="receipt-meta"
            style={{ fontSize: "8pt", margin: "2mm 0" }}
          >
            <p>
              Date : {new Date().toLocaleDateString("fr-FR")} à{" "}
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>N° Facture : #{data.ticketId || data.id || "---"}</p>
            {data.clientName && <p>Client : {data.clientName}</p>}
            {data.barber && <p>Collaborateur : {data.barber}</p>}
          </div>

          <div
            style={{ borderBottom: "1px solid #000", margin: "2mm 0" }}
          ></div>

          <table
            className="receipt-table"
            style={{
              width: "100%",
              fontSize: "8pt",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px dashed #000" }}>
                <th style={{ textAlign: "left", paddingBottom: "1mm" }}>
                  Désignation
                </th>
                <th style={{ textAlign: "right", paddingBottom: "1mm" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.service && (
                <tr>
                  <td style={{ padding: "1mm 0" }}>{data.service}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {Number(data.haircutPrice || 0).toFixed(2)}
                  </td>
                </tr>
              )}
              {data.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "1mm 0" }}>
                    {item.quantity}x {item.name}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {type === "receipt" && (
            <div
              className="receipt-totals"
              style={{
                borderTop: "1px solid #000",
                marginTop: "2mm",
                paddingTop: "2mm",
                fontSize: "9pt",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12pt",
                  fontWeight: "900",
                  margin: "1mm 0",
                }}
              >
                <span>TOTAL NET :</span>
                <span>DZD {Number(data.grandTotal || 0).toFixed(2)}</span>
              </div>
              {data.discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "8pt",
                  }}
                >
                  <span>Remise accordée :</span>
                  <span>- DZD {Number(data.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {data.tipAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "8pt",
                  }}
                >
                  <span>Pourboire :</span>
                  <span>+ DZD {Number(data.tipAmount).toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "8pt",
                }}
              >
                <span>Espèces Perçues :</span>
                <span>
                  DZD{" "}
                  {Number(data.paidAmount || data.grandTotal || 0).toFixed(2)}
                </span>
              </div>
              {data.unpaidDebt > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "9pt",
                    fontWeight: "bold",
                    color: "#000",
                    borderTop: "1px dashed #000",
                    paddingTop: "1mm",
                    marginTop: "1mm",
                  }}
                >
                  <span>Reste sur Ardoise :</span>
                  <span>DZD {Number(data.unpaidDebt).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Z-REPORT (CLÔTURE CAISSE) ── */}
      {type === "z-report" && (
        <div style={{ fontSize: "8pt" }}>
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "10pt",
              margin: "2mm 0",
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "1mm 0",
            }}
          >
            *** CLÔTURE DE CAISSE (Z-REPORT) ***
          </div>
          <p>Date : {new Date(data.closedAt).toLocaleString("fr-FR")}</p>
          <p>Opérateur : {data.closedBy}</p>
          <div style={{ borderTop: "1px solid #000", margin: "2mm 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Fond de départ :</span>
            <span>DZD {Number(data.startingCash || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Entrées :</span>
            <span>+ DZD {Number(data.totalIn || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Sorties :</span>
            <span>- DZD {Number(data.totalOut || 0).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "10pt",
              borderTop: "1px solid #000",
              margin: "2mm 0",
              paddingTop: "1mm",
            }}
          >
            <span>Compté en Tiroir :</span>
            <span>DZD {Number(data.reportedCash || 0).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
            }}
          >
            <span>Écart :</span>
            <span>
              {Number(data.difference || 0) === 0
                ? "0.00 (PARFAIT)"
                : `DZD ${Number(data.difference).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      {/* ── PIED DE PAGE (UNIQUEMENT POUR LES FACTURES ET COMMANDES) ── */}
      {type !== "queue" && (
        <div
          className="receipt-footer"
          style={{
            textAlign: "center",
            borderTop: "1px dashed #000",
            marginTop: "4mm",
            paddingTop: "2mm",
            fontSize: "8pt",
          }}
        >
          {type === "order" ? (
            <p style={{ fontWeight: "bold", fontSize: "10pt" }}>
              COMMANDE EN CUISINE / COMPTOIR
            </p>
          ) : (
            <p style={{ whiteSpace: "pre-line", fontWeight: "bold" }}>
              {footerMessage}
            </p>
          )}
        </div>
      )}

      <div className="receipt-cut-space" style={{ height: "15mm" }}></div>
    </div>,
    document.body,
  );
}
