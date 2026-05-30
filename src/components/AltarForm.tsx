import React, { useState, useEffect } from "react";
import { Altar } from "../types";
import { parseRelativeTimeToMs } from "../utils/parser";
import { Save, HelpCircle, X, Plus, AlertCircle } from "lucide-react";

interface AltarFormProps {
  altar?: Altar | null; // If provided, we are editing
  onSave: (altarData: Omit<Altar, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onClose: () => void;
}

export default function AltarForm({ altar, onSave, onClose }: AltarFormProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [effect, setEffect] = useState("");
  const [neighborsInput, setNeighborsInput] = useState("");
  const [occupiedBy, setOccupiedBy] = useState("");
  const [protectionTimeInput, setProtectionTimeInput] = useState("");
  const [notes, setNotes] = useState("");
  const [coordX, setCoordX] = useState("");
  const [coordY, setCoordY] = useState("");

  const [parseIndicator, setParseIndicator] = useState<{ success: boolean; msg: string } | null>(null);

  // Populates data on Edit Mode
  useEffect(() => {
    if (altar) {
      setName(altar.name.replace(/\sNivel\s\d+/i, "")); // strip level suffix for clean editing
      setLevel(altar.level || 1);
      setEffect(altar.effect || "");
      setNeighborsInput(altar.neighbors ? altar.neighbors.join(", ") : "");
      setOccupiedBy(altar.occupiedBy || "");
      setProtectionTimeInput(altar.protectionTimeInput || "");
      setNotes(altar.notes || "");
      setCoordX(altar.coordX !== undefined && altar.coordX !== null ? String(altar.coordX) : "");
      setCoordY(altar.coordY !== undefined && altar.coordY !== null ? String(altar.coordY) : "");
    } else {
      // Create presets
      setName("");
      setLevel(1);
      setEffect("");
      setNeighborsInput("");
      setOccupiedBy("");
      setProtectionTimeInput("");
      setNotes("");
      setCoordX("");
      setCoordY("");
    }
  }, [altar]);

  // Real-time parsed protective feed-backs
  useEffect(() => {
    if (!protectionTimeInput.trim()) {
      setParseIndicator(null);
      return;
    }
    const ms = parseRelativeTimeToMs(protectionTimeInput);
    if (ms !== null) {
      const minutes = Math.floor((ms / 60000) % 60);
      const hours = Math.floor((ms / 3600000) % 24);
      const days = Math.floor(ms / 86400000);
      setParseIndicator({
        success: true,
        msg: `Válido: ${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}h y ${minutes.toString().padStart(2, "0")}m de escudo.`
      });
    } else {
      setParseIndicator({
        success: false,
        msg: "Formato no reconocido. Usa ej.: '1d 03:50 H' o '10:29 H' o '2d'."
      });
    }
  }, [protectionTimeInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    // Split neighbors by commas or whitespace
    const neighbors = neighborsInput
      .split(/[\s,;\-]+/)
      .map(tag => tag.trim().toUpperCase())
      .filter(tag => tag.length > 0);

    // Save
    onSave({
      id: altar?.id, // include ID if editing
      name: `${name.trim()} Nivel ${level}`,
      level,
      effect: effect.trim(),
      neighbors,
      occupiedBy: (occupiedBy.trim() || "DESCONOCIDO").toUpperCase(),
      protectionTimeInput: protectionTimeInput.trim(),
      protectionExpiresAt: altar ? altar.protectionExpiresAt : null, // parent app will recal if needed
      notes: notes.trim(),
      coordX: coordX.trim() !== "" ? Number(coordX) : undefined,
      coordY: coordY.trim() !== "" ? Number(coordY) : undefined
    });

    onClose();
  };

  // Quick Durations helpers
  const applyPresetTime = (preset: string) => {
    setProtectionTimeInput(preset);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
            {altar ? "📝 Editar Altar / Puesto de Avanzada" : "➕ Crear Nuevo Altar / Puesto de Avanzada"}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Altar Name */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
              Nombre de Altar *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Gremio de Constructores (sin nivel)"
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Level */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
                Nivel de Altar
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all"
              >
                {[1, 2, 3, 4, 5].map(lvl => (
                  <option key={lvl} value={lvl}>Nivel {lvl}</option>
                ))}
              </select>
            </div>

            {/* Occupant Alliance */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
                Ocupado por (Alianza)
              </label>
              <input
                type="text"
                value={occupiedBy}
                onChange={(e) => setOccupiedBy(e.target.value)}
                placeholder="Ej. LTS, UNR"
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 uppercase outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Coordinate X */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
                Coordenada X (Opcional)
              </label>
              <input
                type="number"
                value={coordX}
                onChange={(e) => setCoordX(e.target.value)}
                placeholder="Ej. 500"
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
              />
            </div>

            {/* Coordinate Y */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
                Coordenada Y (Opcional)
              </label>
              <input
                type="number"
                value={coordY}
                onChange={(e) => setCoordY(e.target.value)}
                placeholder="Ej. 650"
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
              />
            </div>
          </div>

          {/* Buff / Passive Effect */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
              Efecto o Bonificación (*opcional)
            </label>
            <input
              type="text"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="Ej: Velocidad de Construcción +5.0% o Ataque +5.0%"
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
            />
          </div>

          {/* Neighbors Borders list */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1">
              Alianzas de Vecinos (Frontera)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1.5 leading-snug">
              Separados por comas o espacios. Los rivales que bordean este altar.
            </span>
            <input
              type="text"
              value={neighborsInput}
              onChange={(e) => setNeighborsInput(e.target.value)}
              placeholder="Ej: UNR, LTS, LAT"
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 uppercase outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
            />
          </div>

          {/* Protection Duration text */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block">
                Tiempo de Protección (Duración)
              </label>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Formato relativo de tiempo</span>
              </div>
            </div>

            <input
              type="text"
              value={protectionTimeInput}
              onChange={(e) => setProtectionTimeInput(e.target.value)}
              placeholder="Ej. '1d 03:50 H' o '10:29 H' o '02:00'"
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => applyPresetTime("1d 03:50 H")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 cursor-pointer"
              >
                1d 3h 50m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("2d 03:52 HORAS")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 cursor-pointer"
              >
                2d 3h 52m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("10:29 HORAS")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 cursor-pointer"
              >
                10h 29m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("01:06 HORAS")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 cursor-pointer"
              >
                1h 6m
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime("")}
                className="bg-slate-905 hover:bg-rose-950/20 text-rose-400 border border-rose-950 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer"
              >
                Inactivo
              </button>
            </div>

            {/* Relative parsing indicator */}
            {parseIndicator && (
              <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-mono ${parseIndicator.success ? "text-emerald-400" : "text-amber-500"}`}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{parseIndicator.msg}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">
              Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Proteger a toda costa, priorizar defensa remota."
              rows={2}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs font-mono text-slate-250 outline-none hover:border-slate-700/85 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder-slate-650"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-4 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wide cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10 transition-all"
            >
              <Save className="w-4 h-4 text-slate-950" />
              {altar ? "Guardar Cambios" : "Agregar Altar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
