import React, { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Calendar,
  X,
  Filter,
  Search,
} from "lucide-react";
import Button from "./Button";

// Fonction d'extraction récursive du texte brut
const extractText = (node) => {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props) {
    if (node.props.children) return extractText(node.props.children);
    if (node.props.status) return String(node.props.status);
    if (node.props.value !== undefined) return String(node.props.value);
    if (node.props.label) return String(node.props.label);
    if (node.props.text) return String(node.props.text);
  }
  return "";
};

export default function DataTable({ title, headers, children }) {
  // --- ÉTATS DU TRI (SORT) ---
  const [sortColIndex, setSortColIndex] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // --- ÉTATS DU FILTRAGE DE DATE ---
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterType, setFilterType] = useState("all"); // 'all', 'today', 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD

  // --- ÉTAT RECHERCHE TEXTUELLE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- ÉTAT DES FILTRES DE COLONNES DYNAMIQUES ---
  const [columnFilters, setColumnFilters] = useState({}); // ex: { 2: "waiting" }

  const handleHeaderClick = (index, h) => {
    if (h.sortable === false || h.label.toLowerCase() === "actions") return;

    if (sortColIndex === index) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColIndex(index);
      setSortDirection("asc");
    }
  };

  // Détection automatique de la colonne contenant les dates
  const dateColIndex = useMemo(() => {
    return headers.findIndex((h) => {
      const lbl = h.label.toLowerCase();
      return (
        lbl.includes("date") ||
        lbl.includes("arrivé") ||
        lbl.includes("clôturé") ||
        lbl.includes("le")
      );
    });
  }, [headers]);

  // --- EXTRAIRE TOUTES LES OPTIONS UNIQUES POUR LE MENU DÉROULANT ---
  const columnUniqueValues = useMemo(() => {
    const rowsArray = React.Children.toArray(children);
    const map = {};

    headers.forEach((h, colIdx) => {
      const lbl = h.label.toLowerCase();
      if (
        lbl === "actions" ||
        lbl === "montant" ||
        lbl === "total" ||
        lbl === "prix total" ||
        lbl.includes("date") ||
        lbl.includes("le") ||
        lbl.includes("arrivé")
      ) {
        return;
      }

      const values = rowsArray
        .map((row) => {
          const cells = React.Children.toArray(row.props.children);
          return extractText(cells[colIdx]).trim();
        })
        .filter(Boolean);

      map[colIdx] = [...new Set(values)].sort((a, b) =>
        a.localeCompare(b, "fr"),
      );
    });

    return map;
  }, [children, headers]);

  // --- LE MOTEUR CONSOLIDÉ DE FILTRAGE ET DE TRI (PIPELINE CUMULATIF) ---
  const processedRows = useMemo(() => {
    // Étape de départ : On prend toutes les lignes brutes
    let result = React.Children.toArray(children);

    // ÉTAPE 1 : FILTRAGE PAR RECHERCHE TEXTUELLE GLOBALE
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      result = result.filter((row) => {
        const cells = React.Children.toArray(row.props.children);
        // On fusionne le texte de toutes les cellules de la ligne
        const rowText = cells.map(extractText).join(" ").toLowerCase();
        return rowText.includes(query);
      });
    }

    // ÉTAPE 2 : FILTRAGE PAR DATE (Appliqué sur le résultat de l'étape 1)
    if (dateColIndex !== -1 && filterType !== "all") {
      result = result.filter((row) => {
        const cells = React.Children.toArray(row.props.children);
        const rawText = extractText(cells[dateColIndex]).trim();

        let rowDate = null;

        const dateMatch = rawText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          rowDate = new Date(
            parseInt(dateMatch[3], 10),
            parseInt(dateMatch[2], 10) - 1,
            parseInt(dateMatch[1], 10),
          );
        } else if (rawText.includes(":")) {
          rowDate = new Date();
        } else {
          return true;
        }

        rowDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterType === "today") {
          return rowDate.getTime() === today.getTime();
        }

        if (filterType === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return rowDate >= weekAgo && rowDate <= today;
        }

        if (filterType === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return rowDate >= monthAgo && rowDate <= today;
        }

        if (filterType === "year") {
          return rowDate.getFullYear() === today.getFullYear();
        }

        if (filterType === "custom") {
          let keepRow = true;
          if (startDate) {
            const [sYear, sMonth, sDay] = startDate.split("-");
            const startLimit = new Date(
              parseInt(sYear, 10),
              parseInt(sMonth, 10) - 1,
              parseInt(sDay, 10),
            );
            startLimit.setHours(0, 0, 0, 0);
            keepRow = keepRow && rowDate >= startLimit;
          }
          if (endDate) {
            const [eYear, eMonth, eDay] = endDate.split("-");
            const endLimit = new Date(
              parseInt(eYear, 10),
              parseInt(eMonth, 10) - 1,
              parseInt(eDay, 10),
            );
            endLimit.setHours(0, 0, 0, 0);
            keepRow = keepRow && rowDate <= endLimit;
          }
          return keepRow;
        }

        return true;
      });
    }

    // ÉTAPE 3 : FILTRAGE PAR COLONNES DYNAMIQUES (Appliqué sur le résultat de l'étape 2)
    Object.entries(columnFilters).forEach(([colIdxStr, selectedValue]) => {
      const colIdx = parseInt(colIdxStr, 10);
      if (!selectedValue || selectedValue === "all") return;

      result = result.filter((row) => {
        const cells = React.Children.toArray(row.props.children);
        const cellText = extractText(cells[colIdx]).trim().toUpperCase();
        return cellText === selectedValue.toUpperCase();
      });
    });

    // ÉTAPE 4 : TRI DES LIGNES RESTANTES (Appliqué sur le résultat final filtré)
    if (sortColIndex === null) return result;

    return [...result].sort((a, b) => {
      const aCells = React.Children.toArray(a.props.children);
      const bCells = React.Children.toArray(b.props.children);

      const aVal = extractText(aCells[sortColIndex]).trim();
      const bVal = extractText(bCells[sortColIndex]).trim();

      const cleanNum = (str) => parseFloat(str.replace(/[^0-9.-]/g, ""));
      const aNum = cleanNum(aVal);
      const bNum = cleanNum(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      return sortDirection === "asc"
        ? aVal.localeCompare(bVal, "fr")
        : bVal.localeCompare(aVal, "fr");
    });
  }, [
    children,
    sortColIndex,
    sortDirection,
    filterType,
    startDate,
    endDate,
    columnFilters,
    dateColIndex,
    searchTerm,
  ]);

  // Déterminer s'il y a des filtres actifs
  const isAnyFilterActive = useMemo(() => {
    const hasActiveDate = filterType !== "all";
    const hasActiveCol = Object.values(columnFilters).some(
      (val) => val && val !== "all",
    );
    return hasActiveDate || hasActiveCol || searchTerm.trim() !== "";
  }, [filterType, columnFilters, searchTerm]);

  return (
    <div className="bg-surface border border-subtle overflow-hidden theme-transition shadow-sm rounded-none">
      {/* HEADER TABLEAU */}
      {title && (
        <div className="p-6 border-b border-subtle bg-main/50 theme-transition flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-serif font-bold text-brand theme-transition">
            {title}
          </h2>

          {isAnyFilterActive && (
            <span className="bg-brand/10 text-brand px-3 py-1 font-bold text-xs uppercase border border-brand/20 animate-pulse">
              Filtre Actif : {processedRows.length} résultats
            </span>
          )}
        </div>
      )}

      {/* --- BARRE D'OUTILS PRINCIPALE : RECHERCHE + BOUTON FILTRE (TACTILE ET COMPACTE) --- */}
      <div className="bg-main/20 p-3 border-b border-subtle flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Barre de recherche tactile avec bouton X pour vider facilement au doigt */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted"
          />
          <input
            placeholder="Rechercher dans ce tableau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-main border border-subtle text-t-main px-4 py-2.5 pl-9 text-xs focus:outline-none focus:border-brand rounded-none font-bold"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 p-1"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Bouton pour déployer les filtres de date/colonne */}
        <Button
          variant={isAnyFilterActive ? "primary" : "outline"}
          onClick={() => setShowFilterBar(!showFilterBar)}
          className="py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 shrink-0"
        >
          <Filter size={14} />
          {isAnyFilterActive ? "Filtres Actifs" : "Filtrer les données"}
        </Button>
      </div>

      {/* --- LE TIROIR DES FILTRES (RÉTACTABLE - DATE + COLONNES) --- */}
      {showFilterBar && (
        <div className="bg-main/50 border-b border-subtle p-4 space-y-4 animate-in slide-in-from-top duration-200">
          {/* Ligne A : Les filtres de dates (Seulement si le tableau gère des dates) */}
          {dateColIndex !== -1 && (
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold uppercase text-t-muted tracking-widest mr-2 flex items-center gap-1">
                  Période :
                </span>
                <Button
                  variant={filterType === "all" ? "primary" : "outline"}
                  onClick={() => {
                    setFilterType("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="py-1.5 px-3 text-[9px]"
                >
                  Tout
                </Button>
                <Button
                  variant={filterType === "today" ? "primary" : "outline"}
                  onClick={() => {
                    setFilterType("today");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="py-1.5 px-3 text-[9px]"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant={filterType === "week" ? "primary" : "outline"}
                  onClick={() => {
                    setFilterType("week");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="py-1.5 px-3 text-[9px]"
                >
                  7 Jours
                </Button>
                <Button
                  variant={filterType === "month" ? "primary" : "outline"}
                  onClick={() => {
                    setFilterType("month");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="py-1.5 px-3 text-[9px]"
                >
                  30 Jours
                </Button>
                <Button
                  variant={filterType === "year" ? "primary" : "outline"}
                  onClick={() => {
                    setFilterType("year");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="py-1.5 px-3 text-[9px]"
                >
                  Année
                </Button>
              </div>

              {/* Saisie de l'Intervalle de Dates (Du / Au) */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] font-bold uppercase text-t-muted tracking-widest">
                  Intervalle :
                </span>
                <div className="flex bg-main border border-subtle p-1 gap-2 items-center text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setFilterType("custom");
                    }}
                    className="bg-transparent border-0 text-t-main text-xs font-bold font-mono focus:outline-none cursor-pointer"
                  />
                  <span className="text-[9px] uppercase font-bold text-t-muted">
                    au
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setFilterType("custom");
                    }}
                    className="bg-transparent border-0 text-t-main text-xs font-bold font-mono focus:outline-none cursor-pointer"
                  />
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setFilterType("all");
                      }}
                      className="text-red-500 hover:text-red-400 p-0.5 border-l border-subtle ml-1 pl-1"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ligne B : Les filtres de colonnes dynamiques (Statuts, Coiffeurs, Catégories...) */}
          {Object.keys(columnUniqueValues).length > 0 && (
            <div className="flex flex-wrap gap-4 pt-3 border-t border-subtle/50 border-dashed items-center">
              <span className="text-[10px] font-bold uppercase text-t-muted tracking-widest">
                Filtrer par Colonne :
              </span>

              {Object.entries(columnUniqueValues).map(
                ([colIdxStr, uniqueValues]) => {
                  const colIdx = parseInt(colIdxStr, 10);
                  const headerLabel = headers[colIdx]?.label;
                  const currentValue = columnFilters[colIdx] || "all";

                  return (
                    <div
                      key={colIdx}
                      className="flex items-center bg-main border border-subtle p-1 gap-1 text-xs shadow-sm"
                    >
                      <span className="text-t-muted font-bold px-1.5 text-[10px] uppercase">
                        {headerLabel} :
                      </span>
                      <select
                        value={currentValue}
                        onChange={(e) => {
                          setColumnFilters((prev) => ({
                            ...prev,
                            [colIdx]: e.target.value,
                          }));
                        }}
                        className="bg-transparent text-brand font-bold focus:outline-none uppercase text-[10px] border-0 cursor-pointer"
                      >
                        <option value="all">Tout</option>
                        {uniqueValues.map((val, vIdx) => (
                          <option key={vIdx} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      {currentValue !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setColumnFilters((prev) => ({
                              ...prev,
                              [colIdx]: "all",
                            }));
                          }}
                          className="text-red-500 hover:text-red-400 p-0.5 ml-1"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      )}

      {/* RENDER TABLEAU */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-t-muted uppercase bg-main/80 theme-transition select-none">
            <tr>
              {headers.map((h, index) => {
                const isSorted = sortColIndex === index;
                const isSortable =
                  h.sortable !== false && h.label.toLowerCase() !== "actions";

                return (
                  <th
                    key={index}
                    onClick={() => handleHeaderClick(index, h)}
                    className={`px-6 py-4 transition-colors font-bold ${
                      isSortable
                        ? "cursor-pointer hover:bg-subtle/30 text-t-main"
                        : "text-t-muted"
                    } ${h.align === "right" ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${h.align === "right" ? "justify-end" : "justify-start"}`}
                    >
                      <span>{h.label}</span>
                      {isSortable && (
                        <span className="text-t-muted shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp
                                size={14}
                                className="text-brand font-black"
                              />
                            ) : (
                              <ChevronDown
                                size={14}
                                className="text-brand font-black"
                              />
                            )
                          ) : (
                            <ChevronsUpDown size={12} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/30">{processedRows}</tbody>
        </table>
      </div>
    </div>
  );
}
