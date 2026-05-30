import React, { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { AltarEvent, AltarActionType } from "../types";
import { 
  FileClock, 
  Search, 
  Trash2, 
  Plus, 
  Edit, 
  ShieldAlert, 
  UserCheck, 
  Clipboard, 
  RotateCcw,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface EventLogProps {
  events: AltarEvent[];
  onClearEvents: () => void;
}

const ACTION_CONFIGS: Record<AltarActionType, { 
  label: string; 
  color: string; 
  bg: string; 
  border: string; 
  icon: React.ComponentType<{ className?: string }> 
}> = {
  CREATE: { 
    label: "CREACION", 
    color: "text-emerald-400", 
    bg: "bg-emerald-950/20", 
    border: "border-emerald-500/20", 
    icon: Plus 
  },
  UPDATE: { 
    label: "MODIFICACION", 
    color: "text-blue-400", 
    bg: "bg-blue-950/20", 
    border: "border-blue-500/20", 
    icon: Edit 
  },
  DELETE: { 
    label: "ELIMINACION", 
    color: "text-rose-400", 
    bg: "bg-rose-950/20", 
    border: "border-rose-500/20", 
    icon: Trash2 
  },
  RENEW: { 
    label: "ESCUDO", 
    color: "text-teal-400", 
    bg: "bg-teal-950/20", 
    border: "border-teal-500/20", 
    icon: RefreshCw 
  },
  OCCUPANT_CHANGE: { 
    label: "PROPIEDAD", 
    color: "text-purple-400", 
    bg: "bg-purple-950/20", 
    border: "border-purple-500/20", 
    icon: UserCheck 
  },
  IMPORT: { 
    label: "IMPORTACION", 
    color: "text-amber-400", 
    bg: "bg-amber-950/20", 
    border: "border-amber-500/20", 
    icon: Clipboard 
  },
  RESET: { 
    label: "SISTEMA", 
    color: "text-orange-400", 
    bg: "bg-orange-950/20", 
    border: "border-orange-500/20", 
    icon: RotateCcw 
  }
};

export default function EventLog({ events, onClearEvents }: EventLogProps) {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<"ALL" | AltarActionType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(evt => {
    const matchesFilter = activeFilter === "ALL" || evt.actionType === activeFilter;
    const matchesSearch = searchTerm.trim() === "" || 
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.altarName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFormatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="activity-log" className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 premium-glass-panel">
      
      {/* Header and statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/20 border border-purple-900/30 flex items-center justify-center">
            <FileClock className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-md font-bold text-white tracking-widest uppercase font-mono flex items-center gap-2">
              {t('activityLog.title')}
            </h2>
            <p className="text-xs text-zinc-400">
              {t('activityLog.desc')}
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("¿Está seguro que desea borrar todo el historial de auditoría? Esta acción no se puede deshacer.")) {
                onClearEvents();
              }
            }}
            className="text-[10px] font-bold text-rose-400 hover:text-white bg-rose-950/25 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/35 transition-all cursor-pointer flex items-center gap-1.5 font-mono uppercase shadow-sm"
          >
            <Trash2 className="w-3 h-3 text-rose-400" /> {t('activityLog.clearLog')}
          </button>
        )}
      </div>

      {/* Control filter bar & search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('activityLog.searchPlaceholder')}
            className="w-full bg-[#050609]/90 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-650 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20"
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-8 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wide font-semibold border transition-all cursor-pointer ${
              activeFilter === "ALL" 
                ? "bg-zinc-900 text-purple-400 border-zinc-800/90 shadow-inner" 
                : "bg-[#050609]/40 text-zinc-400 border-zinc-850 hover:border-zinc-800 hover:text-zinc-200"
            }`}
          >
            {t('activityLog.allFilters')} ({events.length})
          </button>
          
          {(["CREATE", "UPDATE", "DELETE", "RENEW", "OCCUPANT_CHANGE", "IMPORT", "RESET"] as AltarActionType[]).map(type => {
            const count = events.filter(e => e.actionType === type).length;
            const config = ACTION_CONFIGS[type];
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wide font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === type 
                    ? "bg-zinc-900 text-purple-400 border-zinc-800/90 shadow-inner" 
                    : "bg-[#050609]/40 text-zinc-400 border-zinc-850 hover:border-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span>{config.label}</span>
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline view */}
      {filteredEvents.length > 0 ? (
        <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-5 py-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {filteredEvents.map((evt) => {
            const config = ACTION_CONFIGS[evt.actionType] || ACTION_CONFIGS.RESET;
            const Icon = config.icon;
            
            return (
              <div key={evt.id} className="relative group">
                {/* Timeline dot & indicator with icon */}
                <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950 ${config.bg} ${config.border} shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </span>

                {/* Event details block */}
                <div className="bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850 hover:border-slate-800 rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Operation tag */}
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border uppercase ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                      {evt.altarName && (
                        <span className="bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-sky-400 font-semibold uppercase">
                          {evt.altarName}
                        </span>
                      )}
                    </div>
                    
                    {/* Event main summary message text */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {evt.description}
                    </p>
                  </div>

                  {/* Absolute / relative time label info */}
                  <div className="shrink-0 font-mono text-[10px] text-slate-500 self-start sm:self-center">
                    {getFormatTime(evt.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-950/45 rounded-2xl border border-slate-850/80">
          <FolderOpen className="w-8 h-8 text-slate-650 mx-auto mb-2 opacity-50" />
          <span className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Sin registros</span>
          <span className="text-slate-400 text-xs">
            {events.length === 0 
              ? "No se han detectado eventos aún. Realice operaciones de altares para iniciar la auditoría."
              : "Ningún registro de auditoría coincide con los filtros aplicados."}
          </span>
        </div>
      )}
    </div>
  );
}
