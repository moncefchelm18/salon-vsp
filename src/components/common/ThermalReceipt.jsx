import React from "react";

/**
 * Composant de reçu thermique (Caché à l'écran, visible à l'impression)
 * type: "queue" (Ticket d'attente) | "order" (Bon de commande) | "receipt" (Facture payée)
 */
export default function ThermalReceipt({
  type = "receipt",
  data,
  printTrigger, // Variable qui change pour forcer l'impression
}) {
  // Fonction magique qui déclenche l'imprimante quand les données changent
  React.useEffect(() => {
    if (printTrigger && data) {
      window.print();
    }
  }, [printTrigger, data]);

  if (!data) return null;

  return (
    <div className="print-only p-4 text-black bg-white w-[80mm] text-sm leading-tight">
      {/* EN-TÊTE DU TICKET */}
      <div className="text-center mb-4 border-b-2 border-black border-dashed pb-4">
        <h1 className="font-bold text-xl uppercase">Sallon Picasso</h1>
        <p className="text-xs">Coiffure & Cafétéria Premium</p>
        <p className="text-xs">Tél : 0550 00 00 00</p>
        <p className="text-xs mt-2 font-bold uppercase">
          {type === "queue" && "*** TICKET D'ATTENTE ***"}
          {type === "order" && "*** BON DE COMMANDE ***"}
          {type === "receipt" && "*** REÇU DE PAIEMENT ***"}
        </p>
      </div>

      {/* INFORMATIONS PRINCIPALES */}
      <div className="mb-4">
        <p>
          Date: {new Date().toLocaleDateString("fr-FR")}{" "}
          {new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>Ticket N°: {data.ticketId || data.id || "---"}</p>
        {data.clientName && <p>Client: {data.clientName}</p>}
        {data.barber && <p>Coiffeur: {data.barber}</p>}
      </div>

      <div className="border-b border-black border-dashed mb-2"></div>

      {/* DÉTAIL DES ARTICLES (Pour Reçu ou Commande) */}
      {(type === "receipt" || type === "order") && (
        <div className="mb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black">
                <th className="pb-1 w-2/3">Article</th>
                <th className="pb-1 w-1/3 text-right">Prix</th>
              </tr>
            </thead>
            <tbody>
              {/* Prestation Coiffure */}
              {data.service && (
                <tr className="align-top">
                  <td className="pt-2">{data.service}</td>
                  <td className="pt-2 text-right">
                    {data.haircutPrice?.toFixed(2)}
                  </td>
                </tr>
              )}

              {/* Articles Café */}
              {data.items?.map((item, index) => (
                <tr key={index} className="align-top">
                  <td className="pt-1">
                    {item.quantity}x {item.name}
                  </td>
                  <td className="pt-1 text-right">
                    {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TICKET D'ATTENTE SPÉCIFIQUE */}
      {type === "queue" && (
        <div className="text-center py-6">
          <p className="text-3xl font-bold mb-2">#{data.id}</p>
          <p className="text-lg">Veuillez patienter</p>
        </div>
      )}

      {/* TOTAUX (Seulement pour les reçus payés) */}
      {type === "receipt" && (
        <>
          <div className="border-t-2 border-black border-dashed pt-2 mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>DZD {data.grandTotal?.toFixed(2)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span>Remise:</span>
                <span>- DZD {data.discountAmount?.toFixed(2)}</span>
              </div>
            )}
            {data.tipAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span>Pourboire:</span>
                <span>+ DZD {data.tipAmount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs mt-2">
              <span>Payé en Espèces:</span>
              <span>DZD {data.paidAmount?.toFixed(2)}</span>
            </div>
            {data.unpaidDebt > 0 && (
              <div className="flex justify-between text-xs font-bold mt-1">
                <span>Reste à payer (Ardoise):</span>
                <span>DZD {data.unpaidDebt?.toFixed(2)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* PIED DE TICKET */}
      <div className="text-center mt-6 text-xs">
        {type === "order" ? (
          <p className="font-bold text-lg border border-black py-1">NON PAYÉ</p>
        ) : (
          <>
            <p>Merci de votre visite !</p>
            <p>A très bientôt chez Picasso.</p>
          </>
        )}
      </div>

      {/* Espace blanc pour permettre à l'imprimante de couper le papier */}
      <div className="h-10"></div>
    </div>
  );
}
