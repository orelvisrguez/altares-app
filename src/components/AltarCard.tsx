import React, { useState, useEffect } from "react";
import { Altar } from "../types";
import { formatRemainingTime } from "../utils/parser";
import { Shield, ShieldAlert, Edit, Trash2, Zap, ArrowRight, UserCheck, RefreshCcw, Landmark } from "lucide-react";

interface AltarCardProps {
  altar: Altar;
  onEdit: (altar: Altar) => void;
  onDelete: (id: string) => void;
  onQuickChangeOccupant: (id: string, newOccupant: string) => void;
  onRefreshProtection: (id: string) => void;
}

const ALLIANCE_COLORS: Record<string, { bg: string; text: string; border: string; bgSoft: string }> = {
  LTS: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/35", bgSoft: "bg-blue-950/30" },
  UNR: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/35", bgSoft: "bg-red-950/30" },
  TDS: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/35", bgSoft: "bg-emerald-950/30" },
  LAT: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/35", bgSoft: "bg-amber-950/30" },
  AGE: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/35", bgSoft: "bg-purple-950/30" },
  XPR: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/35", bgSoft: "bg-pink-950/30" },
  RNV: { bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/35", bgSoft: "bg-teal-950/30" },
  DESCONOCIDO: { bg: "bg-slate-500", text: "text-slate-400", border: "border-slate-500/35", bgSoft: "bg-slate-900/30" }
};

export default function AltarCard({
  altar,
  onEdit,
  onDelete,
  onQuickChangeOccupant,
  onRefreshProtection
}: AltarCardProps) {
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [showQuickOwnerMenu, setShowQuickOwnerMenu] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (!altar.protectionExpiresAt) {
        setRemainingMs(0);
        return;
      }
      const diffStr = new Date(altar.protectionExpiresAt).getTime() - Date.now();
      setRemainingMs(diffStr > 0 ? diffStr : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [altar.protectionExpiresAt]);

  const isProtected = remainingMs > 0;

  // Calculate critical threat: unprotected and bordered by 3 or more unique threatening neighbors
  const currentOccupier = (altar.occupiedBy || "DESCONOCIDO").toUpperCase().trim();
  const threateningNeighbors = altar.neighbors
    .map(n => n.toUpperCase().trim())
    .filter(n => n !== currentOccupier && n !== "");
  const uniqueThreats = Array.from(new Set(threateningNeighbors));

  const isCriticalThreat = !isProtected && uniqueThreats.length >= 3;
  const isExpiringSoon = isProtected && remainingMs > 0 && remainingMs < 15 * 60 * 1000; // less than 15 minutes
  const shouldAlert = isCriticalThreat || isExpiringSoon;

  const occupierColor = ALLIANCE_COLORS[altar.occupiedBy.toUpperCase().trim()] || ALLIANCE_COLORS.DESCONOCIDO;

  // Key Alliances for the quick swap feature
  const QUICK_ALLIANCES = ["LTS", "UNR", "TDS", "LAT", "AGE"];

  let cardBorderClass = "";
  if (isCriticalThreat) {
    cardBorderClass = "border-red-500/50 shadow-lg shadow-red-950/25";
  } else if (isExpiringSoon) {
    cardBorderClass = "border-amber-500/50 shadow-lg shadow-amber-950/25";
  } else if (isProtected) {
    cardBorderClass = "border-emerald-500/20 shadow-emerald-950/5 hover:border-emerald-500/40";
  } else {
    cardBorderClass = "border-slate-800 hover:border-rose-500/20";
  }

  return (
    <div className={`relative bg-slate-900/40 border ${cardBorderClass} rounded-2xl pl-6 pr-5 py-5 flex flex-col justify-between shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl backdrop-blur-sm group overflow-hidden`}>
      {/* Alert Glow border overlays */}
      {isCriticalThreat && (
        <div className="absolute inset-0 rounded-2xl border-2 border-red-500/60 pointer-events-none animate-pulse shadow-[inset_0_0_12px_rgba(239,68,68,0.2)] z-10" />
      )}
      {isExpiringSoon && (
        <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/60 pointer-events-none animate-pulse shadow-[inset_0_0_12px_rgba(245,158,11,0.2)] z-10" />
      )}

      {/* Alliance Colored Indicator Strip on left side */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${occupierColor.bg} opacity-80 group-hover:opacity-100 transition-opacity z-20`} />
      
      {/* Background visual water mark */}
      <div className="absolute top-2 right-2 opacity-5 select-none pointer-events-none group-hover:scale-105 transition-transform duration-500">
        <Landmark className="w-24 h-24 text-slate-100" />
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          {/* Altar Badge Level & Coordinates */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-slate-950/80 border border-slate-800 text-[9px] font-mono text-sky-400 px-2 py-0.5 rounded-md font-semibold shrink-0">
              NIVEL {altar.level}
            </span>
            {altar.coordX !== undefined && altar.coordY !== undefined && altar.coordX !== null && altar.coordY !== null && (
              <span className="bg-slate-950/60 border border-slate-800/85 text-[9px] font-mono text-slate-300 px-1.5 py-0.5 rounded-md shrink-0" title="Coordenadas">
                [{altar.coordX}, {altar.coordY}]
              </span>
            )}
          </div>

          {/* Protection pill with timer */}
          {isProtected ? (
            isExpiringSoon ? (
              <span className="bg-amber-950/80 border border-amber-550/45 text-amber-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm shadow-amber-950/20 z-20">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                EXPIRA: {formatRemainingTime(remainingMs)}
              </span>
            ) : (
              <span className="bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                {formatRemainingTime(remainingMs)}
              </span>
            )
          ) : (
            isCriticalThreat ? (
              <span className="bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm shadow-red-950/20 z-20">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                CRÍTICO
              </span>
            ) : (
              <span className="bg-rose-950/60 border border-rose-900/40 text-rose-400 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                VULNERABLE
              </span>
            )
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-white tracking-normal font-sans line-clamp-1 mb-2">
          {altar.name}
        </h4>

        {/* Buff/Effect Description */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 mb-3.5 min-h-[44px]">
          <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5 leading-snug">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            {altar.effect || "Sin efecto registrado"}
          </p>
        </div>

        {/* Owner Details */}
        <div className="flex items-center justify-between py-2 border-b border-slate-850 text-xs">
          <span className="text-slate-400 font-mono">Ocupado por:</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${occupierColor.bgSoft} ${occupierColor.text} border ${occupierColor.border}`}>
              {altar.occupiedBy || "NINGUNO"}
            </span>
            <button
              onClick={() => setShowQuickOwnerMenu(!showQuickOwnerMenu)}
              title="Cambiar Ocupante Rápido"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Owner Switch Panel */}
        {showQuickOwnerMenu && (
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 my-2 flex flex-wrap gap-1 items-center justify-center animate-fade-in">
            <span className="text-[9px] font-mono text-slate-500 w-full text-center pb-1">Cambiar a:</span>
            {QUICK_ALLIANCES.map(alliance => (
              <button
                key={alliance}
                onClick={() => {
                  onQuickChangeOccupant(altar.id, alliance);
                  setShowQuickOwnerMenu(false);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors hover:bg-slate-800 ${
                  altar.occupiedBy.toUpperCase().trim() === alliance
                    ? "bg-slate-800 text-white"
                    : "text-slate-400"
                }`}
              >
                {alliance}
              </button>
            ))}
            <button
              onClick={() => {
                const manual = prompt("Escriba la etiqueta de la alianza (Ej: LTS, UNR):");
                if (manual) {
                  onQuickChangeOccupant(altar.id, manual.toUpperCase().trim());
                }
                setShowQuickOwnerMenu(false);
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Otro...
            </button>
          </div>
        )}

        {/* Map Neighbors */}
        <div className="py-2 pb-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 font-mono">
            <span>Frontera d/ Vecinos:</span>
            <span className="text-[10px] text-slate-500">{altar.neighbors.length} aliados/rivales</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {altar.neighbors.map((neighbor, index) => {
              const formattedNeighbor = neighbor.toUpperCase().trim();
              const isOccupier = formattedNeighbor === altar.occupiedBy.toUpperCase().trim();
              const nColor = ALLIANCE_COLORS[formattedNeighbor] || ALLIANCE_COLORS.DESCONOCIDO;

              return (
                <span
                  key={index}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border ${
                    isOccupier
                      ? "bg-slate-800/80 text-slate-400 border-slate-700"
                      : `${nColor.bgSoft} ${nColor.text} ${nColor.border}`
                  }`}
                  title={isOccupier ? `${formattedNeighbor} es el ocupante actual` : `Vecino bordering: ${formattedNeighbor}`}
                >
                  {formattedNeighbor}
                </span>
              );
            })}
            {altar.neighbors.length === 0 && (
              <span className="text-[10px] text-slate-500 font-mono italic">Sin vecinos frontera</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Tools Actions */}
      <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-1 text-slate-400 text-xs">
        <button
          onClick={() => onRefreshProtection(altar.id)}
          className="hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-950/20 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          title={`Reiniciar escudo por ${altar.protectionTimeInput || "1h"}`}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Escudo {altar.protectionTimeInput ? `(${altar.protectionTimeInput})` : ""}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(altar)}
            title="Editar Altar"
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(altar.id)}
            title="Eliminar Altar"
            className="p-1.5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
