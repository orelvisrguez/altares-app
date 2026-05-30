import React, { useState, useEffect } from "react";
import { Altar, AltarEvent, AltarActionType } from "./types";
import { INITIAL_ALTAR_PRESETS, calculateExpiration, formatRemainingTime } from "./utils/parser";
import StatsDashboard from "./components/StatsDashboard";
import MapVisualization from "./components/MapVisualization";
import AltarCard from "./components/AltarCard";
import AltarForm from "./components/AltarForm";
import QuickImporter from "./components/QuickImporter";
import EventLog from "./components/EventLog";
import { 
  Plus, 
  Search, 
  Clipboard, 
  Download, 
  Upload, 
  HelpCircle, 
  LayoutGrid, 
  List, 
  RotateCcw,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldAlert as AlertTriangle
} from "lucide-react";

export default function App() {
  // 1. Core State
  const [altars, setAltars] = useState<Altar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOccupier, setFilterOccupier] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'protected' | 'vulnerable'
  const [sortBy, setSortBy] = useState("expiry"); // 'expiry' | 'level' | 'name' | 'occupiedBy'
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [events, setEvents] = useState<AltarEvent[]>([]);

  // Interaction States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAltar, setEditingAltar] = useState<Altar | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState<string | null>(null);
  
  // Real Time Tick Helper
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper for automated Event Logging
  const logEvent = (actionType: AltarActionType, description: string, altarName?: string, altarId?: string) => {
    const newEvent: AltarEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actionType,
      altarName,
      altarId,
      description,
      timestamp: new Date().toISOString()
    };
    setEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 150);
      localStorage.setItem("alliance_altar_events", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearEvents = () => {
    setEvents([]);
    localStorage.removeItem("alliance_altar_events");
  };

  // 2. Load initially
  useEffect(() => {
    const saved = localStorage.getItem("alliance_altars");
    if (saved) {
      try {
        setAltars(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar altares:", e);
        setAltars(INITIAL_ALTAR_PRESETS);
      }
    } else {
      setAltars(INITIAL_ALTAR_PRESETS);
    }

    const savedEvents = localStorage.getItem("alliance_altar_events");
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error("Error al cargar eventos:", e);
        setEvents([]);
      }
    }
  }, []);

  // Save changes
  const saveAltarsToStorage = (newAltars: Altar[]) => {
    setAltars(newAltars);
    localStorage.setItem("alliance_altars", JSON.stringify(newAltars));
  };

  // Tick timer every second for countdown representation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. CRUD actions
  const handleSaveAltar = (formData: Omit<Altar, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const nowStr = new Date().toISOString();
    
    if (formData.id) {
      // Edit Mode
      const oldAltar = altars.find(alt => alt.id === formData.id);
      const updated = altars.map(alt => {
        if (alt.id === formData.id) {
          // If the protection input changed, let's recalculate the expiration Relative to NOW
          let newExpiry = alt.protectionExpiresAt;
          if (alt.protectionTimeInput !== formData.protectionTimeInput) {
            newExpiry = formData.protectionTimeInput
              ? calculateExpiration(formData.protectionTimeInput)
              : null;
          }
          
          return {
            ...alt,
            ...formData,
            protectionExpiresAt: newExpiry,
            updatedAt: nowStr
          } as Altar;
        }
        return alt;
      });
      saveAltarsToStorage(updated);

      if (oldAltar) {
        const changes: string[] = [];
        if (oldAltar.name !== formData.name) changes.push(`nombre de '${oldAltar.name}' a '${formData.name}'`);
        if (oldAltar.level !== formData.level) changes.push(`nivel de ${oldAltar.level} a ${formData.level}`);
        if (oldAltar.occupiedBy.toUpperCase().trim() !== formData.occupiedBy.toUpperCase().trim()) {
          changes.push(`ocupante de '${oldAltar.occupiedBy || "VACÍO"}' a '${formData.occupiedBy.toUpperCase().trim() || "VACÍO"}'`);
        }
        if (oldAltar.coordX !== formData.coordX || oldAltar.coordY !== formData.coordY) {
          changes.push(`coordenadas de [${oldAltar.coordX ?? "-"}, ${oldAltar.coordY ?? "-"}] a [${formData.coordX ?? "-"}, ${formData.coordY ?? "-"}]`);
        }
        if (oldAltar.protectionTimeInput !== formData.protectionTimeInput) {
          changes.push(`duración de escudo de '${oldAltar.protectionTimeInput || "Ninguna"}' a '${formData.protectionTimeInput || "Ninguna"}'`);
        }
        if (oldAltar.notes !== formData.notes) {
          changes.push(`anotaciones tácticas actualizadas`);
        }
        const description = changes.length > 0
          ? `Altar modificado: ${changes.join(", ")}`
          : `Altar '${formData.name}' guardado sin modificaciones estructurales.`;
        logEvent("UPDATE", description, formData.name, formData.id);
      }
    } else {
      // Create Mode
      const newAltar: Altar = {
        id: `altar_${Date.now()}`,
        name: formData.name,
        level: formData.level,
        effect: formData.effect,
        neighbors: formData.neighbors,
        occupiedBy: formData.occupiedBy,
        protectionTimeInput: formData.protectionTimeInput,
        protectionExpiresAt: formData.protectionTimeInput
          ? calculateExpiration(formData.protectionTimeInput)
          : null,
        createdAt: nowStr,
        updatedAt: nowStr,
        notes: formData.notes,
        coordX: formData.coordX,
        coordY: formData.coordY
      };
      saveAltarsToStorage([...altars, newAltar]);
      logEvent("CREATE", `Se creó el altar '${formData.name}' de Nivel ${formData.level} ocupado por '${formData.occupiedBy.toUpperCase() || "DESCONOCIDO"}' en Coordenadas [${formData.coordX ?? "-"}, ${formData.coordY ?? "-"}].`, formData.name, newAltar.id);
    }
    setEditingAltar(null);
  };

  const handleDeleteAltar = (id: string) => {
    const altarToDelete = altars.find(a => a.id === id);
    if (altarToDelete && window.confirm("¿Está seguro que desea eliminar este altar?")) {
      const filtered = altars.filter(a => a.id !== id);
      saveAltarsToStorage(filtered);
      logEvent("DELETE", `Se eliminó el altar '${altarToDelete.name}' (Nivel ${altarToDelete.level}) del sistema que estaba ocupado por '${altarToDelete.occupiedBy || "DESCONOCIDO"}'.`, altarToDelete.name, id);
    }
  };

  const handleQuickChangeOccupant = (id: string, newOccupant: string) => {
    const altar = altars.find(alt => alt.id === id);
    const updated = altars.map(alt => {
      if (alt.id === id) {
        return {
          ...alt,
          occupiedBy: newOccupant.toUpperCase().trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return alt;
    });
    saveAltarsToStorage(updated);
    if (altar) {
      logEvent("OCCUPANT_CHANGE", `Cambio rápido de alianza ocupante: pasó de '${altar.occupiedBy || "DESCONOCIDO"}' a '${newOccupant.toUpperCase().trim()}'.`, altar.name, id);
    }
  };

  const handleRefreshProtection = (id: string) => {
    const altar = altars.find(alt => alt.id === id);
    const updated = altars.map(alt => {
      if (alt.id === id) {
        return {
          ...alt,
          protectionExpiresAt: alt.protectionTimeInput 
            ? calculateExpiration(alt.protectionTimeInput)
            : null,
          updatedAt: new Date().toISOString()
        };
      }
      return alt;
    });
    saveAltarsToStorage(updated);
    if (altar) {
      logEvent("RENEW", `Se renovó el escudo activo por una duración base de '${altar.protectionTimeInput || "Ninguna"}'.`, altar.name, id);
    }
  };

  // Bulk Import Actions
  const handleBulkImport = (newAltars: Altar[]) => {
    saveAltarsToStorage(newAltars);
    logEvent("IMPORT", `Se sincronizaron de forma exitosa ${newAltars.length} altares mediante el importador rápido de chat de WhatsApp.`, undefined, undefined);
  };

  // Restore Default presets
  const handleResetToPresets = () => {
    if (window.confirm("¿Estás seguro de que deseas restablecer la base de datos a los 10 altares por defecto? Perderás tus modificaciones actuales.")) {
      saveAltarsToStorage(INITIAL_ALTAR_PRESETS);
      logEvent("RESET", `Se restablecieron los 10 altares principales por defecto de la base de datos táctica de la Alianza.`, undefined, undefined);
    }
  };

  // Backup Tools: JSON Export & Import
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(altars, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `copia-seguridad-altares-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (Array.isArray(parsed)) {
              if (window.confirm(`Se encontraron ${parsed.length} altares en la copia de seguridad. ¿Deseas importarlos?`)) {
                saveAltarsToStorage(parsed);
                logEvent("IMPORT", `Se restauró una copia de seguridad externa de disco (.json) con un total de ${parsed.length} altares.`, undefined, undefined);
              }
            } else {
              alert("Formato de copia de seguridad inválido.");
            }
          } catch (err) {
            alert("Error al leer el archivo JSON.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Focus Altar triggered from MapVisualization clicking
  const handleSelectAltarFromMap = (altar: Altar) => {
    setSearchQuery(altar.name.replace(/\sNivel\s\d+/i, "")); // filter search to focus list on it
    // Scroll smoothly to list
    const el = document.getElementById("panel-list");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Alliances list in selectors
  const allOccupiers = Array.from(new Set(altars.map(a => (a.occupiedBy || "").toUpperCase().trim()))).filter(Boolean);

  // 4. Filtering and Sorting logic
  const filteredAltars = altars.filter(altar => {
    // Search filter
    const matchesSearch = 
      altar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      altar.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (altar.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Occupier filter (either dropdown or clicked alliance filter from StatsDashboard)
    const normalizedOccupier = (altar.occupiedBy || "").toUpperCase().trim();
    const finalOccupierFilter = selectedAlliance || filterOccupier;
    const matchesOccupier = !finalOccupierFilter || normalizedOccupier === finalOccupierFilter.toUpperCase().trim();

    // Protection status filter
    const isProtected = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt) > currentTime : false;
    let matchesStatus = true;
    if (filterStatus === "protected") matchesStatus = isProtected;
    if (filterStatus === "vulnerable") matchesStatus = !isProtected;

    return matchesSearch && matchesOccupier && matchesStatus;
  }).sort((a, b) => {
    // Sorter logic
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "level") {
      return b.level - a.level;
    }
    if (sortBy === "occupiedBy") {
      return a.occupiedBy.localeCompare(b.occupiedBy);
    }
    // expiry date sort (by default)
    const aExpiry = a.protectionExpiresAt ? new Date(a.protectionExpiresAt).getTime() : 0;
    const bExpiry = b.protectionExpiresAt ? new Date(b.protectionExpiresAt).getTime() : 0;
    
    // Sort logic: active countdowns showing longest remaining on top, then expired/vulnerable on bottom
    const isAPending = aExpiry > currentTime.getTime();
    const isBPending = bExpiry > currentTime.getTime();
    if (isAPending && isBPending) {
      return aExpiry - bExpiry; // closest expiry first
    }
    if (isAPending) return -1; // showing protected on top
    if (isBPending) return 1;

    // Both vulnerable, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 font-sans selection:bg-purple-500 selection:text-white pb-16 antialiased relative overflow-hidden">
      {/* Decorative Tactical Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/3 rounded-full blur-[160px] pointer-events-none select-none z-0" />
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] bg-purple-500/3 rounded-full blur-[140px] pointer-events-none select-none z-0" />
      <div className="absolute bottom-10 left-10 w-[800px] h-[800px] bg-emerald-500/3 rounded-full blur-[200px] pointer-events-none select-none z-0" />

      {/* Top Combat Header info */}
      <header className="border-b border-zinc-800/50 bg-[#07080c]/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-purple-500/10 transition-transform duration-300 hover:rotate-12">
              <span className="font-mono font-bold text-white text-md">✥</span>
            </div>
            <div>
              <h1 className="text-xs md:text-sm font-extrabold text-white tracking-widest uppercase font-mono bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                SISTEMA REY DE ALTARES
              </h1>
              <p className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">
                PANEL DE CONTROL TÁCTICO DE FRONTERAS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* UTC/Local Real Time Clock */}
            <div className="hidden md:flex items-center gap-2 bg-[#0d0e12] px-3.5 py-1.5 rounded-xl border border-zinc-800/60 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider">HORA LOCAL:</span>
              <span className="text-[11px] font-bold text-white font-mono tracking-tight">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* Core Preset Restorer */}
            <button
              onClick={handleResetToPresets}
              className="text-[10px] font-bold text-zinc-400 hover:text-white bg-[#0e0f14] hover:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800/80 transition-all cursor-pointer flex items-center gap-1.5 font-mono uppercase shadow-sm active:scale-95"
              title="Restablecer base de datos inicial de altares"
            >
              <RotateCcw className="w-3 h-3 text-amber-500" /> Restablecer
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Banner alert if empty */}
        {altars.length === 0 && (
          <div className="bg-yellow-950/25 border border-yellow-900/30 p-4 rounded-2xl text-yellow-300 text-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold block text-sm mb-1">¡No hay altares registrados!</span>
              <span>Comienza agregando un altar individualmente o importa tu lista directamente de WhatsApp con el Importador Rápido.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingAltar(null);
                  setIsFormOpen(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer"
              >
                + AGREGAR MANUALLY
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer"
              >
                📥 DE CHAT RAPID
              </button>
            </div>
          </div>
        )}

        {/* 1. Dashboard Analytics */}
        <StatsDashboard 
          altars={altars} 
          onSelectAlliance={(alliance) => setSelectedAlliance(alliance)}
          selectedAlliance={selectedAlliance}
        />

        {/* 2. Tactical border Threat Visualizer */}
        {altars.length > 0 && (
          <MapVisualization 
            altars={altars} 
            onSelectAltar={handleSelectAltarFromMap}
          />
        )}

        {/* 3. CRUD controls & list section */}
        <div id="panel-list" className="bg-[#0b0c11]/80 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl space-y-6 backdrop-blur-md premium-glass-panel">
          
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/50 pb-4">
            <div>
              <h2 className="text-md font-bold text-white tracking-widest flex items-center gap-2 font-mono">
                📂 BASE DE DATOS DE ALTARES
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Visualiza, realiza búsquedas, filtra y modifica la información de frontera, nivel, bonificadores y escudos.
              </p>
            </div>
 
            {/* Quick Actions create & import */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export/Import Backup block */}
              <div className="flex bg-[#050609] p-1.5 rounded-xl border border-zinc-800/80 mr-1.5">
                <button
                  onClick={handleExportJSON}
                  title="Exportar archivo de copia de seguridad (.json)"
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  onClick={handleImportJSON}
                  title="Importar archivo de copia de seguridad de disco (.json)"
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
 
              {/* Chat paste importer */}
              <button
                onClick={() => setIsImportOpen(true)}
                className="bg-[#090a0f] hover:bg-zinc-900 border border-zinc-800/90 text-purple-400 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer font-mono shadow-sm active:scale-95"
              >
                <Clipboard className="w-3.5 h-3.5 text-purple-400" /> 
                <span>IMPORTAR D/ CHAT</span>
              </button>
 
              {/* Individual creation */}
              <button
                onClick={() => {
                  setEditingAltar(null);
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono shadow-md shadow-purple-900/20 uppercase hover:shadow-purple-500/10 hover:shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4 text-white stroke-[3]" /> 
                <span>NUEVO ALTAR</span>
              </button>
            </div>
          </div>
 
          {/* Filtering bar, search and grid selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Search inputs */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por altar, efecto, notas..."
                className="w-full bg-[#050609]/90 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 hover:border-zinc-700/80 transition-all"
              />
            </div>
 
            {/* Filter by Alliance occupant */}
            <div className="md:col-span-2">
              <select
                value={selectedAlliance ? "dash_active" : filterOccupier}
                onChange={(e) => {
                  if (e.target.value === "dash_active") {
                     setSelectedAlliance(null); // clears dashboard active
                     setFilterOccupier("");
                  } else {
                     setSelectedAlliance(null);
                     setFilterOccupier(e.target.value);
                  }
                }}
                className="w-full bg-[#050609]/90 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 hover:border-zinc-700/80 transition-all cursor-pointer"
              >
                <option value="">-- Todos Ocupantes --</option>
                {selectedAlliance && (
                  <option value="dash_active">★ Filtro Gráf: {selectedAlliance} (Limpiar)</option>
                )}
                {allOccupiers.map(occ => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>
 
            {/* Filter by status */}
            <div className="md:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#050609]/90 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 hover:border-zinc-700/80 transition-all cursor-pointer"
              >
                <option value="all">-- Todos Estados --</option>
                <option value="protected">🛡️ Protegidos</option>
                <option value="vulnerable">⚠️ Vulnerables</option>
              </select>
            </div>
 
            {/* Sorter selection */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#050609]/90 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 hover:border-zinc-700/80 transition-all cursor-pointer"
              >
                <option value="expiry">⏳ Orden de Escudo</option>
                <option value="name">🔤 Nombre Altar</option>
                <option value="level">⭐ Nivel Altar</option>
                <option value="occupiedBy">👑 Alianza Dueña</option>
              </select>
            </div>
 
            {/* Grid vs Compact list list view switcher */}
            <div className="md:col-span-2 flex justify-end gap-1.5 self-center">
              <button
                onClick={() => setViewType("grid")}
                title="Vista Cuadrícula"
                className={`p-2 rounded-xl cursor-pointer transition-all ${viewType === "grid" ? "bg-[#06070a]/90 text-purple-400 border border-zinc-800/90 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType("list")}
                title="Vista Compacta de Tabla"
                className={`p-2 rounded-xl cursor-pointer transition-all ${viewType === "list" ? "bg-[#06070a]/90 text-purple-400 border border-zinc-800/90 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active stats display filter alert */}
          {selectedAlliance && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono font-medium">
              <span className="text-slate-400">
                Mostrando únicamente altares ocupados por la Alianza: <span className="text-white font-bold">{selectedAlliance}</span> (Filtro desde Gráfica de control).
              </span>
              <button 
                onClick={() => setSelectedAlliance(null)}
                className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                Quitar filtro
              </button>
            </div>
          )}

          {/* Core Results display */}
          {filteredAltars.length > 0 ? (
            viewType === "grid" ? (
              /* GRID view list */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAltars.map(altar => (
                  <AltarCard 
                    key={altar.id}
                    altar={altar}
                    onEdit={(a) => {
                      setEditingAltar(a);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDeleteAltar}
                    onQuickChangeOccupant={handleQuickChangeOccupant}
                    onRefreshProtection={handleRefreshProtection}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT TABULAR LISTVIEW */
              <div className="border border-zinc-800/60 rounded-2xl overflow-hidden bg-[#050609]/95">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0b0c11]/80 border-b border-zinc-800/60 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Altar & Nivel</th>
                      <th className="py-3.5 px-4">Efectos</th>
                      <th className="py-3.5 px-4">Ocupador</th>
                      <th className="py-3.5 px-4">Fronteras / Vecinos</th>
                      <th className="py-3.5 px-4">Tiempo Escudo restante</th>
                      <th className="py-3.5 px-4 text-right">Herramientas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAltars.map(altar => {
                      const isShielded = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt) > currentTime : false;
                      const remMs = altar.protectionExpiresAt ? new Date(altar.protectionExpiresAt).getTime() - currentTime.getTime() : 0;
                      
                      return (
                        <tr key={altar.id} className="border-b border-zinc-900/40 hover:bg-[#0c0d12]/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>
                              <span>{altar.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-zinc-350">
                            {altar.effect}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-400 uppercase">
                            {altar.occupiedBy || "NINGUNO"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {altar.neighbors.map((n, key) => (
                                <span key={key} className="text-[10px] font-mono bg-[#0c0d12] px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-850">
                                  {n}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {isShielded ? (
                              <span className="text-emerald-400">
                                {formatRemainingTime(remMs)}
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" /> Vulnerable
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => handleRefreshProtection(altar.id)}
                              className="px-2 py-1 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/50 border border-emerald-900/30 text-[10px] rounded font-mono font-bold transition-all inline-block cursor-pointer alignment-middle"
                              title="Reiniciar/Renovar Escudo"
                            >
                              Renovar
                            </button>
                            <button
                              onClick={() => {
                                setEditingAltar(altar);
                                setIsFormOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] rounded font-mono font-semibold transition-all inline-block cursor-pointer alignment-middle"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteAltar(altar.id)}
                              className="px-2 py-1 bg-rose-950/20 text-rose-400 hover:bg-rose-950/45 border border-rose-900/35 text-[10px] rounded font-mono font-bold transition-all inline-block cursor-pointer alignment-middle"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-850/80">
              <span className="block text-slate-500 font-mono text-xs uppercase mb-1">Sin resultados</span>
              <span className="text-slate-400 text-xs">
                No hay ningún altar que cumpla con los filtros activos. Intente limpiar su término de búsqueda.
              </span>
            </div>
          )}
        </div>

        {/* 4. Automated Audit Trails & Action Logging */}
        <div className="mt-8">
          <EventLog 
            events={events} 
            onClearEvents={handleClearEvents} 
          />
        </div>
      </main>

      {/* Manual creation / update Form Modal */}
      {isFormOpen && (
        <AltarForm 
          altar={editingAltar}
          onSave={handleSaveAltar}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAltar(null);
          }}
        />
      )}

      {/* Clipboard Chat log Bulk populator Drawer/Modal */}
      {isImportOpen && (
        <QuickImporter 
          onImport={handleBulkImport}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {/* Static descriptive Footer */}
      <footer className="mt-16 border-t border-slate-900 py-8 text-center text-xs text-slate-400 font-mono space-y-2">
        <p>SISTEMA REY DE ALTARES • DESARROLLADO PARA COORDINACIÓN ESTRATÉGICA DE ALIANZA</p>
        <p className="text-[10px] text-slate-500">
          * Los tiempos de protección mostrados son aproximados y calculados con temporizadores locales recursivos.
        </p>
      </footer>
    </div>
  );
}
