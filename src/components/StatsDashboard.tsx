import React from "react";
import { Altar } from "../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Shield, ShieldAlert, Award, Castle, CheckCircle2 } from "lucide-react";

interface StatsDashboardProps {
  altars: Altar[];
  onSelectAlliance: (alliance: string | null) => void;
  selectedAlliance: string | null;
}

const ALLIANCE_COLORS: Record<string, string> = {
  LTS: "#3b82f6", // Blue
  UNR: "#ef4444", // Red
  TDS: "#10b981", // Emerald
  LAT: "#f59e0b", // Amber
  AGE: "#8b5cf6", // Purple
  XPR: "#ec4899", // Pink
  RNV: "#14b8a6", // Teal
  DESCONOCIDO: "#6b7280" // Gray
};

export default function StatsDashboard({ altars, onSelectAlliance, selectedAlliance }: StatsDashboardProps) {
  const now = new Date();

  // 1. Calculate General Numbers
  const totalCount = altars.length;
  const protectedCount = altars.filter(a => {
    if (!a.protectionExpiresAt) return false;
    return new Date(a.protectionExpiresAt) > now;
  }).length;
  const vulnerableCount = totalCount - protectedCount;

  // 2. Aggregate counts and buffs by alliance
  const allianceStatsMap: Record<string, { count: number; bonuses: string[] }> = {};

  altars.forEach(altar => {
    const occ = altar.occupiedBy ? altar.occupiedBy.toUpperCase().trim() : "DESCONOCIDO";
    if (!allianceStatsMap[occ]) {
      allianceStatsMap[occ] = { count: 0, bonuses: [] };
    }
    allianceStatsMap[occ].count += 1;
    if (altar.effect) {
      allianceStatsMap[occ].bonuses.push(`${altar.name.replace(/\sNivel\s\d+/i, "")}: ${altar.effect}`);
    }
  });

  // Convert to array for Recharts & UI rendering
  const chartData = Object.entries(allianceStatsMap).map(([alliance, data]) => {
    return {
      name: alliance,
      cantidad: data.count,
      color: ALLIANCE_COLORS[alliance] || `#${Math.floor(Math.random() * 16777215).toString(16)}`
    };
  }).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Col 1: Counters (Bento box style with subtle glow and premium borders) */}
      <div className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm relative overflow-hidden group premium-glass-panel">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500 opacity-60"></div>
        <div>
          <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
            <Castle className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform duration-300" /> RESUMEN DE CONTROL
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#050609]/90 p-3.5 rounded-xl border border-zinc-800/80 text-center hover:border-zinc-700 transition-colors">
              <span className="block text-2xl font-extrabold text-white font-mono tracking-tight">{totalCount}</span>
              <span className="text-[10px] text-zinc-400 font-mono">Total Puestos</span>
            </div>
            <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-900/35 text-center hover:bg-emerald-950/30 transition-all">
              <span className="block text-2xl font-extrabold text-emerald-400 font-mono tracking-tight flex items-center justify-center gap-0.5 animate-pulse">
                {protectedCount}
              </span>
              <span className="text-[10px] text-emerald-300/90 font-mono">Protegidos</span>
            </div>
            <div className="bg-rose-950/20 p-3.5 rounded-xl border border-rose-900/35 text-center hover:bg-rose-950/30 transition-all">
              <span className="block text-2xl font-extrabold text-rose-400 font-mono tracking-tight">
                {vulnerableCount}
              </span>
              <span className="text-[10px] text-rose-300/90 font-mono">Vulnerables</span>
            </div>
          </div>
        </div>

        <div className="pt-3.5 border-t border-zinc-800/60 text-[11px] space-y-2 mt-2 font-mono">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-zinc-300 leading-snug">Altares seguros bajo protección temporal activa. No hay riesgo de invasión inmediata.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span className="text-zinc-300 leading-snug">Altares vulnerables sin escudo de paz. Vigilancia crítica de fronteras obligatoria.</span>
          </div>
        </div>
      </div>

      {/* Col 2: Recharts Bar Chart of Occupancy with beautiful styling */}
      <div className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between relative overflow-hidden group premium-glass-panel">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500 opacity-60"></div>
        <div>
          <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest mb-1 flex items-center gap-2 font-mono">
            <Award className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" /> ALTARES POR ALIANZA
          </h3>
          <p className="text-[10px] text-zinc-500 mb-2 font-mono">Haz clic en una barra para filtrar u ocultar otras alianzas</p>
        </div>

        <div className="h-32 w-full mt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: "#788fa6", fontSize: 9, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "11px",
                    fontFamily: "monospace"
                  }}
                />
                <Bar 
                  dataKey="cantidad" 
                  radius={[5, 5, 0, 0]} 
                  onClick={(data) => {
                    if (data && data.name) {
                      if (selectedAlliance === data.name) {
                        onSelectAlliance(null);
                      } else {
                        onSelectAlliance(data.name);
                      }
                    }
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => {
                    const isSelected = selectedAlliance === entry.name;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        opacity={selectedAlliance ? (isSelected ? 1.0 : 0.3) : 0.85}
                        stroke={isSelected ? "#ffffff" : "transparent"}
                        strokeWidth={isSelected ? 1.5 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-650 text-xs font-mono">
              Sin datos disponibles
            </div>
          )}
        </div>

        {selectedAlliance ? (
          <div className="mt-1 text-center">
            <button
              onClick={() => onSelectAlliance(null)}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline font-mono font-bold cursor-pointer"
            >
              ★ Quitar Filtro: {selectedAlliance}
            </button>
          </div>
        ) : (
          <div className="text-center text-[10px] text-slate-500 font-mono">
            Mostrando total de distribuciones tácticas
          </div>
        )}
      </div>

      {/* Col 3: Active Buffs Breakdown with Progress Bars */}
      <div className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between max-h-[224px] overflow-y-auto custom-scrollbar relative overflow-hidden group premium-glass-panel">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500 opacity-60"></div>
        <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono border-b border-zinc-800/50 pb-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 group-hover:rotate-6 transition-transform duration-300" /> CONTROL & BONIFICADORES
        </h3>
        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          {Object.entries(allianceStatsMap)
            .filter(([alliance]) => !selectedAlliance || alliance === selectedAlliance)
            .map(([alliance, data]) => {
              const color = ALLIANCE_COLORS[alliance] || "#cbd5e1";
              const pct = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
              return (
                <div key={alliance} className="bg-[#050609]/60 p-2.5 rounded-xl border border-zinc-850 hover:border-zinc-800 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-950 font-mono tracking-wider shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {alliance}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-300 font-sans">
                        {pct}% Territorio
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {data.count} {data.count === 1 ? "altares" : "altares"}
                    </span>
                  </div>

                  {/* Territory Share Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden mb-2 border border-zinc-900">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    ></div>
                  </div>

                  {data.bonuses.length > 0 ? (
                    <ul className="text-[10.5px] text-zinc-300 space-y-1 list-disc pl-4 font-sans leading-relaxed">
                      {data.bonuses.map((bonus, key) => (
                        <li key={key} className="hover:text-white transition-colors">
                          {bonus}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[10px] text-zinc-500 italic block">No otorga bonificadores</span>
                  )}
                </div>
              );
            })}
          {Object.keys(allianceStatsMap).length === 0 && (
            <div className="text-center text-slate-600 text-xs italic py-4">
              Ningún altar registrado actualmente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
