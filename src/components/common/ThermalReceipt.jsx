import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ThermalReceipt({
  type = "receipt",
  data,
  printTrigger,
}) {
  useEffect(() => {
    if (printTrigger > 0 && data) {
      console.log("🖨️ [1/2] PRÉPARATION TICKET :", {
        type,
        data,
        printTrigger,
      });
      const timer = setTimeout(() => {
        console.log("🖨️ [2/2] LANCEMENT DE WINDOW.PRINT()");
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printTrigger, data]);

  if (!data) return null;

  // ✅ THE FIX: createPortal renders directly into <body>,
  // bypassing ALL parent wrappers (AuthProvider, BrowserRouter, etc.)
  // This guarantees the print CSS can target it cleanly.
  return createPortal(
    <div id="thermal-receipt-root" className="print-only">
      {/* EN-TÊTE DU TICKET (Commun) */}
      <div className="receipt-header">
        <h1>Sallon Picasso</h1>
        <p>Coiffure &amp; Cafétéria Premium</p>
        <p>Tél : 0550 00 00 00</p>
      </div>

      {/* TICKET D'ATTENTE */}
      {type === "queue" && (
        <div className="receipt-section">
          <p className="receipt-label">Votre Numéro</p>
          {data.queueNumber !== undefined && data.queueNumber !== null ? (
            <p className="receipt-number">{data.queueNumber}</p>
          ) : (
            <p className="receipt-error">ERREUR: N° INCONNU</p>
          )}
          <p className="receipt-subtitle">Veuillez patienter</p>
          <div className="receipt-meta">
            <p>Client : {data.clientName || "--"}</p>
            <p>Avec : {data.barber || "--"}</p>
            <p>
              Le : {new Date().toLocaleDateString("fr-FR")} à{" "}
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}

      {/* BON DE COMMANDE OU REÇU DE CAISSE */}
      {(type === "receipt" || type === "order") && (
        <>
          <div className="receipt-type-label">
            {type === "order" && "*** BON DE PRÉPARATION ***"}
            {type === "receipt" && "*** REÇU DE PAIEMENT ***"}
          </div>

          <div className="receipt-meta">
            <p>
              Le : {new Date().toLocaleDateString("fr-FR")} à{" "}
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>Facture N°: {data.ticketId || data.id || "---"}</p>
            {data.clientName && <p>Client: {data.clientName}</p>}
            {data.barber && <p>Vendeur: {data.barber}</p>}
          </div>

          <div className="receipt-divider"></div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th className="col-left">Article</th>
                <th className="col-right">Prix</th>
              </tr>
            </thead>
            <tbody>
              {data.service && (
                <tr>
                  <td>{data.service}</td>
                  <td className="col-right">{data.haircutPrice?.toFixed(2)}</td>
                </tr>
              )}
              {data.items?.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.quantity}x {item.name}
                  </td>
                  <td className="col-right">
                    {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {type === "receipt" && (
            <div className="receipt-totals">
              <div className="total-row total-main">
                <span>TOTAL:</span>
                <span>DZD {data.grandTotal?.toFixed(2)}</span>
              </div>
              {data.discountAmount > 0 && (
                <div className="total-row">
                  <span>Remise:</span>
                  <span>- DZD {data.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              {data.tipAmount > 0 && (
                <div className="total-row">
                  <span>Pourboire:</span>
                  <span>+ DZD {data.tipAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Payé en Espèces:</span>
                <span>DZD {data.paidAmount?.toFixed(2)}</span>
              </div>
              {data.unpaidDebt > 0 && (
                <div className="total-row total-debt">
                  <span>Reste à payer (Ardoise):</span>
                  <span>DZD {data.unpaidDebt?.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* PIED DE TICKET */}
      <div className="receipt-footer">
        {type === "order" ? (
          <p className="receipt-unpaid">NON PAYÉ</p>
        ) : (
          <>
            <p>Merci de votre visite !</p>
            <p>A très bientôt chez Picasso.</p>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* TICKET DE CLÔTURE (Z-REPORT) */}
      {/* ==================================================== */}
      {type === "z-report" && (
        <>
          <div className="receipt-type-label">
            *** TICKET DE CLÔTURE (Z-REPORT) ***
          </div>

          <div className="receipt-meta">
            <p>Date : {new Date(data.closedAt).toLocaleDateString("fr-FR")}</p>
            <p>
              Heure :{" "}
              {new Date(data.closedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>Opérateur : {data.closedBy}</p>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-totals">
            <div className="total-row">
              <span>Fond de caisse initial:</span>
              <span>DZD {data.startingCash?.toFixed(2)}</span>
            </div>

            <div className="total-row">
              <span>Total Entrées (Ventes +):</span>
              <span>DZD {data.totalIn?.toFixed(2)}</span>
            </div>

            <div className="total-row">
              <span>Total Sorties (Dépenses -):</span>
              <span>DZD {data.totalOut?.toFixed(2)}</span>
            </div>

            <div className="receipt-divider"></div>

            <div className="total-row">
              <span>Solde Théorique:</span>
              <span>DZD {data.expectedCash?.toFixed(2)}</span>
            </div>

            <div className="total-row total-main">
              <span>Compté en Tiroir:</span>
              <span>DZD {data.reportedCash?.toFixed(2)}</span>
            </div>

            <div className="receipt-divider"></div>

            <div className="total-row total-debt">
              <span>Écart de Caisse:</span>
              <span>
                {data.difference === 0
                  ? "PARFAIT (0.00)"
                  : data.difference > 0
                    ? `EXCÉDENT (+${data.difference.toFixed(2)})`
                    : `DÉFICIT (${data.difference.toFixed(2)})`}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="receipt-cut-space"></div>
    </div>,
    document.body, // ← renders straight into <body>, no parent interference
  );
}
