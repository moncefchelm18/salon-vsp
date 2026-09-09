import React from "react";
import {
  DollarSign,
  Coffee,
  Plus,
  Trash2,
  Minus,
  RefreshCcw,
  CreditCard,
  Clock,
  UserPlus,
} from "lucide-react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import POSMenuGrid from "../../../features/cafe-pos/POSMenuGrid";
import VirtualNumpad from "../../../features/cafe-pos/VirtualNumpad";

export default function CheckoutModal({
  isOpen,
  onClose,
  isProcessing,
  ticketToPay,
  manualBarberId,
  setManualBarberId,
  barbers,
  manualService,
  setManualService,
  availableServices,
  setPriceToPay,
  manualClientName,
  setManualClientName,
  manualPhone,
  setManualPhone,
  priceToPay,
  addedCafeItems,
  handleUpdateCafeItemQuantity,
  handleRemoveCafeItem,
  discountType,
  discountValue,
  setDiscountType,
  setDiscountValue,
  handleOpenNumpad,
  tipAmount,
  setTipAmount,

  // --- PROPS CRÉDIT CLIENT (OPTION B) ---
  isPartialPayment,
  setIsPartialPayment,
  setPaidAmountInput,
  isCreatingNewClient,
  setIsCreatingNewClient,
  selectedClientId,
  setSelectedClientId,
  registeredClients,
  newClientName,
  setNewClientName,
  newClientPhone,
  setNewClientPhone,
  handleQuickCreateClient,
  paidAmountInput,

  calculatedGrandTotal,
  handleConfirmPayment,

  // Sous-modales du checkout
  showPOSModal,
  setShowPOSModal,
  cafeCategories,
  activeCategory,
  setActiveCategory,
  handleAddCafeItemFromTouchMenu,
  showNumpadModal,
  setShowNumpadModal,
  numpadTarget,
  numpadValue,
  setNumpadValue,
  handleNumpadSubmit,
}) {
  if (!isOpen || !ticketToPay) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="relative flex flex-col bg-slate-950 max-h-[92vh]">
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col justify-center items-center gap-4">
              <RefreshCcw className="text-amber-500 animate-spin w-10 h-10" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500/70">
                Traitement en cours…
              </p>
            </div>
          )}

          {/* ── MODAL HEADER ── */}
          <div className="border-b-2 border-amber-500 px-6 py-5 shrink-0 bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">
                  Validation Encaissement
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                  Ticket N°{ticketToPay.id === 0 ? "COMPTOIR" : ticketToPay.id}{" "}
                  —{" "}
                  {ticketToPay.id === 0
                    ? manualClientName
                    : ticketToPay.clientName}
                </p>
              </div>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-950">
            <div className="p-6 space-y-5">
              {/* ── BLOC 1 : DÉTAIL FACTURE ── */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2 px-1">
                  Récapitulatif Facture
                </p>
                <div className="border border-slate-800 bg-slate-900/40 shadow-inner">
                  {/* Prestation coiffure dynamique (Saisie manuelle si ID = 0, sinon Lecture seule) */}
                  {ticketToPay.id === 0 ? (
                    <div className="px-4 py-4 border-b border-slate-800/60 space-y-4 bg-slate-950/40">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        Saisie Prestation Manuelle
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                            Coiffeur *
                          </label>
                          <select
                            value={manualBarberId}
                            onChange={(e) => setManualBarberId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-2 py-1.5 text-xs font-bold uppercase focus:outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            {barbers.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}{" "}
                                {b.poste
                                  ? `(Poste ${b.poste})`
                                  : "(Sans Poste)"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                            Prestation *
                          </label>
                          <select
                            value={manualService ? manualService.id : ""}
                            onChange={(e) => {
                              const srv = availableServices.find(
                                (s) => s.id.toString() === e.target.value,
                              );
                              setManualService(srv || null);
                              setPriceToPay(srv ? srv.price : 0);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-2 py-1.5 text-xs font-bold uppercase focus:outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            {availableServices.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (DZD {s.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                            Nom du Client
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Amine"
                            value={manualClientName}
                            onChange={(e) =>
                              setManualClientName(e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3 py-1.5 text-xs focus:outline-none placeholder:text-slate-700 rounded-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                            Téléphone
                          </label>
                          <input
                            type="text"
                            placeholder="Optionnel"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3 py-1.5 text-xs focus:outline-none placeholder:text-slate-700 rounded-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60">
                      <div>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                          {ticketToPay.clientName}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                          Coiffure — {ticketToPay.barber}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-300">
                        DZD {priceToPay.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Commandes Café existantes (via POS) */}
                  {ticketToPay.cafeOrders?.map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase text-amber-500/80 flex items-center gap-1.5">
                          <Coffee size={12} /> Café (POS)
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {order.items
                            ?.map((i) => `${i.quantity}× ${i.name}`)
                            .join(" • ")}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-500/80">
                        DZD {order.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {/* Articles Café ajoutés directement */}
                  {addedCafeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase text-green-400 flex items-center gap-1.5">
                          <Coffee size={12} /> {item.name}
                          <span className="text-slate-600 font-mono text-[9px] normal-case">
                            (ajout direct)
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          DZD {item.price.toFixed(2)} / unité
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-green-400 w-24 text-right">
                          DZD {(item.price * item.quantity).toFixed(2)}
                        </span>

                        {/* Contrôles de quantité solides */}
                        <div className="flex items-center border border-slate-700 bg-slate-900 shrink-0">
                          <button
                            onClick={() =>
                              handleUpdateCafeItemQuantity(item.id, -1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 size={14} className="text-red-500" />
                            ) : (
                              <Minus size={14} />
                            )}
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-white font-mono border-x border-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateCafeItemQuantity(item.id, 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Remise appliquée */}
                  {discountType && (
                    <div className="flex justify-between items-center px-4 py-3 bg-amber-500/5 border-b border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                          Remise{" "}
                          {discountType === "percent"
                            ? `(${discountValue}%)`
                            : "(Montant Fixe)"}
                        </span>
                        <button
                          onClick={() => {
                            setDiscountType(null);
                            setDiscountValue(0);
                          }}
                          className="text-red-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-500">
                        {discountType === "percent"
                          ? `— DZD ${((priceToPay + addedCafeItems.reduce((s, i) => s + i.price * i.quantity, 0)) * (discountValue / 100)).toFixed(2)}`
                          : `— DZD ${discountValue.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  {/* Add Café button */}
                  <div className="px-4 py-3 bg-slate-900/60">
                    <button
                      onClick={() => setShowPOSModal(true)}
                      className="w-full border border-dashed border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-[0.99] text-slate-500 hover:text-amber-500 transition-all py-3 flex items-center justify-center gap-2 font-bold"
                    >
                      <Coffee size={14} />
                      <span className="text-xs uppercase tracking-widest">
                        Ajouter Consommations Café
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── BLOC 2 : REMISES (SOLIDES) ── */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-2 px-1">
                  Appliquer une Remise
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenNumpad("discount-percent")}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-xs font-bold uppercase tracking-widest shadow-md rounded-none"
                  >
                    Remise %
                  </button>
                  <button
                    onClick={() => handleOpenNumpad("discount-amount")}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-white text-xs font-bold uppercase tracking-widest shadow-md rounded-none"
                  >
                    Remise DZD
                  </button>
                  {discountType && (
                    <button
                      onClick={() => {
                        setDiscountType(null);
                        setDiscountValue(0);
                      }}
                      className="px-4 bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all shadow-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── BLOC 3 : POURBOIRE (VISUEL TACTILE) ── */}
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Pourboire pour{" "}
                    <span className="text-brand">
                      {ticketToPay.barber || manualBarberId
                        ? barbers.find(
                            (b) => b.id.toString() === manualBarberId,
                          )?.name
                        : "Coiffeur"}
                    </span>
                  </p>
                  {tipAmount > 0 && (
                    <span className="font-mono font-bold text-green-400 text-sm">
                      + DZD {tipAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipAmount((prev) => prev + 100)}
                    className="flex-1 py-3 bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600 hover:text-white active:scale-95 transition-all text-xs font-bold"
                  >
                    +100 DA
                  </button>
                  <button
                    onClick={() => setTipAmount((prev) => prev + 200)}
                    className="flex-1 py-3 bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600 hover:text-white active:scale-95 transition-all text-xs font-bold"
                  >
                    +200 DA
                  </button>
                  <button
                    onClick={() => handleOpenNumpad("tip")}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all text-xs font-bold"
                  >
                    Autre
                  </button>
                  {tipAmount > 0 && (
                    <button
                      onClick={() => setTipAmount(0)}
                      className="px-4 bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all shadow-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── BLOC 4 : ARDOISE / PAIEMENT PARTIEL (OPTION B) ── */}
              <div className="border border-slate-800 bg-slate-900/40">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-300">
                      Mettre sur Ardoise (Crédit)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enregistrer une dette client
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPartialPayment(!isPartialPayment);
                      setPaidAmountInput("0");
                    }}
                    className={`w-12 h-6 flex items-center transition-colors px-1 shrink-0 ${isPartialPayment ? "bg-amber-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white transition-transform ${isPartialPayment ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                {isPartialPayment && (
                  <div className="border-t border-slate-800 px-4 pb-4 pt-4 space-y-4">
                    <div className="bg-slate-950 border border-slate-800 p-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Compte Client *
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setIsCreatingNewClient(!isCreatingNewClient)
                          }
                          className="text-xs font-bold uppercase text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                        >
                          {isCreatingNewClient ? (
                            "← Choisir Existant"
                          ) : (
                            <>
                              <Plus size={10} /> Nouveau Client
                            </>
                          )}
                        </button>
                      </div>

                      {!isCreatingNewClient ? (
                        <select
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors text-xs font-bold uppercase rounded-none"
                        >
                          <option value="">— Sélectionner un client —</option>
                          {registeredClients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.phone ? `(${c.phone})` : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Nom Complet *"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            className="w-full bg-slate-900 border border-amber-500/40 text-amber-400 px-3 py-2.5 focus:outline-none focus:border-amber-400 transition-colors text-xs font-bold uppercase placeholder:text-slate-600 rounded-none"
                          />
                          <input
                            type="text"
                            placeholder="Téléphone (Optionnel)"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors text-xs font-mono placeholder:text-slate-600 rounded-none"
                          />
                          <button
                            type="button"
                            onClick={handleQuickCreateClient}
                            disabled={isProcessing || !newClientName.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all text-xs font-bold uppercase disabled:opacity-40 text-white rounded-none shadow-md"
                          >
                            Enregistrer & Sélectionner
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 border border-slate-800 px-4 py-3 shadow-inner">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Espèces Encaissées
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Avance reçue maintenant
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenNumpad("paid-amount")}
                          className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all text-xs font-bold rounded-none shadow-sm"
                        >
                          Saisir
                        </button>
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          DZD {parseFloat(paidAmountInput).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-red-950/20 border border-red-900/40 px-4 py-3 shadow-inner">
                      <p className="text-xs font-bold uppercase text-red-500">
                        Dette Enregistrée
                      </p>
                      <span className="font-mono font-bold text-red-400 text-sm">
                        DZD{" "}
                        {Math.max(
                          0,
                          calculatedGrandTotal -
                            parseFloat(paidAmountInput) -
                            tipAmount,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── MODAL FOOTER (ECRAN LED PHYSIQUE COMPACT) ── */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-6 pt-4 pb-5">
            <div className="bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-sm flex justify-between items-center shadow-inner mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                Total à Encaisser
              </span>
              <span className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
                DZD {calculatedGrandTotal.toFixed(2)}
              </span>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between items-center mb-4 px-1 text-green-400 font-bold text-xs">
                <span>+ Pourboire inclus</span>
                <span className="font-mono">+ DZD {tipAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 font-bold text-xs uppercase rounded-none border border-slate-700 shadow-md"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="py-4 bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white font-bold text-xs uppercase shadow-[0_0_20px_rgba(22,163,74,0.25)] rounded-none"
              >
                {isProcessing ? "Traitement…" : "Valider l'Encaissement"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          SOUS-MODALES DU CHECKOUT (CAFÉ POS & NUMPAD)
      ═══════════════════════════════════════════════════════ */}
      <Modal isOpen={showPOSModal} onClose={() => setShowPOSModal(false)}>
        <div className="flex flex-col bg-slate-950 h-[82vh]">
          <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Coffee size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">
                  Menu Consommations
                </h3>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mt-0.5">
                  Appuyez pour ajouter à la facture
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPOSModal(false)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-500 active:scale-95 transition-colors rounded-none shadow-md"
            >
              Fermer
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative bg-slate-900/50 border-b border-slate-800">
            <POSMenuGrid
              categories={cafeCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onAddProduct={handleAddCafeItemFromTouchMenu}
            />
          </div>
          <div className="px-6 py-4 flex justify-between items-center shrink-0 bg-slate-950 border-t border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 font-bold mb-0.5">
                Total de la Facture
              </p>
              <span className="font-mono font-bold text-amber-400 text-lg">
                DZD {calculatedGrandTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowPOSModal(false)}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-slate-950 font-bold text-xs uppercase tracking-widest shadow-[0_4px_20px_rgba(245,158,11,0.25)] rounded-none"
            >
              Confirmer la Sélection
            </button>
          </div>
        </div>
      </Modal>

      {/* <Modal isOpen={showNumpadModal} onClose={() => setShowNumpadModal(false)}>
        <div className="bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 text-center bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">
              {numpadTarget === "discount-percent" && "Saisir la Remise (%)"}
              {numpadTarget === "discount-amount" && "Saisir la Remise (DZD)"}
              {numpadTarget === "tip" && "Saisir le Pourboire"}
              {numpadTarget === "post-tip" && "Ajouter un Pourboire"}
              {numpadTarget === "paid-amount" && "Montant Payé Maintenant"}
              {numpadTarget === "price" && "Ajustement Manuel du Prix"}
            </h3>
          </div>
          <div className="p-6 bg-slate-950">
            <VirtualNumpad
              value={numpadValue}
              onChange={setNumpadValue}
              onEnter={handleNumpadSubmit}
              onCancel={() => setShowNumpadModal(false)}
            />
          </div>
        </div>
      </Modal> */}
    </>
  );
}
