import React, { useState } from "react";
import { parsePastedOutposts, calculateExpiration } from "../utils/parser";
import { Altar } from "../types";
import { Clipboard, Check, RefreshCw, AlertTriangle, Play, HelpCircle } from "lucide-react";

interface QuickImporterProps {
  onImport: (importedAltars: Altar[]) => void;
  onClose: () => void;
}

export default function QuickImporter({ onImport, onClose }: QuickImporterProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedAltars, setParsedAltars] = useState<Partial<Altar>[]>([]);
  const [isReviewed, setIsReviewed] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");

  const [showHelp, setShowHelp] = useState(false);

  const handleParse = () => {
    if (!pastedText.trim()) return;
    const items = parsePastedOutposts(pastedText);
    setParsedAltars(items);
    setIsReviewed(true);
  };

  const handleFinalImport = () => {
    if (parsedAltars.length === 0) return;

    const finalAltars: Altar[] = parsedAltars.map((item, idx) => {
      const nowStr = new Date().toISOString();
      return {
        id: item.id || `imported_${idx}_${Date.now()}`,
        name: item.name || "Altar Desconocido",
        level: item.level || 1,
        effect: item.effect || "Sin efecto",
        neighbors: item.neighbors || [],
        occupiedBy: item.occupiedBy || "DESCONOCIDO",
        protectionTimeInput: item.protectionTimeInput || "",
        protectionExpiresAt: item.protectionTimeInput 
          ? calculateExpiration(item.protectionTimeInput) 
          : null,
        createdAt: nowStr,
        updatedAt: nowStr,
        notes: item.notes || "Importado mediante texto"
      };
    });

    onImport(finalAltars);
    onClose();
  };

  const helpTemplate = `Puestos de Avanzadas (ALTARES)
- Gremio de Constructores Nivel 1
  Velocidad de Construcción +5.0%
  Vecinos: UNR, LTS, LAT
  Ocupado por: LTS
  Tiempo de protección: 1d 03:50 H`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-sky-400" /> IMPORTADOR RÁPIDO DESDE CHAT
            </h3>
            <p className="text-xs text-slate-400">
              Pega la lista de altares copiada directamente de Discord, WhatsApp o del juego. El sistema la analizará automáticamente.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-mono transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isReviewed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  Área de Pegado de Texto
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> {showHelp ? "Ocultar Ejemplo" : "Ver Formato Soportado"}
                </button>
              </div>

              {showHelp && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-2 font-mono">
                  <p className="text-slate-200 font-semibold mb-1">Ejemplo de formato soportado:</p>
                  <pre className="text-[11px] leading-relaxed select-all whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {helpTemplate}
                  </pre>
                  <p className="text-[10px] text-slate-500">
                    * El analizador busca líneas de título comenzando con guión (-) y palabras clave como "Vecinos:", "Ocupado por:" y "protección:".
                  </p>
                </div>
              )}

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Pega tu texto aquí... Ejemplo:&#10;- Gremio de Constructores Nivel 1&#10;  Velocidad de Construcción +5.0%&#10;  Vecinos: UNR, LTS, LAT&#10;  Ocupado por: LTS&#10;  Tiempo de protección: 1d 03:50 H"
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-650 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={!pastedText.trim()}
                  className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-sky-500/10"
                >
                  <Play className="w-4 h-4 fill-current text-slate-950" /> Analizar Texto
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review status */}
              <div className="bg-emerald-950/25 border border-emerald-900/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold block uppercase tracking-wider">
                    ANÁLISIS COMPLETADO
                  </span>
                  <span className="text-sm text-white font-bold">
                    Se detectaron {parsedAltars.length} Puestos de Avanzada (Altares) en el texto.
                  </span>
                </div>
                <button
                  onClick={() => setIsReviewed(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Volver a Pegar
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2 font-mono uppercase">
                    Modo de Inserción:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === "merge"}
                        onChange={() => setImportMode("merge")}
                        className="accent-sky-500"
                      />
                      <div>
                        <span className="font-bold text-white block">Fusionar y Mantener Existentes</span>
                        <span className="text-slate-400 text-[10px]">Actualiza coincidencias de nombre, añade registros nuevos.</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === "overwrite"}
                        onChange={() => setImportMode("overwrite")}
                        className="accent-sky-500"
                      />
                      <div>
                        <span className="font-bold text-rose-400 block">Reemplazar Base de Datos</span>
                        <span className="text-slate-400 text-[10px]">Borra todos los altares actuales y guárdala con esta lista.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-950/25 border border-yellow-905/30 rounded-lg p-3 text-[11px] text-yellow-350 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-400" />
                  <span>
                    El tiempo de protección se recalculará desde este momento utilizando los lapsos del texto pegado (ej. 1d 03h 50m desde ahora).
                  </span>
                </div>
              </div>

              {/* Table of extracted */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="p-3">Nombre & Nivel</th>
                      <th className="p-3">Efecto</th>
                      <th className="p-3">Ocupado Por</th>
                      <th className="p-3">Vecinos</th>
                      <th className="p-3">Protección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedAltars.map((alt, i) => (
                      <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">
                          {alt.name} <span className="text-[10px] text-sky-400 font-mono bg-sky-950/40 px-1 py-0.5 rounded ml-1">Lvl {alt.level}</span>
                        </td>
                        <td className="p-3 text-slate-300">{alt.effect}</td>
                        <td className="p-3 font-mono font-bold text-slate-300">{alt.occupiedBy}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {alt.neighbors?.join(", ") || "Ninguno"}
                        </td>
                        <td className="p-3 text-emerald-400 font-mono text-[10px]">
                          {alt.protectionTimeInput || "Ninguna"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalImport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <Check className="w-4 h-4 text-slate-950" /> Confirmar e importar {parsedAltars.length} Registro(s)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { parsePastedOutposts };
