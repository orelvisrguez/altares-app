import React, { useState } from "react";
import { Altar } from "../types";
import { Shield, ShieldAlert, Crosshair, Users, MapPin, Swords } from "lucide-react";

interface MapVisualizationProps {
  altars: Altar[];
  onSelectAltar: (altar: Altar) => void;
}

const ALLIANCE_COLORS: Record<string, { bg: string, text: string, border: string, glow: string }> = {
  LTS: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
  UNR: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", glow: "shadow-red-500/20" },
  TDS: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
  LAT: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  AGE: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
  XPR: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30", glow: "shadow-pink-500/20" },
  RNV: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", glow: "shadow-teal-500/20" },
  DESCONOCIDO: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", glow: "shadow-slate-500/20" }
};

export default function MapVisualization({ altars, onSelectAltar }: MapVisualizationProps) {
  const [activeTab, setActiveTab] = useState<"threats" | "matrix">("threats");
  const now = new Date();

  // Helper to get alliance style
  const getStyle = (alliance: string) => {
    const key = alliance.toUpperCase().trim();
    return ALLIANCE_COLORS[key] || { 
      bg: "bg-slate-500/10", 
      text: "text-slate-300", 
      border: "border-slate-500/20", 
      glow: "shadow-slate-500/10" 
    };
  };

  // Analyze each altar's threat profile
  const analyzedAltars = altars.map(altar => {
    const isProtected = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt) > now : false;
    const currentOccupier = (altar.occupiedBy || "DESCONOCIDO").toUpperCase().trim();
    
    // Competitors are neighbors that are NOT the owner/occupier
    const threateningNeighbors = altar.neighbors
      .map(n => n.toUpperCase().trim())
      .filter(n => n !== currentOccupier && n !== "");

    // Unique threatening neighbors
    const uniqueThreats = Array.from(new Set(threateningNeighbors));
    
    // Threat level calculation:
    // If protected -> SAFE (No sudden attack possible)
    // If unprotected & heavily bordered by enemies -> HIGH
    // If unprotected & moderately bordered -> MEDIUM
    // Else LOW/NONE
    let threatLevel: "CRITICO" | "ALTO" | "MEDIO" | "SEGURO" = "SEGURO";
    if (!isProtected) {
      if (uniqueThreats.length >= 3) {
        threatLevel = "CRITICO";
      } else if (uniqueThreats.length >= 2) {
        threatLevel = "ALTO";
      } else if (uniqueThreats.length >= 1) {
        threatLevel = "MEDIO";
      }
    }

    return {
      ...altar,
      isProtected,
      uniqueThreats,
      threatLevel
    };
  });

  return (
    <div className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl mb-8 premium-glass-panel">
      {/* Tab bar header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/50 pb-4 mb-6">
        <div>
          <h2 className="text-md font-bold text-white tracking-widest flex items-center gap-2 font-mono">
            <Swords className="w-5 h-5 text-purple-400" /> PLANIFICADOR ESTRATÉGICO DE FRONTERAS
          </h2>
          <p className="text-xs text-zinc-400">
            Analiza qué puestos de avanzada están vulnerables o rodeados por alianzas enemigas.
          </p>
        </div>

        <div className="flex bg-[#050609] p-1 rounded-xl border border-zinc-850/85">
          <button
            onClick={() => setActiveTab("threats")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeTab === "threats" 
                ? "bg-zinc-900 text-purple-400 border border-zinc-800/80 shadow-md" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Nivel de Amenaza
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeTab === "matrix" 
                ? "bg-zinc-900 text-purple-400 border border-zinc-800/80 shadow-md" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Matriz de Control
          </button>
        </div>
      </div>

      {activeTab === "threats" ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical */}
            <div className="bg-slate-950/55 border border-red-500/20 p-4 rounded-xl shadow-lg shadow-red-950/5 hover:border-red-500/35 transition-all">
              <div className="flex items-center justify-between mb-3 border-b border-red-500/10 pb-2">
                <span className="text-[11px] font-bold text-red-450 font-mono flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm"></span>
                  Riesgo Crítico
                </span>
                <span className="text-xs font-bold text-red-400 font-mono bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">
                  {analyzedAltars.filter(a => a.threatLevel === "CRITICO").length}
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter(a => a.threatLevel === "CRITICO")
                  .map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-slate-900/60 border border-red-500/20 hover:border-red-500/60 hover:bg-slate-900 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
                          <p className="text-xs font-semibold text-white truncate">{a.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span>DUEÑO: {a.occupiedBy}</span>
                          {a.coordX !== undefined && a.coordY !== undefined && a.coordX !== null && a.coordY !== null && (
                            <span className="text-red-400 font-bold">[{a.coordX}, {a.coordY}]</span>
                          )}
                        </div>
                      </div>
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter(a => a.threatLevel === "CRITICO").length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-600 italic font-mono">Ninguno en riesgo crítico</div>
                )}
              </div>
            </div>

            {/* High */}
            <div className="bg-slate-950/55 border border-orange-500/20 p-4 rounded-xl shadow-lg shadow-orange-950/5 hover:border-orange-500/35 transition-all">
              <div className="flex items-center justify-between mb-3 border-b border-orange-500/10 pb-2">
                <span className="text-[11px] font-bold text-orange-450 font-mono flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
                  Riesgo Alto
                </span>
                <span className="text-xs font-bold text-orange-400 font-mono bg-orange-950/30 px-2 py-0.5 rounded border border-orange-900/30">
                  {analyzedAltars.filter(a => a.threatLevel === "ALTO").length}
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter(a => a.threatLevel === "ALTO")
                  .map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-slate-900/60 border border-orange-500/25 hover:border-orange-500/60 hover:bg-slate-900 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 animate-pulse" />
                          <p className="text-xs font-semibold text-white truncate">{a.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span>DUEÑO: {a.occupiedBy}</span>
                          {a.coordX !== undefined && a.coordY !== undefined && a.coordX !== null && a.coordY !== null && (
                            <span className="text-orange-400 font-bold">[{a.coordX}, {a.coordY}]</span>
                          )}
                        </div>
                      </div>
                      <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter(a => a.threatLevel === "ALTO").length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-600 italic font-mono">Ninguno en riesgo alto</div>
                )}
              </div>
            </div>

            {/* Medium */}
            <div className="bg-slate-950/55 border border-yellow-500/20 p-4 rounded-xl shadow-lg shadow-yellow-950/5 hover:border-yellow-500/35 transition-all">
              <div className="flex items-center justify-between mb-3 border-b border-yellow-500/10 pb-2">
                <span className="text-[11px] font-bold text-yellow-450 font-mono flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></span>
                  Riesgo Medio
                </span>
                <span className="text-xs font-bold text-yellow-405 font-mono bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-900/30">
                  {analyzedAltars.filter(a => a.threatLevel === "MEDIO").length}
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter(a => a.threatLevel === "MEDIO")
                  .map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-slate-900/60 border border-yellow-500/25 hover:border-yellow-500/60 hover:bg-slate-900 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                          <p className="text-xs font-semibold text-white truncate">{a.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span>DUEÑO: {a.occupiedBy}</span>
                          {a.coordX !== undefined && a.coordY !== undefined && a.coordX !== null && a.coordY !== null && (
                            <span className="text-yellow-400 font-bold">[{a.coordX}, {a.coordY}]</span>
                          )}
                        </div>
                      </div>
                      <Crosshair className="w-4 h-4 text-yellow-500 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter(a => a.threatLevel === "MEDIO").length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-600 italic font-mono">Ninguno en riesgo medio</div>
                )}
              </div>
            </div>

            {/* Safe */}
            <div className="bg-slate-950/55 border border-emerald-500/20 p-4 rounded-xl shadow-lg shadow-emerald-950/5 hover:border-emerald-500/35 transition-all">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2">
                <span className="text-[11px] font-bold text-emerald-450 font-mono flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span>
                  Zonas Seguras
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30">
                  {analyzedAltars.filter(a => a.threatLevel === "SEGURO").length}
                </span>
              </div>
              <div className="space-y-2">
                {analyzedAltars
                  .filter(a => a.threatLevel === "SEGURO")
                  .map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => onSelectAltar(a)}
                      className="p-2.5 bg-slate-900/60 border border-emerald-500/25 hover:border-emerald-500/60 hover:bg-slate-900 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold text-white truncate">{a.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span>DUEÑO: {a.occupiedBy}</span>
                          {a.coordX !== undefined && a.coordY !== undefined && a.coordX !== null && a.coordY !== null && (
                            <span className="text-emerald-400 font-bold">[{a.coordX}, {a.coordY}]</span>
                          )}
                        </div>
                      </div>
                      <Shield className="w-4 h-4 text-emerald-450 shrink-0" />
                    </div>
                  ))}
                {analyzedAltars.filter(a => a.threatLevel === "SEGURO").length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-600 italic font-mono">Ninguno catalogado seguro</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Matrix Grid */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-3">Altar (Puesto Avanzado)</th>
                <th className="py-3 px-3">Ocupado Por</th>
                <th className="py-3 px-3">Mis Vecinos (Frontera)</th>
                <th className="py-3 px-3">Amenazas de Pérdida</th>
                <th className="py-3 px-3">Estado de Escudo</th>
              </tr>
            </thead>
            <tbody>
              {analyzedAltars.map(a => {
                const style = getStyle(a.occupiedBy);

                return (
                  <tr 
                    key={a.id} 
                    onClick={() => onSelectAltar(a)}
                    className="border-b border-slate-800/40 hover:bg-slate-950/60 cursor-pointer transition-all"
                  >
                    <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <div>{a.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{a.effect}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${style.bg} ${style.text} border ${style.border}`}>
                        {a.occupiedBy}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {a.neighbors.map((n, idx) => {
                          const nStyle = getStyle(n);
                          return (
                            <span key={idx} className={`px-1 rounded text-[10px] border ${n === a.occupiedBy ? "bg-slate-800/80 text-slate-500 border-slate-700" : `${nStyle.bg} ${nStyle.text} ${nStyle.border}`}`}>
                              {n}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {a.uniqueThreats.length > 0 ? (
                        <div className="flex items-center gap-1 text-orange-400 font-mono">
                          <Users className="w-3.5 h-3.5" />
                          <span>{a.uniqueThreats.join(", ")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Ninguno</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {a.isProtected ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                          <Shield className="w-3.5 h-3.5 shrink-0" /> PROTEGIDO
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 font-mono text-[10px]">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> VULNERABLE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
