

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
// ==============================================================
// -------------------- Utilitaires compacts --------------------
// ==============================================================

    // Effet texte lumineux (réutilisé dans plusieurs composants)
    const glow = {
      textShadow:
        "0 0 10px rgba(186,159,132,.45), 0 0 24px rgba(186,159,132,.25)",
    };

    // Classe “panneau” (bordure, coins arrondis, fond, blur, ombres)
    const clsPanel =
      "border border-[#5b2a17] rounded-2xl p-5 bg-[rgba(241,222,189,0.85)] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(186,159,132,0.25),0_10px_20px_rgba(159,124,94,0.25)]";
    
    const btnCls = (on) =>
      `px-4 py-3 rounded-lg border w-full ${
        on
          ? "border-[#5b2a17] bg-[#80301d] text-[#f1debd] shadow-[0_4px_12px_rgba(128,48,29,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
          : "border-[#ba9f84] text-[#5b2a17] bg-[#e8ceaa] hover:bg-[#d8bd9b]"
      } text-lg md:text-xl`;
    
    // Cellules de tableau (header & data)
    const th =
      "py-2 px-3 border-b border-[#9f7c5e] bg-[#80301d] text-center text-lg text-[#f1debd]";
    const td =
      "py-2 px-3 border-b border-[#9f7c5e] text-center align-middle text-base";
    
    // Variantes alignées à gauche (on part des classes ci-dessus)
    const thL = th.replace("text-center", "text-left");
    const tdL = td.replace("text-center", "text-left");
    
    /**
     * Formatte un entier pour l’affichage (séparateurs de milliers).
     * Renvoie "0" si n’est pas un nombre fini.
     */
    const fmtInt = (n) =>
      Number.isFinite(n) ? Math.floor(n).toLocaleString() : "0";
    
    /**
     * parseNumber
     *  - Accepte des strings avec espaces, points ou virgules : "12 500", "12,500", "12.500"
     *  - Nettoie tout ce qui n’est pas chiffre/point/virgule
     *  - Utilise la virgule comme décimale si présente
     *  - Renvoie 0 si non convertible
     */
    const parseNumber = (x) => {
      // Si ce n’est pas une string, tenter Number(x) (0 par défaut)
      if (typeof x !== "string") return Number(x) || 0;
    
      // Nettoyage: garder seulement chiffres, points, virgules
      const cleaned = x.replace(/[^0-9.,]/g, "");
    
      // Interpréter la virgule comme séparateur décimal
      const normalized = cleaned.replace(",", ".");
    
      // Conversion → nombre
      const n = Number(normalized);
    
      // Si convertible, renvoyer le nombre ; sinon 0
      return Number.isFinite(n) ? n : 0;
    };

// ==============================================================
// ---------------- Données compactes → objets ------------------
// ==============================================================


// -------------------- SG (tier|type|health|ldr) --------------------
    
    const SG_CSV = [
      "G2|ranged|270|1",   "G2|melee|270|1",   "G2|mounted|540|2",
      "G3|ranged|480|1",   "G3|melee|480|1",   "G3|mounted|960|2",
      "G4|ranged|870|1",   "G4|melee|870|1",   "G4|mounted|1740|2",
      "G5|ranged|1560|1",  "G5|melee|1560|1",  "G5|mounted|3150|2",  "G5|flying|30000|20",
      "G6|ranged|2820|1",  "G6|melee|2820|1",  "G6|mounted|5700|2",  "G6|flying|57000|20",
      "G7|ranged|5100|1",  "G7|melee|5100|1",  "G7|mounted|10200|2", "G7|flying|102000|20",
      "G8|ranged|9180|1",  "G8|melee|9180|1",  "G8|mounted|18360|2", "G8|flying|183600|20",
      "G9|ranged|16530|1", "G9|melee|16530|1", "G9|mounted|33060|2", "G9|flying|330600|20",
    
    
      "S3|melee|480|1",    "S3|scout|240|5",
      "S4|melee|870|1",    "S4|scout|450|5",
      "S5|ranged|1560|1",  "S5|melee|1560|1",  "S5|mounted|3150|2",  "S5|flying|1560|1",
      "S6|ranged|2820|1",  "S6|melee|2820|1",  "S6|mounted|5700|2",  "S6|flying|2820|1",
      "S7|ranged|5100|1",  "S7|melee|5100|1",  "S7|mounted|10200|2", "S7|flying|5100|1",
      "S8|ranged|9180|1",  "S8|melee|9180|1",  "S8|mounted|18360|2", "S8|flying|183600|20",
      "S9|ranged|16530|1", "S9|melee|16530|1", "S9|mounted|33060|2", "S9|flying|330600|20",
      
    ].join(";");

    // Parse → DATA[tier] = [{ type, health, ldr }, ...]
    const DATA = {};
    SG_CSV.split(";")
      .filter(Boolean)
      .forEach((r) => {
        const [tier, type, h, l] = r.split("|");
        (DATA[tier] ||= []).push({ type, health: +h, ldr: +l });
      });
    
    // Listes de tiers
    const GUARDSMEN  = ["G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];
    const SPECIALISTS = ["S3", "S4", "S5", "S6", "S7", "S8", "S9"];
    /**
     * ORDER : S/G triés par leur “HP minimal par tier”
     * - on calcule mh(tier) = min(HP des unités du tier)
     * - tri croissant par ce min ; égalité → tri alphabétique
     */
    const ORDER = [...GUARDSMEN, ...SPECIALISTS].sort((a, b) => {
      const mh = (k) => Math.min(...DATA[k].map((u) => u.health));
      const ha = mh(a);
      const hb = mh(b);
      return ha === hb ? a.localeCompare(b) : ha - hb;
    });


    // -------------------- Strengths SG (tier|type|strength) --------------------
    
    const SG_STR_CSV = [
      // Guardsmen
      "G5|ranged|520",  "G5|melee|520",  "G5|mounted|1050", "G5|flying|10000",
      "G6|ranged|940",  "G6|melee|940",  "G6|mounted|1900", "G6|flying|19000",
      "G7|ranged|1700", "G7|melee|1700", "G7|mounted|3400", "G7|flying|34000",
      "G8|ranged|3060", "G8|melee|3060", "G8|mounted|6120", "G8|flying|61200",
      "G9|ranged|5150", "G9|melee|5150", "G9|mounted|11020","G9|flying|110200",
    
      // Specialists
      "S5|ranged|520",  "S5|melee|520",  "S5|mounted|1050", "S5|flying|520",
      "S6|ranged|940",  "S6|melee|940",  "S6|mounted|1900", "S6|flying|940",
      "S7|ranged|1700", "S7|melee|1700", "S7|mounted|3400", "S7|flying|1700",
      "S8|ranged|3060", "S8|melee|3060", "S8|mounted|6120", "S8|flying|61200",
      "S9|ranged|5510", "S9|melee|5510", "S9|mounted|11020","S9|flying|110200",
    ].join(";");
    
    // Parse → SG_STRENGTH[tier][type] = strength
    const SG_STRENGTH = {};
    SG_STR_CSV.split(";")
      .filter(Boolean)
      .forEach((r) => {
        const [tier, type, s] = r.split("|");
        (SG_STRENGTH[tier] ||= {});
        SG_STRENGTH[tier][type] = +s;
      });
    
    // Helper d’accès
    const getSGStrength = (tier, type) => SG_STRENGTH[tier]?.[type] || 0;

// MONSTRES (group|type|strength|health|name)
    const MON_CSV = [
      "M3|ranged|1800|5700|Water Elemental",
      "M3|mounted|3900|11700|Battle Boar",
      "M3|flying|4500|13500|Emerald Dragon",
      "M3|flying|5200|15600|Stone Gargoyle",
    
      "M4|melee|13000|39000|Many-Armed",
      "M4|flying|17000|51000|Iced Phoenix",
      "M4|ranged|15000|45000|Gordon Medusa",
      "M4|ranged|15000|45000|Magic Dragon",
    
      "M5|melee|48000|144000|Ettin",
      "M5|mounted|42000|126000|Desert Vanquisher",
      "M5|mounted|44000|132000|Falming Centaur",
      "M5|flying|46000|138000|Fearsome Manticore",
    
      "M6|melee|120000|360000|Crystal Dragon",
      "M6|melee|130000|390000|Ruby Golem",
      "M6|melee|130000|390000|Jungle Destroyer",
      "M6|mounted|110000|310000|Troll Rider",
    
      "M7|melee|310000|930000|Wind Lord",
      "M7|ranged|290000|870000|Destructive Colossus",
      "M7|mounted|280000|840000|Ancient Terror",
      "M7|flying|300000|900000|Black Dragon",
    
      "M8|melee|670000|2010000|Kraken I",
      "M8|ranged|640000|1920000|Trickster I",
      "M8|mounted|650000|1950000|Devastator I",
      "M8|flying|660000|1980000|Fire Phoenix I",
    
      "M9|melee|1210000|3630000|Kraken II",
      "M9|ranged|1150000|3450000|Trickster II",
      "M9|mounted|1170000|3510000|Devastator II",
      "M9|flying|1190000|3570000|Fire Phoenix II",
    ].join(";");
    
    const MONSTERS = {};
    MON_CSV.split(";")
      .filter(Boolean)
      .forEach((r) => {
        const [g, t, s, h, n] = r.split("|");
        (MONSTERS[g] ||= []);
        MONSTERS[g].push({
          type: t,
          strength: +s,
          health: +h,
          name: n,
        });
      });
    
    const MON_GROUPS = Object.keys(MONSTERS);
    const ORDER_MONSTERS_UI = ["M3", "M4", "M5", "M6", "M7", "M8", "M9"];
    
    // Fonctions d'aide pour le tri
    const mS = (g) => Math.max(...MONSTERS[g].map((u) => u.strength));
    const mH = (g) => Math.max(...MONSTERS[g].map((u) => u.health));
    
    const ORDER_MONSTERS = [...MON_GROUPS].sort((a, b) =>
      mS(a) === mS(b) ? mH(b) - mH(a) : mS(b) - mS(a)
    );
    
    // 🔹 Monster icon URLs (GitHub raw links)
    const MONSTER_ICONS = {
      "Water Elemental":
        "https://raw.githubusercontent.com/AzazelLoki/Loki_tb-icons/refs/heads/main/M3-WaterElemental.png",
      "Battle Boar":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M3-Battle%20Boar.png?raw=true",
      "Emerald Dragon":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M3-Emerald%20Dragon.png?raw=true",
      "Stone Gargoyle":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M3-Stone%20Gargoyle.png?raw=true",
      "Gordon Medusa":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M4-Gorgon%20Medusa.png?raw=true",
      "Iced Phoenix":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M4-Ice%20Phoenix.png?raw=true",
      "Magic Dragon":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M4-Magic%20Dragon.png?raw=true",
      "Many-Armed":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M4-Many-Armed%20Guardian.png?raw=true",
      "Desert Vanquisher":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M5-Desert%20Vanquisher.png?raw=true",
      "Ettin":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M5-Ettin.png?raw=true",
      "Fearsome Manticore":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M5-Fearsome%20Manticore.png?raw=true",
      "Falming Centaur":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M5-Flaming%20Centaur.png?raw=true",
      "Crystal Dragon":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M6-Crystal%20Dragon.png?raw=true",
      "Jungle Destroyer":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M6-Jungle%20Destroyer.png?raw=true",
      "Ruby Golem":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M6-Ruby%20Golem.png?raw=true",
      "Troll Rider":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M6-Troll%20Rider.png?raw=true",
      "Ancient Terror":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M7-Ancient%20Terror.png?raw=true",
      "Black Dragon":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M7-Black%20Dragon.png?raw=true",
      "Destructive Colossus":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M7-Destructive%20Colosus.png?raw=true",
      "Wind Lord":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M7-Wind%20Lord.png?raw=true",
      "Devastator I":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M8-Devastator%20I.png?raw=true",
      "Fire Phoenix I":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M8-Fire%20Phoenix%20I.png?raw=true",
      "Kraken I":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M8-Kraken%20I.png?raw=true",
      "Trickster I":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/M8-Trickster%20I.png?raw=true",
      "Leadership":
        "https://github.com/AzazelLoki/Loki_tb-icons/blob/main/Leadership.png?raw=true",
    };

// MERCENAIRES (type|strength|health|ldr)
    const MERC_CSV = [
      // — Mercenaires “monsters”
      "mercs-monsters-melee|410000|1230000|11",
      "mercs-monsters-flying|690000|2070000|6",
      "mercs-monsters-mounted|470000|1410000|9",
      "mercs-monsters-ranged|440000|1320000|10",
    
      // — Mercenaires “specialists”
      "mercs-specialists-melee|11000|33000|409",
      "mercs-specialists-flying|220000|660000|20",
      "mercs-specialists-mounted|22000|66000|204",
      "mercs-specialists-ranged|11000|33000|409",
    
      // — Mercenaires “guards”
      "merc-guards-melee|11000|33000|409",
      "merc-guards-flying|220000|660000|20",
      "merc-guards-mounted|22000|66000|204",
      "merc-guards-ranged|11000|33000|409",
    
      // — Spéciaux
      "merc-cannon|55000|330000|23",
      "merc-hunter|25000|75000|22",
    ].join(";");
    
    const MERCS = MERC_CSV.split(";")
      .filter(Boolean)
      .map((r) => {
        const [t, s, h, l] = r.split("|");
        return { type: t, strength: +s, health: +h, ldr: +l };
      });

// -------------------- Audio (SFX) --------------------
function useTBSfx() {
  const ref = useRef(null);

  // AudioContext paresseux (avec fallback Safari via webkitAudioContext)
  const ctx = () =>
    (ref.current ||= new (
      (window).AudioContext || (window).webkitAudioContext
    )());

  // Petit bip. up=true => son "positif", sinon "négatif"
  const blip = (up) => {
    try {
      const c = ctx();
      const now = c.currentTime;

      // Enveloppe (gain)
      const out = c.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      out.connect(c.destination);

      // Oscillateur
      const o = c.createOscillator();
      o.type = up ? "sine" : "triangle";
      o.frequency.setValueAtTime(up ? 660 : 220, now);
      o.frequency.exponentialRampToValueAtTime(up ? 880 : 120, now + 0.12);

      // Chaînage + lecture
      o.connect(out);
      o.start(now);
      o.stop(now + 0.22);
    } catch {
      // Silencieusement ignorer (bloqué par l'autoplay, navigateur sans audio, etc.)
    }
  };

  return {
    select: () => blip(true),
    deselect: () => blip(false),
  };
}

// -------------------- Calcs --------------------
    const CONSTS = { m: .988, a: .96, r: .98, s: .96, b: 1.06 };
    
    const computeAnchors = (L, SR) => {
      if (!L || !SR) {
        return { BASE: 0, ANCHOR: 0, Imerc: 0, Im6: 0, Im5: 0, Im4: 0, Icannon: 0 };
      }
    
      const BASE   = (L * CONSTS.m) / SR;
      const ANCHOR = BASE * CONSTS.a;
      const Imerc  = ANCHOR * CONSTS.r;
    
      return {
        BASE,
        ANCHOR,
        Imerc,
        Im6: Imerc * CONSTS.s,
        Im5: Imerc * CONSTS.s ** 2,
        Im4: Imerc * CONSTS.s ** 3,
        Icannon: BASE * CONSTS.b,
      };
    };
    
    const computeSG = (leadership, selected, typePicks) => {
      const chosen = ORDER
        .filter(k => selected[k])
        .flatMap(level => {
          const rows  = DATA[level];
          const picks = typePicks?.[level];
          const flt   = picks?.size ? rows.filter(u => picks.has(u.type)) : rows;
          return flt.map(u => ({ level, ...u }));
        });
    
      if (!chosen.length || leadership <= 0) {
        return { rows: [], used: 0, leftover: leadership, T: 0, SR: 0 };
      }
    
      const SR = chosen.reduce((a, u) => a + u.ldr / u.health, 0);
      const T  = Math.floor(leadership / SR);
    
      const rows = chosen.map((u, i) => {
        const troops       = Math.floor(Math.max(T - i, 0) / u.health);
        const ldrUsed      = troops * u.ldr;
        const unitStrength = getSGStrength(u.level, u.type);
    
        return {
          level: u.level,
          type: u.type,
          troops,
          totalHealth: troops * u.health,
          ldrUsed,
          unitStrength,
          totalStrength: troops * unitStrength,
        };
      });
    
      const used = rows.reduce((a, r) => a + r.ldrUsed, 0);
    
      return { rows, used, leftover: leadership - used, T, SR };
    };
    
    const nextLowerGroupOf = (full) => {
      if (!full.length) return null;
      const i = ORDER_MONSTERS.indexOf(full[full.length - 1]);
      return (i < 0 || i === ORDER_MONSTERS.length - 1) ? null : ORDER_MONSTERS[i + 1];
    };


// ==================== Buttons ====================
function Buttons({
  title,
  label,
  options = [],
  onClick,
  blocked,
  onBlocked,
  leadingBlank = 0,
  compact,
}) {
  // tailles (évite les répétitions)
  const sizeText = compact ? "text-sm md:text-base" : "text-base md:text-xl";
  const sizePad  = compact ? "py-2" : "";
  const sizeCls  = `${sizePad} ${sizeText}`;

  const handleClick = (ev, key) => {
    if (blocked) { onBlocked?.(ev); return; }
    onClick?.(key);
  };

  return (
    <div className="mb-3">
      {title && <h3 className="mb-2" style={glow}>{title}</h3>}
      {label && <div className="text-sm opacity-80 mb-1" style={glow}>{label}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* blancs en tête */}
        {Array.from({ length: leadingBlank }).map((_, i) => (
          <button
            key={`blank-${i}`}
            type="button"
            aria-hidden
            tabIndex={-1}
            className={`${btnCls(false)} pointer-events-none ${sizeCls}`}
          />
        ))}

        {/* options */}
        {options.map(({ key, on, icon, text }) => {
          const btnStateCls = `${btnCls(!!on)} ${sizeCls} ${
            blocked ? "opacity-60 cursor-not-allowed" : ""
          }`;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={!!on}
              aria-disabled={blocked || undefined}
              className={btnStateCls}
              onClick={(ev) => handleClick(ev, key)}
            >
              <div className={`flex flex-col items-center justify-center gap-2 ${sizeText}`}>
                {icon && (
                  <img
                    src={icon}
                    alt=""
                    className="tb-icon w-[96px] h-[96px] rounded-xl object-contain shrink-0 pointer-events-none select-none"
                  />
                )}
                <span
                  className={`${sizeText} whitespace-pre-line leading-tight text-center`}
                  style={glow}
                >
                  {text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ==================== SimpleTable ====================
function SimpleTable({ headers = [], rows = [], left, large }) {
  const tableSize = large ? "text-lg md:text-2xl" : "text-base md:text-lg";
  const formatCell = (v) => (Number.isFinite(v) ? Math.floor(v).toLocaleString() : v);

  return (
    <table className={`w-full ${tableSize} border border-[#9f7c5e]`}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={left && i === 0 ? thL : th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-[#f1debd]">
            {r.map((c, j) => (
              <td key={j} className={left && j === 0 ? tdL : td}>
                {formatCell(c)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// -------------------- ToolTip --------------------
function useIsTouch(){
  const [isTouch, setIsTouch] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.("(hover: none)");
    const hasTouch = "ontouchstart" in window || (mq && mq.matches);
    setIsTouch(!!hasTouch);
    const onChange = (e) => setIsTouch(!!e.matches);
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);
  return isTouch;
}

function HoverImageHelp({ src, alt = "Help" }) {
  const isTouch = useIsTouch();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Fermer en cliquant/touchant hors du popover (mobile & desktop)
  React.useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc, { passive: true });
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <div
      ref={ref}
      className="relative inline-block align-middle ml-2"
      // Hover seulement sur desktop
      onMouseEnter={!isTouch ? () => setOpen(true) : undefined}
      onMouseLeave={!isTouch ? () => setOpen(false) : undefined}
    >
      <button
        type="button"
        aria-label="Help"
        aria-expanded={open}
        className="tb-help"
        // Sur mobile: toggle; sur desktop: click force l'ouverture
        onClick={() => setOpen(v => (isTouch ? !v : true))}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        style={{ touchAction: "manipulation" }}  // réduit les latences sur mobile
      >
        ?
      </button>

      {open && (
        <div
          className="tb-pop"
          role="tooltip"
          // Ne pas propager le pointerdown vers le document (sinon fermeture immédiate)
          onPointerDown={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            className="block rounded-xl shadow w-auto h-auto max-w-[92vw] sm:max-w-md"
            // Fallback auto pour les URLs GitHub -> raw.githubusercontent.com
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.tried) return;
              el.dataset.tried = "1";
              el.src = el.src
                .replace("github.com/", "raw.githubusercontent.com/")
                .replace("/blob/", "/")
                .replace("?raw=true", "");
            }}
          />
        </div>
      )}
    </div>
  );
}

// -------------------- App --------------------
export default function TBStackCalculator(){
  const sfx=useTBSfx();
  const [ldrInput,setLdrInput]=useState(""); const L=useMemo(()=>parseNumber(ldrInput),[ldrInput]);
  const [selected,setSelected]=useState(Object.fromEntries([...GUARDSMEN,...SPECIALISTS].map(k=>[k,false])));
  const [typePicks,setTypePicks]=useState({});
  const [userIcons,setUserIcons]=useState(()=>{ try{return JSON.parse(localStorage.getItem('tb_user_icons_v1')||'{}')}catch{return {}} });
  const setIcon=(key,dataUrl)=>{ const next={...userIcons,[key]:dataUrl}; setUserIcons(next); try{ localStorage.setItem('tb_user_icons_v1', JSON.stringify(next)); }catch{} };
  const iconFor=(level,type)=> userIcons[`${level}|${type}`] || null;
  const [showIcons,setShowIcons]=useState(false);
  const toggleType=(tier,type)=> setTypePicks(p=>{ const cur=new Set(p[tier]||[]); cur.has(type)?(cur.delete(type),sfx.deselect()):(cur.add(type),sfx.select()); return {...p,[tier]:cur}; });
  const picksSigSG=useMemo(()=>Object.entries(typePicks).map(([k,s])=>k+":"+Array.from(s).sort().join('.')).sort().join('|'),[typePicks]);
  const sg=useMemo(()=>computeSG(L,selected,typePicks),[L,selected,picksSigSG]);
  const sgRowsSorted=useMemo(()=>[...sg.rows].sort((a,b)=> b.unitStrength-a.unitStrength || b.totalStrength-a.totalStrength || String(b.level).localeCompare(String(a.level)) || String(b.type).localeCompare(String(a.type))),[sg.rows]);
  const sgBuild=useMemo(()=>{
    const make=(prefix)=>{
      const rows=sg.rows.filter(r=> String(r.level).startsWith(prefix) && r.troops>0);
      if(!rows.length) return {levels:[], byLevel:{}};
      const orderArr = prefix==='G'? GUARDSMEN : SPECIALISTS;
      const byLevel = {};
      rows.forEach(r=>{ (byLevel[r.level] ||= []).push(r); });
      const present = orderArr.filter(lvl => (byLevel[lvl]?.length));
      const top = present[present.length-1];
      const rest = present.filter(l=>l!==top).sort((a,b)=> orderArr.indexOf(a)-orderArr.indexOf(b));
      const levels = [top, ...rest];
      levels.forEach(lvl => byLevel[lvl].sort((a,b)=> a.unitStrength - b.unitStrength || a.type.localeCompare(b.type)));
      return {levels, byLevel};
    };
    return { G: make('G'), S: make('S') };
  }, [sg.rows]);
  const [monsterFull,setMonsterFull]=useState(Object.fromEntries(MON_GROUPS.map(k=>[k,false])));
  const fullSelectedOrdered=ORDER_MONSTERS.filter(g=>monsterFull[g]);
  const partialGroup=nextLowerGroupOf(fullSelectedOrdered);
  const [entryPicks,setEntryPicks]=useState({});
  const toggleEntry=(group,idx)=> setEntryPicks(p=>{ const cur=new Set(p[group]||[]); cur.has(idx)?(cur.delete(idx),sfx.deselect()):(cur.add(idx),sfx.select()); return {...p,[group]:cur}; });
  const picksSignature=useMemo(()=>Object.entries(entryPicks).map(([g,s])=>g+":"+Array.from(s).sort().join('.')).sort().join('|'),[entryPicks]);
  const anchors=useMemo(()=>computeAnchors(L,sg.SR),[L,sg.SR]);
  const hasLeadership=L>0;
  const [bubble,setBubble]=useState(null); const [toast,setToast]=useState(null);
  useEffect(()=>{ if(!bubble) return; const t=setTimeout(()=>setBubble(null),1800); return ()=>clearTimeout(t); },[bubble]);
const blocked = (ev) => {
  if (hasLeadership) return;

  const r = ev.currentTarget.getBoundingClientRect();
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const M = 16; // marge de sécurité des bords

  // Centre horizontal + clamp dans l’écran
  let x = r.left + r.width / 2;
  x = Math.min(Math.max(x, M), vw - M);

  // On préfère au-dessus ; si trop près du haut, on bascule en dessous
  const flip = r.top < 64; // seuil (px)
  const y = flip ? (r.bottom + 12) : r.top;

  setBubble({
    x,
    y,
    pos: flip ? 'bottom' : 'top',
    text: 'Enter a value for TOTAL LEADERSHIP first'
  });
  sfx.deselect();
};

const monstersRows=useMemo(()=>{ 
  if(!anchors.Imerc) return []; 
  const out=[]; 
  const apply=(group,I)=>{ 
    if(!group) return; 
    const picks=entryPicks[group]; 
    const idxs=picks?.size? Array.from(picks): MONSTERS[group].map((_,i)=>i); 
    idxs.forEach(i=>{ 
      const u=MONSTERS[group][i]; 
      const n=Math.floor((I||0)/u.health); 
      out.push({
        group,
        type:u.type,
        name:u.name,
        count:n,
        totalHealth:n*u.health,
        unitStrength:u.strength,
        unitHealth:u.health,
        totalStrength:n*u.strength
      }); 
    }); 
  };
  fullSelectedOrdered.forEach((g,i)=> apply(g, anchors.Imerc * CONSTS.s ** (1+i)) );
  return out; 
},[anchors,fullSelectedOrdered.join(','),picksSignature,entryPicks]);

// 🔽 AJOUT : tri décroissant par santé (HP unitaire), puis HP total, puis nom
const monstersRowsSorted = useMemo(
  () => [...monstersRows].sort(
    (a,b) =>
      b.unitHealth - a.unitHealth ||     // 1) HP unitaire décroissant
      b.totalHealth - a.totalHealth ||   // 2) puis HP total décroissant
      a.name.localeCompare(b.name)       // 3) puis nom (stabilité)
  ),
  [monstersRows]
);
  const mercRows=useMemo(()=> !anchors.Imerc? []: MERCS.map(u=>{ const cannon=u.type==="merc-cannon"||u.type==="merc-hunter"; const I=cannon? anchors.Icannon: anchors.Imerc; const n=Math.floor(I/u.health); return {...u,count:n,totalHealth:n*u.health,totalStrength:n*u.strength}; }),[anchors]);
  const hasMercResults=useMemo(()=> mercRows.some(r=>r.count>0),[mercRows]);
  const mercRowsNZ=useMemo(()=> mercRows.filter(r=>r.count>0),[mercRows]);
  const srTerms=useMemo(()=> ORDER.filter(k=>selected[k]).flatMap(level=>{ const rows=DATA[level]; const picks=typePicks[level]; const flt=picks?.size? rows.filter(u=>picks.has(u.type)):rows; return flt.map(u=>({level,...u,term:u.ldr/u.health})); }),[selected,picksSigSG]);
  const sgTotals=useMemo(()=>({ troops: sg.rows.reduce((a,r)=>a+r.troops,0), hp: sg.rows.reduce((a,r)=>a+r.totalHealth,0), str: sg.rows.reduce((a,r)=>a+r.totalStrength,0) }),[sg.rows]);
  const monstersTotals=useMemo(()=>({ count: monstersRows.reduce((a,r)=>a+r.count,0), hp: monstersRows.reduce((a,r)=>a+r.totalHealth,0), str: monstersRows.reduce((a,r)=>a+r.totalStrength,0) }),[monstersRows]);
  const mercTotals=useMemo(()=>({ count: mercRowsNZ.reduce((a,r)=>a+r.count,0), hp: mercRowsNZ.reduce((a,r)=>a+r.totalHealth,0), str: mercRowsNZ.reduce((a,r)=>a+r.totalStrength,0) }),[mercRowsNZ]);
  const [showTypePicks,setShowTypePicks]=useState(false);
  const [showEntryPicks,setShowEntryPicks]=useState(false);
  const [showSGBuild,setShowSGBuild]=useState(false);
  const [showCalcs,setShowCalcs]=useState(false);
  // -------------------- Tests rapides (ne modifient rien à l'UI) --------------------
  useEffect(()=>{
    const A=computeAnchors(100,.5); console.assert(Math.abs(A.BASE-197.6)<.3,'BASE math');
    const p=parseNumber('12\u00A0500'); console.assert(p===12500,'NBSP parse');
    const sgTest=computeSG(50000,{G5:true},{}) ; console.assert(sgTest && typeof sgTest.SR==='number','computeSG returns');
  },[]);
  const reset=()=>{ setLdrInput(""); setSelected(Object.fromEntries([...GUARDSMEN,...SPECIALISTS].map(k=>[k,false]))); setTypePicks({}); setMonsterFull(Object.fromEntries(MON_GROUPS.map(k=>[k,false]))); setEntryPicks({}); setShowTypePicks(false); setShowEntryPicks(false); setShowCalcs(false); setBubble(null); sfx.deselect(); setToast('Reset done'); setTimeout(()=>setToast(null),1600); try{ document.getElementById('ldr-input')?.focus(); }catch{} window.scrollTo({top:0,behavior:'smooth'}); };
  return (
    <div className="tb-root min-h-screen bg-[#e8ceaa] text-[#5b2a17] relative overflow-x-hidden">
      <style>{`
/* =========================
   1) Animations
   ========================= */
.animate-glow { animation: glowPulse 1.15s ease-in-out infinite; }
@keyframes glowPulse {
  0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
  50% { box-shadow: 0 0 18px rgba(186,159,132,.9); }
  100% { box-shadow: 0 0 0 rgba(0,0,0,0); }
}
.animate-blink { animation: blink 1.15s steps(2,end) infinite; }
@keyframes blink { 50% { opacity: .3; } }

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes spark {
  0%,100% { text-shadow: 0 0 8px rgba(255,215,128,.35), 0 0 18px rgba(255,215,128,.25); }
  50% { text-shadow: 0 0 18px rgba(255,215,128,.75), 0 0 36px rgba(255,215,128,.55); }
}

/* =========================
   2) Boutons / Contrôles
   ========================= */
.tb-close {
  background:#1f4318; border:2px solid #4d7139; color:#f1debd;
  border-radius:.5rem; width:2.25rem; height:2.25rem;
  line-height:2rem; text-align:center; font-size:1.25rem;
}
.btn-back {
  background:#1f4318; border:2px solid #4d7139; color:#f1debd;
  padding:.75rem 1.25rem; border-radius:.75rem; font-weight:600; letter-spacing:.02em;
}
.tb-chip {
  background:linear-gradient(90deg,#5b2a17 0%,#6b2417 20%,#80301d 50%,#6b2417 80%,#5b2a17 100%);
  border:1px solid #5b2a17; border-radius:.75rem; padding:.35rem .6rem;
  box-shadow:0 6px 18px rgba(128,48,29,.35), inset 0 1px 0 rgba(255,255,255,.12);
}

/* =========================
   3) Switch / Toggle
   ========================= */
.tb-switch { display:inline-flex; align-items:center; gap:.5rem; user-select:none; }
.tb-toggle {
  position:relative; width:48px; height:28px; border-radius:9999px;
  background:#9f7c5e; border:2px solid #4d7139; transition:background .2s ease;
}
.tb-toggle-knob {
  position:absolute; top:2px; left:2px; width:22px; height:22px;
  border-radius:9999px; background:#f1debd; transition:transform .2s ease;
}
.tb-toggle.on { background:#1f4318; }
.tb-toggle.on .tb-toggle-knob { transform:translateX(20px); }

/* =========================
   4) Panneaux coulissants
   ========================= */
.tb-slide {
  overflow:hidden; max-height:0; opacity:0;
  transition:max-height .35s ease, opacity .25s ease;
}
.tb-slide.open {
  max-height:9999px; opacity:1; overflow:visible; /* correction: pas de coupe à 1000px */
}

/* =========================
   5) Effets texte or / scintillant
   ========================= */
.tb-gold{
  background-image:linear-gradient(90deg,#caa85e,#f5e4a3,#d1a640,#f0d38f,#caa85e);
  background-size:200% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent;
}
.tb-sparkle{ animation:shimmer 2.2s linear infinite, spark 1.6s ease-in-out infinite; }

/* =========================
   6) Bulles / Toast
   ========================= */
.tb-bubble {
  position:fixed; z-index:90;
  transform:translate(-50%, calc(-100% - 12px)); pointer-events:none;
}
.tb-bubble-inner {
  background:#f1debd; border:1px solid #4d7139; color:#5b2a17;
  padding:.5rem .75rem; border-radius:.5rem; font-weight:700;
  box-shadow:0 8px 18px rgba(159,124,94,.35), inset 0 1px 0 rgba(255,255,255,.25);
}
.tb-bubble-arrow {
  position:absolute; bottom:-6px; left:50%; width:12px; height:12px; background:#f1debd;
  border-left:1px solid #4d7139; border-bottom:1px solid #4d7139;
  transform:translateX(-50%) rotate(45deg);
}
.tb-toast { position:fixed; left:1rem; bottom:1rem; z-index:100; }
.tb-toast-inner {
  background:#1f4318; color:#f1debd; border:1px solid #4d7139;
  padding:.5rem .75rem; border-radius:.5rem; font-weight:700;
  box-shadow:0 8px 18px rgba(31,67,24,.35), inset 0 1px 0 rgba(255,255,255,.15);
}
/* Empêche les bulles trop larges de dépasser */
.tb-bubble-inner { max-width: min(92vw, 340px); }

/* Quand on doit l'afficher EN DESSOUS du bouton */
.tb-bubble--bottom {
  transform: translate(-50%, 12px); /* au lieu de -100% (au-dessus) */
}

/* Flèche orientée pour la version "bottom" */
.tb-bubble-arrow--bottom {
  top: -6px;
  bottom: auto;
  border-left: 1px solid #4d7139;
  border-top: 1px solid #4d7139;
  border-bottom: none;
}

/* =========================
   7) Root / Scroll
   ========================= */
.tb-root { scrollbar-width:none; overscroll-behavior:contain; }
.tb-root::-webkit-scrollbar { width:0; height:0; }

/* =========================
   8) Icônes / Images
   ========================= */
.tb-icon, .tb-icon-sm {
  image-rendering:-webkit-optimize-contrast; image-rendering:crisp-edges;
  backface-visibility:hidden; transform:translateZ(0);
}
.tb-icon { filter:drop-shadow(0 1px 1px rgba(0,0,0,.15)); }
.tb-icon-sm { filter:drop-shadow(0 1px 1px rgba(0,0,0,.12)); }

/* =========================
   9) Aide (Section 2)
   ========================= */
.tb-help{
  width:28px; height:28px; border-radius:9999px;
  background:#1f4318; border:2px solid #4d7139; color:#f1debd;
  font-weight:700; line-height:24px; text-align:center;
  box-shadow:0 1px 4px rgba(0,0,0,.2);
}
.tb-help:hover{ filter:brightness(1.05); }
.tb-pop{
  position:absolute; top:110%; left:50%; transform:translateX(-50%); z-index:60;
  background:#f1debd; border:1px solid #9f7c5e; padding:.5rem;
  border-radius:.75rem; box-shadow:0 6px 18px rgba(0,0,0,.15);
  max-width:min(92vw, 540px);  /* prevent horizontal overflow */
}

/* Mobile: pin as a centered fixed panel with scrolling if tall */
@media (max-width: 640px){
  .tb-pop{
    position:fixed; top:12vh; left:50%; transform:translateX(-50%);
    max-width:92vw; max-height:76vh; overflow:auto;
  }
}
`}</style>

{bubble && (
  <div
    className={`tb-bubble ${bubble.pos === 'bottom' ? 'tb-bubble--bottom' : ''}`}
    style={{ top: bubble.y, left: bubble.x }}
    role="alert"
    aria-live="polite"
  >
    <div className="tb-bubble-inner">{bubble.text}</div>
    <span className={`tb-bubble-arrow ${bubble.pos === 'bottom' ? 'tb-bubble-arrow--bottom' : ''}`} />
  </div>
)}

      <div className="max-w-6xl mx-auto space-y-6 relative">
        <header className="fixed top-0 left-0 right-0 z-[120]">
          <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(90deg,#5b2a17_0%,#6b2417_20%,#80301d_50%,#6b2417_80%,#5b2a17_100%)] border-t border-[#5b2a17] shadow-[0_6px_20px_rgba(128,48,29,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl tracking-wide text-[#f1debd]" style={glow}>TB - STACK CALCULATOR</h1>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#1f4318] border border-[#4d7139] text-[#f1debd] text-sm font-semibold leading-none">V0,7</span>
              </div>
              <button className="tb-close" aria-label="Reset all" title="Reset all" onClick={reset}>×</button>
            </div>
            <div className="h-[3px] bg-[linear-gradient(90deg,#caa85e,#f5e4a3,#d1a640,#f0d38f,#caa85e)] shadow-[0_2px_8px_rgba(208,173,96,0.5)]"></div>
          </div>
        </header>
        <div className="h-[66px]" aria-hidden="true"></div>
        {/* Leadership */}
        <div className="px-2">
          <div className="mb-4 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
  <span
    className={
      L <= 0
        ? `uppercase ${!ldrInput.trim() ? "animate-blink" : ""} text-sm sm:text-base md:text-lg whitespace-nowrap`
        : "text-lg"
    }
    style={glow}
  >
    {L <= 0 ? "ENTER YOUR TOTAL LEADERSHIP BELOW." : "TOTAL LEADERSHIP"}
  </span>

  {/* utilise ta map d’icônes */}
  {MONSTER_ICONS["Leadership"] && (
    <HoverImageHelp
      src={MONSTER_ICONS["Leadership"]}
      alt="Leadership"
    />
  )}
</div>

<input
  id="ldr-input"
  className={`bg-[#f1debd] text-[#5b2a17] border rounded px-5 py-4 w-full md:w-[26rem] text-2xl md:text-3xl focus:outline-none ${
    !ldrInput.trim() ? 'border-[#80301d] animate-glow' : 'border-[#9f7c5e]'
  }`}
  placeholder="E.G. 125000"
  value={ldrInput}
  onChange={(e) => setLdrInput(e.target.value)}
  inputMode="numeric"
  onFocus={() => sfx.select()}
/>

{L > 0 && !Object.values(selected).some(Boolean) ? (
  <div className="text-base md:text-lg font-semibold animate-blink" style={glow}>
    ↓ choose tiers below ↓
  </div>
) : null}

</div>
</div>

{/* S/G */}
<section className={`${clsPanel} mx-2`}>
  <h2 className="text-lg mb-3" style={glow}>GUARDSMEN / SPECIALISTS</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Buttons
      title="GUARDSMEN (G2–G9)"
      compact
      options={GUARDSMEN.map(k => ({ key: k, text: k, on: !!selected[k] }))}
      onClick={(k) => setSelected(s => (sfx.select(), { ...s, [k]: !s[k] }))}
      blocked={!hasLeadership}
      onBlocked={blocked}
    />

    <Buttons
      title="SPECIALISTS (S3–S9)"
      leadingBlank={1}
      compact
      options={SPECIALISTS.map(k => ({ key: k, text: k, on: !!selected[k] }))}
      onClick={(k) => setSelected(s => (sfx.select(), { ...s, [k]: !s[k] }))}
      blocked={!hasLeadership}
      onBlocked={blocked}
    />
  </div>

  <div className="mt-4">
    <div className="flex items-center gap-3 mb-2 tb-switch">
      <span style={glow} className="text-sm opacity-80">
        UNIT TYPE PICKS BY TIER (optional)
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showTypePicks}
        className={`tb-toggle ${showTypePicks ? 'on' : ''}`}
        onClick={() => setShowTypePicks(v => !v)}
      >
        <span className="tb-toggle-knob" />
      </button>
    </div>

    <div className={`tb-slide ${showTypePicks ? 'open' : ''}`}>
      {ORDER.filter(t => selected[t]).map(tier => (
        <Buttons
          key={tier}
          label={`${tier} — choose unit types (none = all)`}
          compact
          options={DATA[tier].map(u => ({
            key: `${tier}:${u.type}`,
            text: `${tier} · ${u.type} · HP ${u.health.toLocaleString()}`,
            icon: iconFor(tier, u.type),
            on: !!(typePicks[tier]?.has(u.type)),
          }))}
          onClick={(key) => { const [, type] = key.split(':'); toggleType(tier, type); }}
          blocked={!hasLeadership}
          onBlocked={blocked}
        />
      ))}
    </div>
  </div>
</section>

{/* Monsters selection */}
<section className={`${clsPanel} mx-2`}>
  <h2 className="text-lg mb-3" style={glow}>MONSTERS</h2>

<Buttons
  label="FULL GROUPS (LOW → HIGH)"
  leadingBlank={1}
  compact
  options={ORDER_MONSTERS_UI.map(k => ({ key: k, text: k, on: !!monsterFull[k] }))}
  onClick={(k) => setMonsterFull(s => {
    const nextOn = !s[k];
    nextOn ? sfx.select() : sfx.deselect(); // 🔊
    return { ...s, [k]: nextOn };
  })}
  blocked={!hasLeadership}
  onBlocked={blocked}
/>

  <div className="mt-4">
    <div className="flex items-center gap-3 mb-2 tb-switch">
      <span style={glow} className="text-sm opacity-80">
        ENTRY PICKS BY GROUP (optional)
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showEntryPicks}
        className={`tb-toggle ${showEntryPicks ? 'on' : ''}`}
        onClick={() => setShowEntryPicks(v => !v)}
      >
        <span className="tb-toggle-knob" />
      </button>
    </div>

    <div className={`tb-slide ${showEntryPicks ? 'open' : ''}`}>
      {fullSelectedOrdered.length === 0 ? (
        <div className="opacity-70">Select at least one group above.</div>
      ) : (
        fullSelectedOrdered.map(group => (
          <Buttons
            key={group}
            label={`${group} — choose entries (none = all)`}
            compact
            options={MONSTERS[group].map((u, idx) => ({
              key: `${group}:${idx}`,
              text: `${u.name} ${u.type}`,
              icon: MONSTER_ICONS[u.name],
              on: !!(entryPicks[group]?.has(idx)),
            }))}
            onClick={(key) => { const [g, i] = key.split(':'); toggleEntry(g, Number(i)); }}
            blocked={!hasLeadership}
            onBlocked={blocked}
          />
        ))
      )}
    </div>
  </div>
</section>

{/* Monsters and Mercs side by side */}
<section className={`${clsPanel} mx-2`}>
  <h2 className="text-lg mb-3" style={glow}>MONSTERS & MERCS RESULT</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Mercs à gauche, ordre d'affichage prioritaire */}
    {hasMercResults && (
      <div>
        <h3 className="font-semibold mb-3" style={glow}>Mercs</h3>
        <SimpleTable
          large
          left
          headers={["Type", "Count"]}
          rows={mercRowsNZ.map(m => [m.type, m.count])}
        />
      </div>
    )}

    {/* Monsters à droite */}
    <div>
      <h3 className="font-semibold mb-3" style={glow}>Monsters</h3>

      {monstersRows.length ? (
        <SimpleTable
          left
          headers={["Group", "Name", "Image", "Count"]}
          rows={monstersRowsSorted.map(m => {
            const imgSrc = MONSTER_ICONS[m.name] || null;
            const imgTag = imgSrc ? (
              <img
                src={imgSrc}
                alt={m.name}
                className="tb-icon-sm w-[96px] h-[96px] rounded-lg object-contain mx-auto"
              />
            ) : "—";
            return [m.group, m.name, imgTag, m.count];
          })}
        />
      ) : (
        <div className="opacity-70">No monster rows yet.</div>
      )}
    </div>
  </div>
</section>


        {/* S/G Results */}
        <section className={`${clsPanel} mx-2`}>
          <h2 className="text-lg mb-3" style={glow}>SPECIALISTS / GUARDSMEN RESULT</h2>
          <div className="flex items-center gap-3 mb-2 tb-switch"><span style={glow} className="text-sm opacity-80">S/G Buy view</span><button type="button" role="switch" aria-checked={showSGBuild} className={`tb-toggle ${showSGBuild?'on':''}`} onClick={()=>setShowSGBuild(v=>!v)}><span className="tb-toggle-knob"/></button></div>
          <div className={`tb-slide ${showSGBuild? 'open':''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2" style={glow}>Guardsmen</h3>
                {sgBuild.G.levels.length? sgBuild.G.levels.map(lvl=> (
                  <div key={lvl} className="mb-3">
                    <div className="mb-1 font-semibold" style={glow}>{lvl}</div>
                    <SimpleTable large left headers={["Type","Image","Count"]} rows={sgBuild.G.byLevel[lvl].map(r=>{ const ic=iconFor(r.level,r.type); const img = ic ? (<img src={ic} alt="" className="tb-icon-sm w-20 h-20 md:w-24 md:h-24 rounded-lg object-contain shrink-0 mx-auto"/>) : "—"; return [r.type, img, r.troops]; })} />
                  </div>
                )) : <div className="opacity-70">—</div>}
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={glow}>Specialists</h3>
                {sgBuild.S.levels.length? sgBuild.S.levels.map(lvl=> (
                  <div key={lvl} className="mb-3">
                    <div className="mb-1 font-semibold" style={glow}>{lvl}</div>
                    <SimpleTable large left headers={["Type","Image","Count"]} rows={sgBuild.S.byLevel[lvl].map(r=>{ const ic=iconFor(r.level,r.type); const img = ic ? (<img src={ic} alt="" className="tb-icon-sm w-20 h-20 md:w-24 md:h-24 rounded-lg object-contain shrink-0 mx-auto"/>) : "—"; return [r.type, img, r.troops]; })} />
                  </div>
                )) : <div className="opacity-70">—</div>}
              </div>
            </div>
          </div>
          {!showSGBuild && ( sg.rows.length? (
            <SimpleTable large left headers={["Level","Type","Image","Count"]} rows={sgRowsSorted.map(r=>{ const ic=iconFor(r.level,r.type); const img = ic ? (<img src={ic} alt="" className="tb-icon-sm w-20 h-20 md:w-24 md:h-24 rounded-lg object-contain shrink-0 mx-auto"/>) : "—"; return [r.level, r.type, img, r.troops]; })} />
          ): (
            <div className="opacity-70">No S/G rows yet.</div>
          ))}
        </section>
 
        

        {/* Calcs & Test Log */}
        <section className={`${clsPanel} mx-2`}>
          <div className="flex items-center gap-3 mb-2 tb-switch"><span style={glow} className="text-sm opacity-80">CALCULATIONS & TEST LOG</span><button type="button" role="switch" aria-checked={showCalcs} className={`tb-toggle ${showCalcs?'on':''}`} onClick={()=>setShowCalcs(v=>!v)}><span className="tb-toggle-knob"/></button></div>
          <div className={`tb-slide ${showCalcs? 'open':''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-1" style={glow}>Core</h3>
                <ul className="list-disc pl-6">
                  <li>L = {fmtInt(L)}</li><li>SR = {sg.SR.toFixed(6)} (Σ ldr/HP)</li><li>T = {fmtInt(sg.T)}</li><li>Used L = {fmtInt(sg.used)}</li><li>Leftover L = {fmtInt(sg.leftover)}</li>
                </ul>
                <h3 className="font-semibold mt-3 mb-1" style={glow}>Anchors</h3>
                <ul className="list-disc pl-6">
                  <li>BASE = {fmtInt(anchors.BASE)}</li><li>ANCHOR = {fmtInt(anchors.ANCHOR)}</li><li>I_MERC = {fmtInt(anchors.Imerc)}</li><li>I_M6 = {fmtInt(anchors.Im6)}</li><li>I_M5 = {fmtInt(anchors.Im5)}</li><li>I_M4 = {fmtInt(anchors.Im4)}</li><li>I_CANNON = {fmtInt(anchors.Icannon)}</li>
                </ul>
                <h3 className="font-semibold mt-3 mb-1" style={glow}>Totals</h3>
                <ul className="list-disc pl-6">
                  <li>S/G — Units = {fmtInt(sgTotals.troops)} · HP = {fmtInt(sgTotals.hp)} · STR = {fmtInt(sgTotals.str)}</li>
                  <li>Monsters — Units = {fmtInt(monstersTotals.count)} · HP = {fmtInt(monstersTotals.hp)} · STR = {fmtInt(monstersTotals.str)}</li>
                  {hasMercResults && <li>Mercs — Units = {fmtInt(mercTotals.count)} · HP = {fmtInt(mercTotals.hp)} · STR = {fmtInt(mercTotals.str)}</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={glow}>SR breakdown</h3>
                <ul className="list-disc pl-6">
                  {srTerms.length? srTerms.slice(0,24).map((t,i)=>(<li key={i}>{t.level} · {t.type}: {t.ldr}/{t.health} = {(t.term).toFixed(6)}</li>)) : <li>—</li>}
                  <li>Σ terms = {sg.SR.toFixed(6)}</li>
                </ul>
                <h3 className="font-semibold mt-3 mb-1" style={glow}>Selections</h3>
                <ul className="list-disc pl-6">
                  <li>SG tiers: {Object.keys(selected).filter(k=>selected[k]).join(', ')||'none'}</li>
                  <li>Type picks: {picksSigSG||'none'}</li>
                  <li>Monster groups: {fullSelectedOrdered.join(', ')||'none'}</li>
                  <li>Entry picks: {picksSignature||'none'}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <div> </div>
      </div>
        {/* Toast */}
        {toast && (
          <div className="tb-toast" role="status" aria-live="polite">
            <div className="tb-toast-inner">{toast}</div>
          </div>
        )}
      {/* LØKI */}
      <div className="fixed bottom-4 right-4 z-[60] select-none">
        <div className="tb-chip text-sm md:text-base tracking-widest font-bold"><span className="tb-gold tb-sparkle">LØKI</span></div>
      </div>
      <Analytics />
    </div> 
  );
}











































