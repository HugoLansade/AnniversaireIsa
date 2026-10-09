// Réveillon à l'Île Grande — application (GitHub Pages + Firebase).
// No personal data in this file: names, addresses, families, dates and dishes
// live in Firestore, readable only by recognized guests (see firestore.rules).

import * as F from "./firebase.js";

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  // Opening of the site to guests (Paris time). Before it, the envelope only says "Bientôt disponible…".
  // Keep the same moment in the Firestore rules (function ouvert()).
  ouverture: "2026-10-11T00:00:00+02:00",
  reveillon: "2026-12-31T20:00:00+01:00",
  prixNuit: 30,
  sejourDu: "2026-12-30",      // first night at the gîte
  sejourAu: "2027-01-01",      // departure: guests sleep 0, 1 or 2 nights (30 and/or 31 December)
  plusDu: "2026-12-28",        // extra nights, an indication only (never counted, never charged):
  plusAu: "2027-01-05"         // from the night of 28 December up to the night of 4 January (departure on the 5th)
};

const POIS = [
  { nom:"L'Île Grande", tags:["balade","cote"], dist:"sur place", lat:48.7970, lng:-3.5700, hiver:"open",
    txt:"L'île de la commune, reliée par une digue : un tour de 4 km à plat le long des grèves et des anciennes carrières de granit, face à un semis de récifs. La station ornithologique de la LPO y soigne les oiseaux ; le sentier, lui, est libre toute l'année. Le gîte est sur l'île : la balade commence à la porte." },
  { nom:"Le Parc du Radôme", tags:["patrimoine","abri"], dist:"10 min", lat:48.7858, lng:-3.5237, hiver:"check",
    txt:"Le dôme blanc de cinquante mètres qui a capté la première image de télévision transatlantique en 1962, classé monument historique. Autour, la Cité des Télécoms et le Planétarium de Bretagne : deux visites au chaud à dix minutes d'ici. Les horaires d'hiver sont à vérifier avant de partir." },
  { nom:"Trégastel, plage de Coz-Pors", tags:["cote"], dist:"10 min", lat:48.8253, lng:-3.5083, hiver:"open",
    txt:"Les rochers aux formes reconnaissables — la Tête de Mort, le Père Éternel — sont accessibles à pied depuis le sable. L'aquarium marin est installé sous les blocs eux-mêmes ; vérifiez ses horaires d'hiver avant de vous déplacer." },
  { nom:"Île Renote", tags:["balade","cote"], dist:"12 min", lat:48.8272, lng:-3.5169, hiver:"open",
    txt:"Presqu'île reliée par un isthme, boucle de 2 km entre blocs roses et petites criques, avec vue dégagée sur les Sept-Îles. L'isthme reste praticable à toute marée, les criques non : regardez l'horaire avant de descendre." },
  { nom:"Vallée des Traouïero", tags:["balade","abri"], dist:"12 min", lat:48.8228, lng:-3.4936, hiver:"open",
    txt:"Une gorge boisée entre Ploumanac'h et Trégastel : chaos de granit sous les fougères, vieux moulin à marée, sentier ombragé. Abritée du vent — c'est la balade des jours de pluie." },
  { nom:"Ploumanac'h et le phare de Mean Ruz", tags:["balade","patrimoine"], dist:"15 min", lat:48.8302, lng:-3.4838, hiver:"open",
    txt:"Le phare en granit rose posé sur les rochers à l'entrée du port. À marée basse on accède à l'oratoire Saint-Guirec ; à marée haute la mer passe entre les blocs. Élu village préféré des Français en 2015, et il le mérite encore hors saison." },
  { nom:"Château de Costaérès", tags:["patrimoine"], dist:"15 min", lat:48.8270, lng:-3.4880, hiver:"open",
    txt:"Le château néo-médiéval sur son îlot, en face de la plage Saint-Guirec. Propriété privée, jamais visitable : on le photographie depuis la grève, ce qui est de toute façon le meilleur angle." },
  { nom:"Lannion et Brélévenez", tags:["village","abri"], dist:"15 min", lat:48.7320, lng:-3.4590, hiver:"open",
    txt:"Maisons à pans de bois autour de la place du Centre, puis 142 marches jusqu'à l'église de Brélévenez pour la vue sur le Léguer. Marché le jeudi matin : c'est là qu'on fait les courses du 31." },
  { nom:"Sentier des douaniers", tags:["balade"], dist:"18 min", lat:48.8207, lng:-3.4574, hiver:"open",
    txt:"Le GR34 longe le chaos de granit rose sur 4,5 km entre la plage de Trestraou et Ploumanac'h. Comptez 1 h 30 aller simple depuis Trestraou, sans dénivelé notable. Vers 16 h en décembre, la lumière rase fait virer la roche à l'orange." },
  { nom:"Les Sept-Îles", tags:["cote"], dist:"18 min", lat:48.8207, lng:-3.4574, hiver:"shut",
    txt:"La réserve ornithologique et sa colonie de fous de Bassan se visitent en bateau depuis Perros-Guirec — mais les sorties ne sont pas assurées fin décembre. Depuis la côte, une paire de jumelles suffit largement." },
  { nom:"Port-Blanc", tags:["village","cote"], dist:"35 min", lat:48.8296, lng:-3.3348, hiver:"open",
    txt:"Un petit port et une chapelle dont le toit descend jusqu'au sol, face à un semis d'îlots. Beaucoup moins fréquenté que Ploumanac'h, et superbe au couchant." },
  { nom:"Tréguier", tags:["village","patrimoine","abri"], dist:"45 min", lat:48.7866, lng:-3.2306, hiver:"open",
    txt:"Cité épiscopale : la cathédrale Saint-Tugdual et son cloître du XVᵉ, des ruelles à colombages, un port sur le Jaudy. Le marché du mercredi matin est le plus beau du secteur." },
  { nom:"Le Gouffre et la pointe du Château", tags:["balade","cote"], dist:"50 min", lat:48.8630, lng:-3.2337, hiver:"open",
    txt:"La côte la plus déchiquetée du Trégor, à Plougrescant, et la fameuse maison coincée entre deux rochers. Elle est habitée et privée : on la regarde depuis le sentier balisé, sans s'en approcher." }
];

const FILTERS = [
  { id:"tout",       nom:"Tout" },
  { id:"balade",     nom:"Balades" },
  { id:"cote",       nom:"Côte & plages" },
  { id:"patrimoine", nom:"Patrimoine" },
  { id:"village",    nom:"Villages" },
  { id:"abri",       nom:"Par mauvais temps" }
];

const HIVER_LABEL = {
  open:  { cls:"open",  txt:"Ouvert toute l'année" },
  check: { cls:"check", txt:"Horaires d'hiver à vérifier" },
  shut:  { cls:"shut",  txt:"Fermé fin décembre" }
};

const CATS = [
  { id:"sale",    nom:"Salé",     un:"Salé",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3v6a2 2 0 0 0 4 0V3"/><path d="M8 3v18"/><path d="M17 21V3c-2 1.2-3 3.6-3 6.5 0 2 1.2 3.5 3 3.5"/></svg>' },
  { id:"sucre",   nom:"Sucré",    un:"Sucré",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14l-1.6 8.2a1 1 0 0 1-1 .8H7.6a1 1 0 0 1-1-.8Z"/><path d="M4.5 12a7.5 7.5 0 0 1 15 0"/><path d="M12 4.5V3"/></svg>' },
  { id:"boisson", nom:"Boissons", un:"Boisson",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3h9l-.6 5.5a3.9 3.9 0 0 1-7.8 0Z"/><path d="M12 12.4V20"/><path d="M8.5 21h7"/></svg>' },
  { id:"autre",   nom:"Autre",    un:"Autre",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M17.7 6.3l-2.5 2.5M8.8 15.2l-2.5 2.5"/></svg>' }
];
const CAT = {};
CATS.forEach((c, i) => { c.idx = i; CAT[c.id] = c; });

/* Ideas taken from the "Repas du 31" tab of the organizer's spreadsheet. An idea counts
   as "taken" as soon as a dish in the same category contains one of its keywords. */
const IDEAS = [
  { cat:"sale", label:"Huîtres et citrons",        keys:["huitre"] },
  { cat:"sale", label:"Crevettes",                 keys:["crevette"] },
  { cat:"sale", label:"Saumon fumé et blinis",     keys:["saumon","blini","gravelax","gravlax"] },
  { cat:"sale", label:"Foie gras et toasts",       keys:["foie gras"] },
  { cat:"sale", label:"Pain surprise",             keys:["pain surprise"] },
  { cat:"sale", label:"Salade de lentilles",       keys:["lentille"] },
  { cat:"sale", label:"Salade de pâtes",           keys:["pates"] },
  { cat:"sale", label:"Salade verte",              keys:["salade verte"] },
  { cat:"sale", label:"Tomates cerises et olives", keys:["tomate","olive"] },
  { cat:"sale", label:"Légumes crus et sauces",    keys:["legumes crus","crudite"] },
  { cat:"sale", label:"Apéros en pâte feuilletée", keys:["feuillet"] },
  { cat:"sale", label:"Verrines",                  keys:["verrine"] },
  { cat:"sale", label:"Fromages",                  keys:["fromage"] },
  { cat:"sale", label:"Pain",                      keys:["pain","baguette"], not:["surprise","epice","perdu"] },
  { cat:"sale", label:"Truite fumée",              keys:["truite"] },
  { cat:"sale", label:"Quiche ou tarte salée",     keys:["quiche","tarte salee"] },
  { cat:"sucre", label:"Gâteau au chocolat",       keys:["chocolat"] },
  { cat:"sucre", label:"Tarte",                    keys:["tarte"] },
  { cat:"sucre", label:"Fruits frais",             keys:["fruits frais","clementine","mandarine","ananas","litchi"] },
  { cat:"sucre", label:"Salade de fruits",         keys:["salade de fruit"] },
  { cat:"sucre", label:"Charlotte aux framboises", keys:["charlotte"] },
  { cat:"boisson", label:"Vin rouge",              keys:["vin rouge","rouge"] },
  { cat:"boisson", label:"Vin blanc",              keys:["vin blanc","blanc"] },
  { cat:"boisson", label:"Spritz",                 keys:["spritz"] },
  { cat:"boisson", label:"Rhum pour le ti-punch",  keys:["rhum","punch"] },
  { cat:"boisson", label:"Bière",                  keys:["biere"] },
  { cat:"boisson", label:"Jus de fruits",          keys:["jus"] },
  { cat:"boisson", label:"Cocktail",               keys:["cocktail"] }
];

const ICON_TURN = '<svg class="f-turn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.5 3.5v4.4h-4.4"/></svg>';
const ICON_HERMINE = '<svg class="b-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-2 3.6-5.4 5.8-5.4 9.2 0 2.7 2.3 4.6 5.4 4.6s5.4-1.9 5.4-4.6c0-3.4-3.4-5.6-5.4-9.2Z" fill="currentColor"/><circle cx="6.6" cy="20" r="1.5" fill="currentColor"/><circle cx="12" cy="21.2" r="1.5" fill="currentColor"/><circle cx="17.4" cy="20" r="1.5" fill="currentColor"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5"/></svg>';
const ICON_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.2"/></svg>';

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function norm(s) {
  let t = String(s == null ? "" : s).toLowerCase();
  if (t.normalize) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return t.replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}
function slug(nom) { return norm(nom).replace(/\s+/g, "-").slice(0, 60); }
function nowIso() { return new Date().toISOString(); }
function cleanName(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function normMail(s) { return String(s || "").trim().toLowerCase(); }
function mailOk(s) { return /^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(s); }

function initials(nom) {
  const words = cleanName(nom).split(" ").filter((w) =>
    /^[A-Za-zÀ-ÿ]/.test(w) && ["et","de","du","la","le","les","des"].indexOf(w.toLowerCase()) === -1);
  const a = words[0] ? words[0].charAt(0) : "?";
  const b = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return (a + b).toUpperCase();
}
const AV_COLORS = ["#F2A03D","#FFC65C","#DE9C93","#5FB49C","#9FBFDA","#E8B4A0"];
function avColor(id) {
  let h = 0; const s = String(id || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
function avatarHtml(id, nom, cls) {
  return '<span class="avatar' + (cls ? " " + cls : "") + '" style="--av:' + avColor(id) + '" aria-hidden="true">' + esc(initials(nom)) + "</span>";
}
function firstName(full) { return cleanName(full).split(" ")[0] || ""; }
function prenomDe(e) { return (e && (e.prenom || firstName(e.nom))) || ""; }
function nomDeFamilleDe(e) {
  const p = prenomDe(e), n = cleanName(e && e.nom);
  return n.toLowerCase().indexOf(p.toLowerCase()) === 0 ? n.slice(p.length).trim() : "";
}
function plural(n, one, many) { return n + " " + (n > 1 ? (many || one + "s") : one); }
function listeNoms(noms) {
  const l = noms.filter(Boolean);
  if (l.length < 2) return l.join("");
  return l.slice(0, -1).join(", ") + " et " + l[l.length - 1];
}
function euros(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €"; }
function byNom(a, b) { return String(a.nom || a.id || "").localeCompare(String(b.nom || b.id || ""), "fr"); }
function sansId(o) { const c = Object.assign({}, o); delete c.id; return c; }

function isApple() {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}
function urlGoogle(lat, lng) { return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng + "&travelmode=driving"; }
function urlApple(lat, lng) { return "https://maps.apple.com/?daddr=" + lat + "," + lng + "&dirflg=d"; }
function urlPrimary(lat, lng) { return isApple() ? urlApple(lat, lng) : urlGoogle(lat, lng); }
function urlGoogleAdr(a) { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(a) + "&travelmode=driving"; }
function urlAppleAdr(a) { return "https://maps.apple.com/?daddr=" + encodeURIComponent(a) + "&dirflg=d"; }
function urlWazeAdr(a) { return "https://waze.com/ul?q=" + encodeURIComponent(a) + "&navigate=yes"; }
function urlPrimaryAdr(a) { return isApple() ? urlAppleAdr(a) : urlGoogleAdr(a); }

function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }

const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const toastEl = $("toast");
let toastTimer = null;
function hideToast() { toastEl.classList.remove("show"); }
function toast(msg, action) {
  toastEl.textContent = "";
  const span = document.createElement("span");
  span.textContent = msg;
  toastEl.appendChild(span);
  toastEl.classList.toggle("has-act", !!action);
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toast-act";
    b.textContent = action.label;
    b.addEventListener("click", () => { hideToast(); action.fn(); });
    toastEl.appendChild(b);
  }
  toastEl.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 6500 : 2800);
}

function scrollToId(id, instant) {
  const el = $(id);
  if (el) el.scrollIntoView({ behavior: (REDUCED || instant) ? "auto" : "smooth", block: "start" });
}
function setMsg(el, text, isErr) {
  if (!el) return;
  el.className = "form-msg" + (isErr ? " err" : "");
  el.textContent = text || "";
}
function busy(btn, on, label) {
  if (!btn) return;
  if (on) {
    if (!btn.dataset.txt) btn.dataset.txt = btn.textContent;
    btn.textContent = label || "…";
    btn.disabled = true;
  } else {
    if (btn.dataset.txt) btn.textContent = btn.dataset.txt;
    delete btn.dataset.txt;
    btn.disabled = false;
  }
}
function telecharger(nom, contenu, type) {
  const blob = new Blob([contenu], { type: type + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(nom + " téléchargé");
}

/* ---------- dates: "YYYY-MM-DD" strings, arithmetic in UTC days ---------- */
const JOURS = ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
const MOIS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function dnum(s) { const p = String(s).split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
function dstr(n) {
  const d = new Date(n * 86400000);
  return d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + d.getUTCDate()).slice(-2);
}
function dparts(s) { const d = new Date(dnum(s) * 86400000); return { w: d.getUTCDay(), d: d.getUTCDate(), m: d.getUTCMonth() }; }
function dayLabel(d) { return d === 1 ? "1er" : String(d); }
function fmtDay(s) { const p = dparts(s); return JOURS[p.w] + " " + dayLabel(p.d) + " " + MOIS[p.m]; }
function fmtShort(s) { const p = dparts(s); return dayLabel(p.d) + " " + MOIS[p.m]; }
function validDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function nights(st) {
  if (!st || !validDate(st.du) || !validDate(st.au)) return 0;
  const n = dnum(st.au) - dnum(st.du);
  return n > 0 ? n : 0;
}
function fmtVu(iso) {
  const t = Date.parse(iso || "");
  if (isNaN(t)) return "";
  const d = new Date(t);
  return dayLabel(d.getDate()) + " " + MOIS[d.getMonth()];
}

/* The nights that can be spent at the gîte (30 and 31 December): nobody counts more than these,
   so a participation never goes above NUITS.length × prixNuit (60 €). */
const NUITS = [];
for (let n = dnum(CONFIG.sejourDu); n < dnum(CONFIG.sejourAu); n++) NUITS.push(dstr(n));
function finNuit(nuit) { return dstr(dnum(nuit) + 1); }   // the morning after a night

/* Extra nights, before or after the party (28 and 29 December, 1 to 4 January). They only tell the
   organizers who stays on: they are never added to the nights, never charged, and never change a total. */
const PLUS = [];
for (let n = dnum(CONFIG.plusDu); n < dnum(CONFIG.plusAu); n++) { const j = dstr(n); if (NUITS.indexOf(j) === -1) PLUS.push(j); }
// consecutive nights (in order) grouped into runs: { du, au, n, nuits }
function runsDe(nuits) {
  const out = [];
  nuits.forEach((nuit) => {
    const last = out[out.length - 1];
    if (last && last.au === nuit) { last.au = finNuit(nuit); last.n += 1; last.nuits.push(nuit); }
    else out.push({ du: nuit, au: finNuit(nuit), n: 1, nuits: [nuit] });
  });
  return out;
}

/* ============================================================
   FIREBASE
   ============================================================ */
const app = F.initializeApp(F.firebaseConfig);
const auth = F.getAuth(app);
auth.languageCode = "fr";
const db = F.getFirestore(app);
const ref = (col, id) => F.doc(db, col, id);
const newRef = (col) => F.doc(F.collection(db, col));
const upd = (col, id, data) => F.updateDoc(ref(col, id), data);
const put = (col, id, data) => F.setDoc(ref(col, id), data);
const del = (col, id) => F.deleteDoc(ref(col, id));

/* ============================================================
   GUEST-ONLY CONTENT (address, contacts…)
   ============================================================ */
const C = { raw: {}, hote: "", lieu: {}, orgas: [] };
function hote() { return C.hote || "l'organisatrice"; }
function hoteCap() { const h = hote(); return h.charAt(0).toUpperCase() + h.slice(1); }

function applyContenu(data) {
  C.raw = data || {};
  C.hote = cleanName(C.raw.hote);
  C.lieu = C.raw.lieu || {};
  C.orgas = Array.isArray(C.raw.orgas) ? C.raw.orgas : [];
  const complet = (C.lieu.adresse || "") + (C.lieu.precision ? " (" + C.lieu.precision + ")" : "");
  document.querySelectorAll("[data-hote]").forEach((el) => { el.textContent = hote(); });
  document.querySelectorAll('[data-c="lieu.nom"]').forEach((el) => { el.textContent = C.lieu.nom || "gîte"; });
  document.querySelectorAll('[data-c="lieu.adresse"]').forEach((el) => { el.textContent = C.lieu.adresse || ""; });
  document.querySelectorAll('[data-c="lieu.complet"]').forEach((el) => { el.textContent = complet; });
  // the invitation letter: paragraphs, **bold** allowed
  const lettre = Array.isArray(C.raw.lettre) ? C.raw.lettre : [];
  $("lettre").innerHTML = lettre.map((p) =>
    "<p>" + esc(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") + "</p>").join("");
  wireLinks();
  renderPeople();
}

/* ============================================================
   STATE
   ============================================================ */
const S = {
  phase: "boot",        // boot | entree | famille | site
  email: null,          // recognized address
  verifie: false,       // address proven by a sign-in link
  acces: null,          // { famille, personnes }
  familleNom: "",
  admin: false,
  busy: false,          // a sign-in is in progress: ignore Firebase auth state changes
  attenteLien: false,   // back from a link, address still to confirm
  lien: null,           // "orga" | "invite" when coming back from a link
  orgaVisible: false
};

const D = {
  status: "idle",       // idle | loading | live | error
  errCode: null,
  espaces: {}, apports: {}, idees: {}, familles: {}, acces: {}, demandes: {},
  ready: { esp: false, app: false, ide: false },
  unsub: [],
  waiters: []
};

const G = {
  moi: null,            // the person using this device
  vue: null,            // the space shown in "Mon espace"
  asOrga: false,        // space opened from the dashboard
  draft: null, draftFor: null, draftTouched: false,
  dishCat: "sale", dishSoir: "31", editing: null, ideaRef: null,
  memes: {}             // relatives ticked in "Les mêmes dates pour"
};

/* ============================================================
   DATA — Firestore subscriptions
   ============================================================ */
const listeners = [];
function onData(fn) { listeners.push(fn); }
function emit() {
  listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
}
function mapSnap(snap) {
  const o = {};
  snap.forEach((d) => { o[d.id] = Object.assign({}, d.data(), { id: d.id }); });
  return o;
}

const Data = {
  start() {
    Data.stop();
    D.status = "loading";
    const sub = (q, fn) => {
      D.unsub.push(F.onSnapshot(q, (snap) => {
        fn(snap);
        D.status = "live";
        D.errCode = null;
        emit();
      }, (err) => Data.fail(err)));
    };
    sub(F.collection(db, "apports"), (s) => { D.apports = mapSnap(s); D.ready.app = true; });
    sub(F.collection(db, "idees"), (s) => { D.idees = mapSnap(s); D.ready.ide = true; });
    if (S.admin) {
      sub(F.collection(db, "espaces"), (s) => { D.espaces = mapSnap(s); Data.espPret(); });
      sub(F.collection(db, "familles"), (s) => { D.familles = mapSnap(s); });
      sub(F.collection(db, "acces"), (s) => { D.acces = mapSnap(s); });
      sub(F.collection(db, "demandes"), (s) => { D.demandes = mapSnap(s); });
    } else if (S.acces) {
      sub(F.query(F.collection(db, "espaces"), F.where("famille", "==", S.acces.famille)),
          (s) => { D.espaces = mapSnap(s); Data.espPret(); });
    } else {
      Data.espPret();
    }
  },
  stop() {
    D.unsub.forEach((u) => { try { u(); } catch (e) { /* already closed */ } });
    D.unsub = [];
    D.status = "idle";
    D.errCode = null;
    D.espaces = {}; D.apports = {}; D.idees = {}; D.familles = {}; D.acces = {}; D.demandes = {};
    D.ready = { esp: false, app: false, ide: false };
  },
  espPret() {
    if (D.ready.esp) return;
    D.ready.esp = true;
    D.waiters.splice(0).forEach((r) => r());
  },
  quandEspaces() {
    return D.ready.esp ? Promise.resolve() : new Promise((r) => D.waiters.push(r));
  },
  fail(err) {
    console.warn("Firestore :", err && err.code, err && err.message);
    D.status = "error";
    D.errCode = err && err.code;
    Data.espPret();
    emit();
  }
};

function familleEspaces(fid) {
  const f = fid || (S.acces && S.acces.famille);
  return Object.values(D.espaces).filter((e) => e.famille === f).sort(byNom);
}
function espaceVue() { return G.vue ? (D.espaces[G.vue] || null) : null; }
function auteur() { return D.espaces[G.moi] || espaceVue(); }

function errText(err) {
  const c = err && err.code;
  if (c === "permission-denied") return "Enregistrement refusé. Rechargez la page ; si cela continue, prévenez " + hote() + ".";
  if (c === "unavailable") return "Pas de connexion internet : réessayez quand le réseau revient.";
  if (c === "resource-exhausted") return "Le quota gratuit du jour est atteint. Réessayez demain ou prévenez " + hote() + ".";
  return "L'enregistrement n'a pas abouti. Réessayez.";
}
function authErrText(err) {
  const c = (err && err.code) || "";
  if (c === "auth/quota-exceeded") return "Trop de liens envoyés aujourd'hui (le plan gratuit de Firebase en permet 5 par jour). Réessayez demain.";
  if (c === "auth/invalid-email" || c === "auth/missing-email") return "Cette adresse e-mail n'est pas valide, ou ne correspond pas au lien.";
  if (c === "auth/unauthorized-continue-uri" || c === "auth/unauthorized-domain" || c === "auth/invalid-continue-uri")
    return "Ce site n'est pas encore autorisé dans Firebase (Authentication > Paramètres > Domaines autorisés).";
  if (c === "auth/operation-not-allowed" || c === "auth/admin-restricted-operation")
    return "Ce mode de connexion n'est pas activé dans Firebase (Authentication > Méthode de connexion).";
  if (c === "auth/network-request-failed" || c === "unavailable") return "Pas de connexion internet. Vérifiez le réseau, puis réessayez.";
  if (c === "auth/invalid-action-code" || c === "auth/expired-action-code") return "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.";
  if (c === "auth/too-many-requests") return "Trop d'essais d'affilée. Patientez quelques minutes.";
  if (c === "permission-denied") return "Accès refusé par la base de données. Les règles Firestore sont-elles publiées ?";
  return "La connexion n'a pas abouti. Réessayez dans un instant.";
}

/* =================================================================
   ENVELOPE — seal → flap → card
   A single Web Animations (WAAPI) timeline whose tracks all end at the same instant T:
   opening = playing it, closing = playing it backwards. The layout never jumps:
   only the reserved margins (open flap above, raised card below) grow smoothly.
   Settings taken from the "Envelope Lab" playground.
   ================================================================= */
const ENV_REGLAGES = {
  seal:  { start: 0,    dur: 420 },
  form:  { start: 0,    dur: 320 },
  flap:  { start: 300,  dur: 720 },
  rise:  { start: 900,  dur: 560 },
  lift:  { start: 1480, dur: 640 },
  names: { start: 1820, dur: 360, stagger: 60, on: false },
  closeSpeed: 1.4,   // closing plays the timeline backwards, faster
  lip: 0.9,          // depth of the pocket's V (× flap height)
  peak: 1.6,         // top of the card at the peak of its rise (× flap, above the opening)
  rest: -0.52,       // top of the card once settled (× flap above the opening; negative = below)
  inScale: 0.88,     // card scale while it is inside the envelope
  inset: 10,         // side inset of the card (px)
  room: 0.92,        // space reserved above when open (× flap)
  persp: 1600,       // perspective of the folds (px)
  reveal: "fold"     // the front folds towards the viewer ("fold"), tips over while fading ("drop") or just fades ("fade")
};
const ENV_EASE = {
  flap: "cubic-bezier(.62,.02,.3,1)",
  rise: "cubic-bezier(.2,.75,.3,1)",
  lift: "cubic-bezier(.5,0,.2,1)",
  fade: "cubic-bezier(.4,0,.7,1)",
  out:  "cubic-bezier(.2,.8,.25,1)"
};

const Enveloppe = (function () {
  const env = document.getElementById("env"), body = env.querySelector(".env-body"), flap = env.querySelector(".flap"),
    ombre = env.querySelector(".flap-edge .sh"), sceau = env.querySelector(".seal"),
    carte = document.getElementById("carte"), orga = document.getElementById("entreeOrga");
  const calme = matchMedia("(prefers-reduced-motion: reduce)");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fusion = (base, p) => {
    for (const k in p) {
      if (!(k in base)) continue;
      if (p[k] && typeof p[k] === "object" && typeof base[k] === "object") fusion(base[k], p[k]);
      else base[k] = p[k];
    }
    return base;
  };
  let P = clone(ENV_REGLAGES), anims = [], T = 1, sens = 0, enPause = false, vitesse = 1;

  const now = () => (anims.length ? +anims[0].currentTime || 0 : 0);
  const taux = () => sens * vitesse * (sens < 0 ? P.closeSpeed : 1);
  const reduit = () => (typeof REDUCED !== "undefined" && REDUCED) || calme.matches;

  function mesurer() {
    env.style.setProperty("--ins", P.inset + "px");
    env.style.setProperty("--lip-k", P.lip);
    env.style.perspective = P.persp + "px";
    const H = body.offsetHeight, F = flap.offsetHeight, Hc = carte.offsetHeight;
    const y0 = Math.ceil(P.lip * F) + 3;                                // tucked below the edge of the V
    const sIn = Math.max(.3, Math.min(P.inScale, (H - y0 - 8) / Hc));   // fits inside the pocket
    const yRest = -P.rest * F;
    return { H, F, Hc, y0, sIn, yPeak: -P.peak * F, yRest, room: P.room * F,
      below: Math.max(0, yRest + Hc + 14 - H) };                        // overflow below the envelope
  }

  function bornes() {
    const re = P.rise.start + P.rise.dur, ls = Math.max(P.lift.start, re), le = ls + P.lift.dur;
    const n = carte.querySelectorAll(".place").length;
    const ne = P.names.start + P.names.stagger * Math.max(0, n - 1) + P.names.dur;
    return { re, ls, le, ne };
  }

  function phases() {
    const b = bornes();
    const list = [
      { k: "seal", a: P.seal.start, b: P.seal.start + P.seal.dur },
      { k: "form", a: P.form.start, b: P.form.start + P.form.dur },
      { k: "flap", a: P.flap.start, b: P.flap.start + P.flap.dur },
      { k: "rise", a: P.rise.start, b: b.re },
      { k: "lift", a: b.ls, b: b.le }
    ];
    if (P.names.on) list.push({ k: "names", a: P.names.start, b: b.ne });
    return list;
  }

  function piste(el, frames, start, dur, easing) {
    if (!el) return;
    const a = el.animate(frames, { duration: Math.max(1, dur), delay: start,
      endDelay: Math.max(0, T - start - Math.max(1, dur)), fill: "both", easing: easing || "linear" });
    a.pause();
    anims.push(a);
  }

  function construire() {
    if (!env.offsetWidth) return;   // entry hidden ("site" phase): keep the timeline as it is
    const t0 = now(), ouvert = anims.length > 0 && t0 >= T - .5, sensAvant = enPause ? 0 : sens;
    anims.forEach((a) => a.cancel());
    anims = [];
    const g = mesurer(), b = bornes();
    T = Math.max(1, ...phases().map((p) => p.b));

    // 1. the seal fades away
    piste(sceau, [
      { opacity: 1, transform: "scale(1)", filter: "drop-shadow(0 6px 8px rgba(1,9,18,.5)) blur(0px)" },
      { offset: .3, opacity: 1, transform: "scale(1.05)" },
      { opacity: 0, transform: "scale(.8)", filter: "drop-shadow(0 6px 8px rgba(1,9,18,0)) blur(2px)" }
    ], P.seal.start, P.seal.dur, "ease-in-out");

    // 2. the address and the organizer link fade out, without leaving the layout
    body.querySelectorAll(".env-pane").forEach((p) =>
      piste(p, [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 6px" }], P.form.start, P.form.dur, "ease-in"));
    piste(orga, [{ opacity: 1, visibility: "visible" }, { opacity: 0, visibility: "hidden" }], P.form.start, P.form.dur, "ease-in");

    // 3. the flap opens; at 90° it goes behind the card; the space above opens up at the same pace
    piste(flap, [
      { transform: "rotateX(0deg)", zIndex: 3 },
      { offset: .5, zIndex: 3 }, { offset: .5, zIndex: 0 },
      { transform: "rotateX(180deg)", zIndex: 0 }
    ], P.flap.start, P.flap.dur, ENV_EASE.flap);
    piste(ombre, [{ opacity: 1 }, { opacity: 0 }], P.flap.start, P.flap.dur * .35);
    piste(env, [{ marginTop: "0px" }, { marginTop: g.room.toFixed(1) + "px" }], P.flap.start, P.flap.dur, ENV_EASE.flap);

    // 4. the card rises out of the pocket, pauses, then settles in front
    const cs = P.rise.start, ce = b.le, k = (t) => (t - cs) / (ce - cs);
    const pos = (y, s) => "translateY(" + y.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    const bas = "0 2px 6px -2px rgba(1,9,18,.55)", haut = "0 28px 46px -18px rgba(1,9,18,.92)";
    piste(carte, [
      { offset: 0, transform: pos(g.y0, g.sIn), boxShadow: bas, visibility: "hidden", easing: ENV_EASE.rise },
      { offset: k(b.re), transform: pos(g.yPeak, g.sIn), boxShadow: bas, visibility: "visible" },
      { offset: k(b.ls), transform: pos(g.yPeak, g.sIn), boxShadow: bas, easing: ENV_EASE.lift },
      { offset: 1, transform: pos(g.yRest, 1), boxShadow: haut, visibility: "visible" }
    ], cs, ce - cs);

    // meanwhile, the front of the envelope releases the card
    const tombe = P.reveal === "fold" ? -90 : P.reveal === "drop" ? -40 : 0;
    piste(body, [
      { transform: "rotateX(0deg)", opacity: 1, visibility: "visible" },
      { offset: tombe ? (P.reveal === "fold" ? .8 : .3) : 0, opacity: 1 },
      { transform: "rotateX(" + tombe + "deg)", opacity: 0, visibility: "hidden" }
    ], b.ls, P.lift.dur * (P.reveal === "fold" ? .8 : .6), tombe ? ENV_EASE.lift : ENV_EASE.fade);
    if (g.below > .5) piste(env, [{ marginBottom: "0px" }, { marginBottom: g.below.toFixed(1) + "px" }], b.ls, P.lift.dur, ENV_EASE.lift);

    // 5. (optional) the first names appear one by one
    if (P.names.on) carte.querySelectorAll(".place").forEach((el, i) =>
      piste(el, [{ opacity: 0, translate: "0 10px" }, { opacity: 1, translate: "0 0" }],
        P.names.start + i * P.names.stagger, P.names.dur, ENV_EASE.out));

    caler(ouvert ? T : Math.min(t0, T));
    if (sensAvant) jouer(sensAvant);
  }

  function caler(t) {
    anims.forEach((a) => { a.pause(); a.currentTime = t; });
    sens = 0; enPause = false;
    env.classList.toggle("open", t > 0);
  }

  function jouer(d) {
    if (!anims.length) return false;
    const t = now();
    if ((d > 0 && t >= T) || (d < 0 && t <= 0)) return false;
    if (reduit()) { caler(d > 0 ? T : 0); return true; }
    sens = d; enPause = false;
    env.classList.add("open");
    const r = taux();
    anims.forEach((a) => { a.playbackRate = r; a.play(); });
    const a0 = anims[0];
    a0.finished.then(() => {
      if (anims[0] !== a0 || a0.playState !== "finished") return;
      sens = 0;
      if (now() <= 0) env.classList.remove("open");
    }, () => {});
    return true;
  }

  new ResizeObserver(() => construire()).observe(env);
  if (document.fonts) document.fonts.ready.then(construire);

  return {
    ouvrir: () => jouer(1),
    fermer: () => jouer(-1),
    caler: (t) => caler(Math.max(0, Math.min(T, t))),
    construire, phases,
    duree: () => T,
    etat: () => ({ t: now(), T, dir: sens, paused: enPause }),
    pause() { if (sens) { enPause = true; anims.forEach((a) => a.pause()); } },
    reprendre() { if (enPause) jouer(sens); },
    vitesse(v) { vitesse = v; if (sens && !enPause) anims.forEach((a) => a.updatePlaybackRate(taux())); },
    reglages: () => clone(P),
    defauts: () => clone(ENV_REGLAGES),
    regler(p) { P = fusion(clone(ENV_REGLAGES), p || {}); construire(); }
  };
})();

/* ============================================================
   OPENING — "Bientôt disponible…" until CONFIG.ouverture
   Before that moment the envelope only says that the site opens soon: no address field, and nothing
   is asked of the database. The Firestore rules refuse everything to anybody but the organizers until
   the same moment (function ouvert() in the rules), so changing the date here alone opens nothing.
   The organizers' door: add ?porte to the site address to show "Vous organisez ? Connexion organisateur"
   under the envelope (sign-in link, as usual). An organizer already signed in on the device gets in
   directly. From the opening on, all this switches off by itself.
   ============================================================ */
const Soon = {
  actif: Date.now() < Date.parse(CONFIG.ouverture),
  porte: /[?&]porte(=|&|$)/.test(location.search)
};
// "dimanche 11 octobre" (+ " à 9 h" when the opening is not at midnight), in Paris time
function texteOuverture() {
  const parts = {};
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long",
      hour: "numeric", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(CONFIG.ouverture)).forEach((p) => { parts[p.type] = p.value; });
  } catch (e) { return ""; }
  if (!parts.weekday || !parts.day || !parts.month) return "";
  const h = +parts.hour || 0, m = +parts.minute || 0;
  return parts.weekday + " " + (parts.day === "1" ? "1er" : parts.day) + " " + parts.month
    + (h || m ? " à " + h + " h" + (m ? String(m).padStart(2, "0") : "") : "");
}
// At the opening, a page left on "Bientôt disponible…" reloads by itself (a few seconds late: the server clock decides).
function armerOuverture() {
  if (!Soon.actif) return;
  const ms = Date.parse(CONFIG.ouverture) - Date.now() + 5000;
  if (ms > 2147483000) return;   // more than 24 days away: setTimeout cannot wait that long
  setTimeout(() => {
    Soon.actif = false;
    if (S.phase !== "site") location.reload();
  }, Math.max(0, ms));
}

/* ============================================================
   ENTRY — the envelope
   ============================================================ */
const PANES = ["paneBoot", "paneSoon", "paneMail", "paneAsk", "paneAskOk", "paneOrga", "paneSent", "paneConfirm", "paneFamille"];
const FOCUS_OF = { paneMail: "mailInput", paneOrga: "orgaMail", paneConfirm: "confirmMail", paneAsk: "askName" };
const Gate = { pane: "paneBoot", autoTimer: null };

Gate.show = function (pane, focus) {
  const lettre = pane === "paneFamille";
  Gate.pane = pane;
  // the letter always opens from the address pane: the envelope keeps the same height when opening and closing
  if (lettre && $("paneMail").hidden) {
    if (S.email) $("mailInput").value = S.email;
    $("entreeOrga").hidden = false;
  }
  const face = lettre ? "paneMail" : pane;
  PANES.forEach((id) => { if (id !== "paneFamille") $(id).hidden = id !== face; });
  // the organizer link: under the address field, or under "Bientôt disponible…" when the door is open (?porte)
  if (!lettre) $("entreeOrga").hidden = !(pane === "paneMail" || (pane === "paneSoon" && Soon.porte));
  if (lettre) { renderPlaces(); Enveloppe.ouvrir(); } else Enveloppe.fermer();
  if (focus && FOCUS_OF[pane]) {
    setTimeout(() => { try { $(FOCUS_OF[pane]).focus({ preventScroll: true }); } catch (e) { /* nothing to do */ } }, 60);
  }
};

function setPhase(p) {
  S.phase = p;
  document.body.setAttribute("data-phase", p);
  if (p !== "site") {
    $("env").classList.remove("leaving");
    closeMeMenu();
  }
  if (p === "famille") Gate.show("paneFamille");
}

function montrerEntree(msg) {
  setPhase("entree");
  if (Soon.actif) {   // before the opening: no address field, only "Bientôt disponible…"
    Gate.show("paneSoon");
    if (msg) setMsg($("soonMsg"), msg, true);   // like the address pane: a later call without a message keeps it
    return;
  }
  Gate.show("paneMail");
  if (msg) setMsg($("mailMsg"), msg, true);
}

function renderPlaces() {
  const fam = familleEspaces();
  const mine = (S.acces && S.acces.personnes) || [];
  const list = fam.slice().sort((a, b) =>
    (mine.indexOf(b.id) !== -1) - (mine.indexOf(a.id) !== -1) || byNom(a, b));
  $("famTitle").textContent = list.length === 1 ? "Bonjour " + prenomDe(list[0]) + " !" : "Qui ouvre l'invitation ?";
  $("famSub").textContent = S.familleNom ? "Famille " + S.familleNom : "";
  $("famHint").textContent = list.length === 1 ? "Votre espace s'ouvre…" : "Vous pourrez aussi remplir l'espace de vos proches.";
  $("places").innerHTML = list.map((e) => {
    const me = mine.indexOf(e.id) !== -1;
    return '<button class="place' + (me ? " is-me" : "") + '" type="button" data-pick="' + esc(e.id) + '">'
      + '<span class="pn">' + esc(prenomDe(e)) + "</span>"
      + '<span class="pf">' + esc(nomDeFamilleDe(e)) + "</span>"
      + (me ? '<span class="pm">votre adresse</span>' : "")
      + "</button>";
  }).join("");
  Enveloppe.construire();   // the card may have changed height
}

function choisirPersonne(pid) {
  clearTimeout(Gate.autoTimer);
  const card = document.querySelector('.place[data-pick="' + pid + '"]');
  if (card) card.classList.add("pick");
  const go = () => {
    $("env").classList.add("leaving");
    setTimeout(() => entrerComme(pid, true), REDUCED ? 0 : 320);
  };
  setTimeout(go, REDUCED ? 0 : 220);
}

function entrerComme(pid, viaEnveloppe) {
  clearTimeout(Gate.autoTimer);
  // The Goéland security check runs before the space opens, for the targeted guest only.
  if (goelandVise(pid)) { lancerGoeland(pid, () => entrerComme(pid, viaEnveloppe)); return; }
  G.moi = pid;
  G.vue = pid;
  G.asOrga = false;
  G.draftFor = null;
  G.editing = null;
  G.ideaRef = null;
  G.memes = {};
  lsSet("ig.moi", pid);
  marquerVu(pid);
  setPhase("site");
  emit();
  const versOrga = S.lien === "orga" && S.admin;
  if (versOrga) S.orgaVisible = true;
  S.lien = null;
  updateOrgaUi();
  if (viaEnveloppe) toast("Bonjour " + prenomDe(D.espaces[pid]) + " !");
  // Once the account is open we land on "Qui apporte quoi" (the dashboard for an organizer
  // coming back from a sign-in link). Straight there, without scrolling, when the device remembered the guest.
  const cible = versOrga ? "orga" : "boued";
  requestAnimationFrame(() => scrollToId(cible, !viaEnveloppe && !versOrga));
}

function entrerSansEspace() {
  G.moi = null;
  G.vue = null;
  setPhase("site");
  if (S.admin) S.orgaVisible = true;
  S.lien = null;
  updateOrgaUi();
  emit();
  requestAnimationFrame(() => scrollToId(S.admin ? "orga" : "espace"));
}

function marquerVu(pid) {
  const e = D.espaces[pid];
  if (!e) return;
  const last = Date.parse(e.vu || "");
  if (!isNaN(last) && Date.now() - last < 6 * 3600 * 1000) return;
  upd("espaces", pid, { vu: nowIso() }).catch(() => { /* not critical */ });
}

/* ============================================================
   EASTER EGG — THE GOÉLAND SECURITY CHECK (goeland.html)
   Six mini-games to pass before entering, for one guest only, once.
   - No name is written here: the guest is recognized by a fingerprint of the
     first name stored in Firebase (empreinte(norm(prenom)), see GOELAND.cibles).
   - Whatever address was used to come in (theirs or a relative's), anyone who
     enters as this guest, switches to them, or opens their space from the family
     strip gets the check, until it has been passed once. Only the organizers
     (signed in with a link) are exempt.
   - "Passed" is the "goeland" stamp in Firestore: wiping the database resets the game.
   - To try it on any account, add ?goeland to the site address: the game then
     runs on every entry and nothing is saved.
   ============================================================ */
const GOELAND = {
  cibles: ["efa5a5"],   // empreinte(norm("<first name>")) of each targeted guest
  force: /[?&]goeland(=|&|$)/.test(location.search),
  enCours: false,
  fait: false
};
function empreinte(s) {   // FNV-1a hash, in base 36
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
// The browser keeps its own note only when the Firestore stamp was refused (rules not published…).
function goelandNote(pid) { return "ig.goeland.attente." + pid; }
function goelandReussi(e) {
  return !!(e && (e.goeland || lsGet(goelandNote(e.id)) === "ok"));
}
function goelandVise(pid) {
  if (GOELAND.fait || GOELAND.enCours) return false;
  if (GOELAND.force) return true;
  if (S.admin) return false;
  const e = D.espaces[pid];
  if (!e || GOELAND.cibles.indexOf(empreinte(norm(prenomDe(e)))) === -1) return false;
  // no exemption for the address used: a relative's address does not get round the check
  return !goelandReussi(e);
}
function lancerGoeland(pid, suite) {
  GOELAND.enCours = true;
  const ov = document.createElement("div");
  ov.className = "goeland-ov";
  const cadre = document.createElement("iframe");
  cadre.title = "Contrôle de sécurité";
  cadre.src = "goeland.html?prenom=" + encodeURIComponent(prenomDe(D.espaces[pid]) || "");
  ov.appendChild(cadre);
  // the page behind stays out of reach (keyboard, screen readers) while the game is open
  const derriere = Array.from(document.body.children).filter((el) => !el.inert);
  derriere.forEach((el) => { el.inert = true; });
  document.body.appendChild(ov);
  document.documentElement.classList.add("goeland-on");
  cadre.addEventListener("load", () => { try { cadre.focus(); } catch (e) { /* nothing to do */ } });
  const fin = (ev) => {
    if (ev.source !== cadre.contentWindow || !ev.data || ev.data.type !== "goeland:fini") return;
    window.removeEventListener("message", fin);
    GOELAND.enCours = false;
    GOELAND.fait = true;
    if (!GOELAND.force) {
      // saved in Firestore so the badge follows the guest to other devices (needs the "goeland" rule);
      // if the stamp is refused, this browser remembers on its own
      upd("espaces", pid, { goeland: nowIso() })
        .then(() => lsDel(goelandNote(pid)), () => lsSet(goelandNote(pid), "ok"));
    }
    derriere.forEach((el) => { el.inert = false; });
    ov.remove();
    document.documentElement.classList.remove("goeland-on");
    suite();
  };
  window.addEventListener("message", fin);
}

/* The address is recognized: load what it gives access to. */
async function ouvrirSession(email, verifie) {
  S.email = email;
  S.verifie = verifie;
  S.acces = null;
  S.admin = false;
  S.familleNom = "";
  let snap = null;
  try {
    snap = await F.getDoc(ref("acces", email));
  } catch (err) {
    if (!(verifie && err && err.code === "permission-denied")) { S.email = null; throw err; }
  }
  S.acces = snap && snap.exists() ? snap.data() : null;
  if (verifie) S.admin = await testAdmin();
  if (!S.acces && !S.admin) {
    S.email = null;
    await fermerSession();
    montrerEntree(Soon.actif
      ? "Avant l'ouverture du site, seuls les organisateurs peuvent entrer."
      : "Cette adresse n'est pas (ou plus) sur la liste des invités. Vérifiez l'orthographe, ou essayez l'adresse d'un proche.");
    $("mailInput").value = email;
    $("askMail").value = email;
    $("mailAsk").hidden = false;
    return false;
  }
  try {
    const c = await F.getDoc(ref("contenu", "site"));
    applyContenu(c.exists() ? c.data() : {});
  } catch (err) {
    applyContenu({});
  }
  if (S.acces) {
    try {
      const f = await F.getDoc(ref("familles", S.acces.famille));
      S.familleNom = f.exists() ? (f.data().nom || "") : "";
    } catch (err) { S.familleNom = ""; }
  }
  Data.start();
  updateOrgaUi();
  return true;
}

async function testAdmin() {
  try { await F.getDoc(ref("admin", "ping")); return true; } catch (e) { return false; }
}

async function apresOuverture() {
  await Data.quandEspaces();
  if (D.status === "error" && !Object.keys(D.espaces).length) {
    const msg = D.errCode === "permission-denied"
      ? "La base de données refuse l'accès. Les règles Firestore sont-elles publiées ?"
      : "La liste ne se charge pas. Vérifiez votre connexion internet puis rechargez la page.";
    S.email = null;
    Data.stop();
    montrerEntree(msg);
    return;
  }
  const fam = familleEspaces();
  const souvenir = lsGet("ig.moi");
  if (souvenir && fam.some((e) => e.id === souvenir)) { entrerComme(souvenir, false); return; }
  if (!fam.length) {
    if (S.admin) { entrerSansEspace(); return; }
    S.email = null;
    Data.stop();
    await fermerSession();
    montrerEntree("Aucun espace n'est encore rattaché à cette adresse. Prévenez l'organisatrice.");
    return;
  }
  setPhase("famille");
  if (fam.length === 1) {
    Gate.autoTimer = setTimeout(() => choisirPersonne(fam[0].id), REDUCED ? 700 : Enveloppe.duree() + 900);
  }
}

/* Entry by email (Spark plan): anonymous sign-in + a session tied to the address.
   The Firestore rules reject the session if the address is not on the list. */
async function submitMail(ev) {
  ev.preventDefault();
  const email = normMail($("mailInput").value);
  const msg = $("mailMsg");
  setMsg(msg, "");
  $("mailAsk").hidden = true;
  if (!mailOk(email)) { setMsg(msg, "Vérifiez l'adresse : elle doit ressembler à prenom.nom@exemple.fr.", true); return; }
  if (F.modeInvites === "lien") { envoyerLien(email, "invite", msg, $("mailSubmit")); return; }
  S.busy = true;
  busy($("mailSubmit"), true, "Ouverture…");
  try {
    let user = auth.currentUser;
    if (user && !user.isAnonymous) { await F.signOut(auth); user = null; }
    if (!user) user = (await F.signInAnonymously(auth)).user;
    try {
      await F.setDoc(ref("sessions", user.uid), { email: email, cree: nowIso() });
    } catch (err) {
      if (err && err.code === "permission-denied") {
        $("askMail").value = email;
        setMsg(msg, "Cette adresse n'est pas sur la liste des invités. Vérifiez l'orthographe, ou essayez l'adresse d'un proche.", true);
        $("mailAsk").hidden = false;
        return;
      }
      throw err;
    }
    if (await ouvrirSession(email, false)) await apresOuverture();
  } catch (err) {
    setMsg(msg, authErrText(err), true);
  } finally {
    S.busy = false;
    busy($("mailSubmit"), false);
  }
}

async function envoyerLien(email, but, msgEl, btn) {
  busy(btn, true, "Envoi…");
  try {
    const url = location.origin + location.pathname + "?lien=" + but;
    await F.sendSignInLinkToEmail(auth, email, { url: url, handleCodeInApp: true });
    lsSet("ig.lienMail", email);
    if (S.phase === "site") {
      setMsg(msgEl, "Lien envoyé à " + email + ". Ouvrez l'e-mail sur cet appareil et touchez le lien (pensez aux courriers indésirables).");
    } else {
      $("sentTo").textContent = email;
      Gate.show("paneSent");
    }
  } catch (err) {
    setMsg(msgEl, authErrText(err), true);
  } finally {
    busy(btn, false);
  }
}

async function terminerLien(email) {
  S.busy = true;
  S.attenteLien = false;
  setPhase("boot");
  Gate.show("paneBoot");
  $("bootMsg").textContent = "Connexion en cours…";
  try {
    if (auth.authStateReady) await auth.authStateReady();
    const u = auth.currentUser;
    if (u && u.isAnonymous) { try { await del("sessions", u.uid); } catch (e) { /* nothing to do */ } }
    await F.signInWithEmailLink(auth, email, location.href);
    lsDel("ig.lienMail");
    history.replaceState(null, "", location.pathname);
    if (await ouvrirSession(email, true)) await apresOuverture();
    S.busy = false;
  } catch (err) {
    S.busy = false;
    if (err && (err.code === "auth/invalid-email" || err.code === "auth/missing-email")) {
      setPhase("entree");
      Gate.show("paneConfirm", true);
      S.attenteLien = true;
      setMsg($("confirmMsg"), "Cette adresse ne correspond pas au lien reçu.", true);
      return;
    }
    history.replaceState(null, "", location.pathname);
    S.email = null;
    await onAuth(auth.currentUser);
    if (S.phase === "entree" || S.phase === "boot") montrerEntree(authErrText(err));
  }
}

async function fermerSession() {
  const u = auth.currentUser;
  if (u && u.isAnonymous) { try { await del("sessions", u.uid); } catch (e) { /* nothing to do */ } }
  const wasBusy = S.busy;
  S.busy = true;
  try { await F.signOut(auth); } catch (e) { /* nothing to do */ }
  S.busy = wasBusy;
}

async function seDeconnecter() {
  closeMeMenu();
  Data.stop();
  await fermerSession();
  lsDel("ig.moi");
  Object.assign(S, { email: null, verifie: false, acces: null, familleNom: "", admin: false, orgaVisible: false, lien: null });
  Object.assign(G, { moi: null, vue: null, asOrga: false, draft: null, draftFor: null, editing: null, ideaRef: null, memes: {} });
  updateOrgaUi();
  $("mailInput").value = "";
  setMsg($("mailMsg"), "");
  $("mailAsk").hidden = true;
  montrerEntree();
  window.scrollTo(0, 0);
  toast("Vous êtes déconnecté·e");
}

function changerDePersonne() {
  closeMeMenu();
  if (familleEspaces().length < 2) return;
  window.scrollTo(0, 0);
  setPhase("famille");
}

/* Firebase auth state change (page opened, back on the tab…) */
async function onAuth(user) {
  if (S.busy || S.attenteLien || S.email) return;
  // Before the opening only an organizer's own sign-in opens the site: a guest's session is not even looked up.
  if (!user || (Soon.actif && user.isAnonymous)) { montrerEntree(); return; }
  try {
    if (user.isAnonymous) {
      const s = await F.getDoc(ref("sessions", user.uid));
      const email = s.exists() ? s.data().email : null;
      if (!email) { montrerEntree(); return; }
      if (await ouvrirSession(email, false)) await apresOuverture();
    } else if (user.emailVerified && user.email) {
      if (await ouvrirSession(normMail(user.email), true)) await apresOuverture();
    } else {
      await fermerSession();
      montrerEntree();
    }
  } catch (err) {
    S.email = null;
    montrerEntree(authErrText(err));
  }
}

async function submitAsk(ev) {
  ev.preventDefault();
  const msg = $("askMsg");
  const email = normMail($("askMail").value);
  const nom = cleanName($("askName").value);
  const message = cleanName($("askNote").value);
  if (!mailOk(email)) { setMsg(msg, "Indiquez une adresse e-mail valide.", true); return; }
  if (nom.length < 2) { setMsg(msg, "Indiquez votre prénom et votre nom.", true); return; }
  const btn = ev.target.querySelector('button[type="submit"]');
  busy(btn, true, "Envoi…");
  const wasBusy = S.busy;
  S.busy = true;
  try {
    if (!auth.currentUser) await F.signInAnonymously(auth);
    await F.setDoc(newRef("demandes"), { email: email, nom: nom, message: message, cree: nowIso() });
    setMsg(msg, "");
    Gate.show("paneAskOk");
  } catch (err) {
    setMsg(msg, authErrText(err), true);
  } finally {
    S.busy = wasBusy;
    busy(btn, false);
  }
}

async function submitConfirm(ev) {
  ev.preventDefault();
  const email = normMail($("confirmMail").value);
  if (!mailOk(email)) { setMsg($("confirmMsg"), "Indiquez l'adresse qui a reçu le lien.", true); return; }
  await terminerLien(email);
}

/* ============================================================
   TOP BAR — the signed-in person
   ============================================================ */
function renderMe() {
  const e = D.espaces[G.moi];
  const btn = $("meBtn");
  if (!e && !S.admin) { btn.hidden = true; return; }
  btn.hidden = false;
  const label = e ? prenomDe(e) : "Organisation";
  $("meAv").outerHTML = '<span class="avatar" id="meAv" style="--av:' + avColor(e ? e.id : "orga") + '" aria-hidden="true">' + esc(initials(e ? e.nom : "Organisation")) + "</span>";
  $("meName").textContent = label;
  btn.setAttribute("aria-label", "Menu de " + label);
  $("meSwitch").hidden = familleEspaces().length < 2;
  $("meOrga").hidden = !S.admin;
}
function closeMeMenu() {
  $("meMenu").hidden = true;
  $("meBtn").setAttribute("aria-expanded", "false");
}
function toggleMeMenu() {
  const open = $("meMenu").hidden;
  $("meMenu").hidden = !open;
  $("meBtn").setAttribute("aria-expanded", String(open));
  if (open) { const first = $("meMenu").querySelector("button:not([hidden])"); if (first) first.focus(); }
}

/* ============================================================
   BUFFET — who brings what
   ============================================================ */
function allItems() {
  const out = [];
  Object.values(D.apports).forEach((it) => {
    if (!it || !cleanName(it.intitule)) return;
    out.push({
      key: it.id, id: it.id, espace: it.espace, famille: it.famille,
      qui: it.qui || "Un invité",
      type: CAT[it.type] ? it.type : "autre",
      intitule: cleanName(it.intitule),
      soir: it.soir || "",
      note: cleanName(it.note),
      idee: it.idee || "",
      cree: it.cree || ""
    });
  });
  out.sort((a, b) => (CAT[a.type].idx - CAT[b.type].idx)
    || a.intitule.localeCompare(b.intitule, "fr") || a.qui.localeCompare(b.qui, "fr"));
  return out;
}

function ideaMatches(idea, text) {
  const t = " " + norm(text) + " ";
  if (idea.not && idea.not.some((x) => t.indexOf(x) !== -1)) return false;
  return idea.keys.some((k) => t.indexOf(" " + k) !== -1);
}
function allIdeas() {
  const out = IDEAS.map((i) => ({ ref: "s:" + norm(i.label), cat: i.cat, label: i.label, keys: i.keys, not: i.not }));
  const guests = [];
  Object.values(D.idees).forEach((d) => {
    const label = cleanName(d && d.intitule);
    if (!label || !CAT[d.type] || d.type === "autre") return;
    guests.push({ ref: "g:" + d.id, id: d.id, cat: d.type, label: label, famille: d.famille, espace: d.espace,
      by: d.par || "un invité", cree: d.cree || "" });
  });
  guests.sort((a, b) => (a.cree < b.cree ? -1 : (a.cree > b.cree ? 1 : 0)));
  return out.concat(guests);
}
function ideaTaken(idea, items) {
  return items.some((it) => {
    if (it.idee && it.idee === idea.ref) return true;
    if (it.type !== idea.cat) return false;
    if (idea.keys) return ideaMatches(idea, it.intitule);
    const l = norm(idea.label);
    return !!l && (" " + norm(it.intitule) + " ").indexOf(" " + l + " ") !== -1;
  });
}
function freeIdeas(items) {
  const seen = {};
  return allIdeas().filter((idea) => {
    if (ideaTaken(idea, items)) return false;
    const k = idea.cat + "|" + norm(idea.label);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
}
function findIdea(r) { return allIdeas().filter((i) => i.ref === r)[0] || null; }
function isNew(it) {
  if (!it.cree) return false;
  const t = Date.parse(it.cree);
  return !isNaN(t) && (Date.now() - t) < 3 * 86400000;
}

const Buffet = {
  filter: "tout",
  view: (lsGet("ig.view") === "list") ? "list" : "cards",
  flipped: {},
  revealAll: false
};

function stateNote(kind) {
  if (kind === "loading") return '<div class="live-note">' + ICON_INFO + "<div>Chargement de la liste…</div></div>";
  return '<div class="live-note warn">' + ICON_INFO + "<div><b>La liste ne se charge pas.</b> Vérifiez votre connexion internet, puis rechargez la page.</div></div>";
}

Buffet.render = function () {
  const st = $("buffetState"), body = $("buffetBody");
  if (!D.ready.app) {
    st.innerHTML = stateNote(D.status === "error" ? "off" : "loading");
    body.hidden = true;
    return;
  }
  st.innerHTML = "";
  body.hidden = false;

  const items = allItems();
  const counts = { tout: items.length };
  CATS.forEach((c) => { counts[c.id] = 0; });
  items.forEach((it) => { counts[it.type]++; });
  const qui = {};
  items.forEach((it) => { qui[it.espace || it.qui] = true; });
  const nq = Object.keys(qui).length;

  $("tallyN").textContent = items.length;
  $("tallyK").textContent = items.length
    ? (items.length > 1 ? "contributions" : "contribution") + ", de " + plural(nq, "personne")
    : "pour l'instant : soyez le premier";

  const parts = CATS.filter((c) => counts[c.id] > 0);
  $("balanceBar").innerHTML = parts.map((c) =>
    '<span data-cat="' + c.id + '" style="flex-grow:' + counts[c.id] + '" title="' + esc(c.nom + " : " + counts[c.id]) + '"></span>').join("");
  $("balanceBar").setAttribute("aria-label", "Répartition : " + CATS.map((c) => c.nom + " " + counts[c.id]).join(", "));
  $("balanceLegend").innerHTML = CATS.map((c) =>
    '<span data-cat="' + c.id + '"><i class="cat-dot"></i>' + esc(c.nom) + " <b>" + counts[c.id] + "</b></span>").join("");

  if (Buffet.filter !== "tout" && !counts[Buffet.filter]) Buffet.filter = "tout";
  $("buffetFilters").innerHTML = [{ id: "tout", nom: "Tout" }].concat(CATS).map((c) =>
    '<button class="chip" type="button" data-filter="' + c.id + '" aria-pressed="' + (Buffet.filter === c.id) + '"'
      + (c.id !== "tout" ? ' data-cat="' + c.id + '"' : "") + ">"
      + (c.id !== "tout" ? '<i class="cat-dot"></i>' : "")
      + esc(c.nom) + ' <span class="n">' + counts[c.id] + "</span></button>").join("");

  const shown = items.filter((it) => Buffet.filter === "tout" || it.type === Buffet.filter);
  const groups = CATS.map((c) => ({ cat: c, items: shown.filter((it) => it.type === c.id) })).filter((g) => g.items.length);

  document.querySelectorAll("#boued [data-view]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === Buffet.view));
  });
  $("revealAll").hidden = Buffet.view !== "cards" || !items.length;
  $("revealAll").textContent = Buffet.revealAll ? "Cacher les noms" : "Révéler les noms";
  $("revealAll").setAttribute("aria-pressed", String(Buffet.revealAll));

  const cardsEl = $("buffetCards"), listEl = $("buffetList");
  cardsEl.hidden = Buffet.view !== "cards";
  listEl.hidden = Buffet.view !== "list";

  if (!items.length) {
    const empty = '<div class="live-note">' + ICON_INFO + "<div><b>Le buffet est encore vide.</b> Chaque plat ajouté dans un espace apparaîtra ici, sous forme de carte.</div></div>";
    cardsEl.innerHTML = empty;
    listEl.innerHTML = empty;
  } else {
    cardsEl.innerHTML = groups.map((g) =>
      '<div class="wall-group" data-cat="' + g.cat.id + '">'
        + '<h3 class="group-h"><i class="cat-dot"></i>' + esc(g.cat.nom) + ' <span class="n">' + g.items.length + "</span></h3>"
        + '<div class="wall">' + g.items.map(cardHtml).join("") + "</div></div>").join("");
    listEl.innerHTML = '<div class="menu-grid">' + groups.map((g) =>
      '<div data-cat="' + g.cat.id + '">'
        + '<h3 class="group-h"><i class="cat-dot"></i>' + esc(g.cat.nom) + ' <span class="n">' + g.items.length + "</span></h3>"
        + '<ul class="menu">' + g.items.map(menuRowHtml).join("") + "</ul></div>").join("") + "</div>";
  }
  renderFree(items);
};

function cardHtml(it) {
  const flipped = Buffet.revealAll ? !Buffet.flipped[it.key] : !!Buffet.flipped[it.key];
  const label = it.intitule + ", apporté par " + it.qui + (it.note ? " (" + it.note + ")" : "")
    + (it.soir === "30" ? ", pour le 30 décembre" : "") + ". Retourner la carte.";
  return '<button class="fcard' + (flipped ? " is-flipped" : "") + '" type="button" data-k="' + esc(it.key) + '"'
    + ' data-cat="' + it.type + '" aria-pressed="' + flipped + '" aria-label="' + esc(label) + '">'
    + '<span class="fcard-in">'
    +   '<span class="face front">'
    +     '<span class="f-top"><i class="cat-dot"></i>' + esc(CAT[it.type].un)
    +       (it.soir === "30" ? '<span class="f-soir">le 30</span>' : (isNew(it) ? '<span class="f-soir">Nouveau</span>' : ""))
    +     "</span>"
    +     '<span class="f-dish' + (it.intitule.length > 32 ? " long" : "") + '">' + esc(it.intitule) + "</span>"
    +     ICON_TURN
    +   "</span>"
    +   '<span class="face back">'
    +     '<span class="b-lab">Apporté par</span>'
    +     '<span class="b-name">' + esc(it.qui) + "</span>"
    +     (it.note ? '<span class="b-note">' + esc(it.note) + "</span>" : "")
    +     ICON_HERMINE
    +   "</span>"
    + "</span></button>";
}

function menuRowHtml(it) {
  const tags = (it.soir === "30" ? '<span class="tag">pour le 30</span>' : "") + (isNew(it) ? '<span class="tag new">Nouveau</span>' : "");
  return '<li><div class="m-line"><span class="m-dish">' + esc(it.intitule) + "</span>"
    + '<span class="m-lead" aria-hidden="true"></span>'
    + '<span class="m-who">' + esc(it.qui) + "</span></div>"
    + ((it.note || tags) ? '<div class="m-sub">' + tags + esc(it.note) + "</div>" : "")
    + "</li>";
}

function ideaChip(i) {
  const a = auteur();
  const mine = !!i.espace && !!a && i.espace === a.id;
  const canDel = !!i.famille && ((S.acces && i.famille === S.acces.famille) || S.admin);
  const who = i.famille ? (mine ? "votre idée" : "idée de " + i.by) : "";
  const btn = '<button class="idea" type="button" data-idea="' + esc(i.ref) + '"'
    + ' aria-label="' + esc("Réserver « " + i.label + " »" + (who ? ", " + who : "")) + '">'
    + '<span class="plus" aria-hidden="true">+</span>' + esc(i.label)
    + (who ? '<span class="by" aria-hidden="true">' + esc(who) + "</span>" : "")
    + "</button>";
  if (!canDel) return btn;
  return '<span class="idea-pair">' + btn
    + '<button class="idea-x" type="button" data-del-idee="' + esc(i.ref) + '" title="Retirer l\'idée"'
    + ' aria-label="' + esc("Retirer l'idée « " + i.label + " »") + '">×</button></span>';
}

function renderFree(items) {
  const free = freeIdeas(items);
  const rows = ["sale", "sucre", "boisson"].map((cid) => {
    const list = free.filter((i) => i.cat === cid);
    if (!list.length) return "";
    return '<div class="free-row" data-cat="' + cid + '"><span class="lab"><i class="cat-dot"></i> ' + esc(CAT[cid].nom) + "</span>"
      + list.map(ideaChip).join("") + "</div>";
  }).join("");
  $("freeHead").innerHTML = "<h3>Idées encore libres</h3><p>" + (free.length
    ? "Les idées du tableau de " + esc(hote()) + " et celles des invités, que personne n'a encore prises. Touchez une idée pour la réserver dans votre espace, ou proposez la vôtre."
    : "Toutes les idées ont trouvé preneur. Il manque quelque chose&nbsp;? Proposez une idée.") + "</p>";
  $("freeCols").innerHTML = rows;
}

/* ---------- "Proposer une idée": straight to the dish form of the person's space ---------- */
function proposerIdee() {
  const e = espaceVue();
  if (!e) { toast("Choisissez d'abord qui vous êtes"); return; }
  if (G.editing) {   // a modification was under way: start a new dish instead
    G.editing = null;
    $("dishName").value = "";
    $("dishNote").value = "";
    $("dishDup").hidden = true;
    setMsg($("dishMsg"), "");
    renderMyDishes(e);
  }
  G.ideaRef = null;
  if (Buffet.filter !== "tout" && Buffet.filter !== "autre" && CAT[Buffet.filter]) G.dishCat = Buffet.filter;
  renderDishForm();
  checkDup();
  scrollToId("pPlats");
  setTimeout(() => { try { $("dishName").focus({ preventScroll: true }); } catch (err) { /* nothing to do */ } }, 450);
}
async function removeIdea(r) {
  if (r.indexOf("g:") !== 0) return;
  const id = r.slice(2);
  const old = D.idees[id];
  if (!old) return;
  try {
    await del("idees", id);
    toast("Idée « " + old.intitule + " » retirée", { label: "Annuler", fn: () => {
      put("idees", id, sansId(old)).then(() => toast("C'est revenu"), (err) => toast(errText(err)));
    } });
  } catch (err) { toast(errText(err)); }
}

function useIdea(idea) {
  if (!espaceVue()) { toast("Choisissez d'abord qui vous êtes"); return; }
  G.dishCat = idea.cat;
  G.editing = null;
  G.ideaRef = idea.ref || null;
  $("dishName").value = idea.label;
  $("dishNote").value = "";
  renderDishForm();
  checkDup();
  scrollToId("pPlats");
  setTimeout(() => { try { $("dishName").focus({ preventScroll: true }); } catch (e) { /* nothing to do */ } }, 450);
}

/* ---------- the cards' little spontaneous "flip-flip" ---------- */
const Peek = { timer: null, inView: false, seen: false, pausedUntil: 0, last: null };
function peekLater(ms) {
  if (Peek.timer) clearTimeout(Peek.timer);
  Peek.timer = setTimeout(peekNow, ms);
}
function peekNow() {
  if (REDUCED) return;
  if (document.hidden || !Peek.inView || Buffet.view !== "cards" || Buffet.revealAll || Date.now() < Peek.pausedUntil || S.phase !== "site") {
    peekLater(3000);
    return;
  }
  const vh = window.innerHeight || 800;
  const cards = [].slice.call(document.querySelectorAll("#buffetCards .fcard:not(.is-flipped):not(.peek)")).filter((c) => {
    if (c.matches && c.matches(":hover")) return false;
    const r = c.getBoundingClientRect();
    return r.width > 0 && r.top > 40 && r.bottom < vh - 40;
  });
  if (!cards.length) { peekLater(3500); return; }
  const pool = cards.length > 1 ? cards.filter((c) => c.getAttribute("data-k") !== Peek.last) : cards;
  const card = pool[Math.floor(Math.random() * pool.length)];
  Peek.last = card.getAttribute("data-k");
  const done = () => { card.classList.remove("peek"); };
  card.addEventListener("animationend", done, { once: true });
  setTimeout(done, 2400);
  card.classList.add("peek");
  peekLater(6500 + Math.random() * 5500);
}
function wirePeek() {
  const target = $("buffetCards");
  if (!("IntersectionObserver" in window) || REDUCED) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      Peek.inView = en.isIntersecting;
      if (en.isIntersecting && !Peek.seen) { Peek.seen = true; peekLater(1100); }
    });
  }, { threshold: 0.15 });
  io.observe(target);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Peek.seen) peekLater(2000); });
}

function wireBuffet() {
  const sec = $("boued");
  sec.addEventListener("click", (e) => {
    const t = e.target;
    const f = t.closest("[data-filter]");
    if (f) { Buffet.filter = f.getAttribute("data-filter"); Buffet.render(); return; }

    const v = t.closest("[data-view]");
    if (v) {
      Buffet.view = v.getAttribute("data-view");
      lsSet("ig.view", Buffet.view);
      Buffet.render();
      if (Buffet.view === "cards") peekLater(1500);
      return;
    }
    if (t.closest("#revealAll")) {
      Buffet.revealAll = !Buffet.revealAll;
      Buffet.flipped = {};
      Peek.pausedUntil = Date.now() + 8000;
      [].slice.call(document.querySelectorAll("#buffetCards .fcard")).forEach((c, i) => {
        setTimeout(() => {
          c.classList.remove("peek");
          c.classList.toggle("is-flipped", Buffet.revealAll);
          c.setAttribute("aria-pressed", String(Buffet.revealAll));
        }, REDUCED ? 0 : Math.min(i * 40, 900));
      });
      $("revealAll").textContent = Buffet.revealAll ? "Cacher les noms" : "Révéler les noms";
      $("revealAll").setAttribute("aria-pressed", String(Buffet.revealAll));
      return;
    }
    const card = t.closest(".fcard");
    if (card) {
      const k = card.getAttribute("data-k");
      card.classList.remove("peek");
      if (Buffet.flipped[k]) delete Buffet.flipped[k]; else Buffet.flipped[k] = true;
      const on = Buffet.revealAll ? !Buffet.flipped[k] : !!Buffet.flipped[k];
      card.classList.toggle("is-flipped", on);
      card.setAttribute("aria-pressed", String(on));
      Peek.pausedUntil = Date.now() + 9000;
      return;
    }
    const dIdee = t.closest("[data-del-idee]");
    if (dIdee) { removeIdea(dIdee.getAttribute("data-del-idee")); return; }

    if (t.closest("#proposeOpen")) { proposerIdee(); return; }

    const idea = t.closest("[data-idea]");
    if (idea) { const i = findIdea(idea.getAttribute("data-idea")); if (i) useIdea(i); }
  });
}

/* ============================================================
   MY SPACE — one person
   ============================================================ */
/* Nights: each person sleeps 0, 1 or 2 nights at the gîte (see NUITS). Older data (wider dates,
   several periods, from the first import) is read through nuitsDe(): only the nights of the stay
   count, so nobody can show more than 2 nights or 60 €. */
function nuitsDe(e) {
  if (!e || e.dortAilleurs) return [];
  const pris = {};
  (e.sejours || []).forEach((s) => {
    if (!s || !validDate(s.du) || !validDate(s.au)) return;
    NUITS.forEach((nuit) => { if (s.du <= nuit && nuit < s.au) pris[nuit] = true; });
  });
  return NUITS.filter((nuit) => pris[nuit]);
}
function aConfirmerDe(e) { return !!(e && (e.sejours || []).some((s) => s && s.aConfirmer)); }
// One stay per person, rebuilt from their nights: { du, au, aConfirmer, note }
function staysOf(e) {
  const n = nuitsDe(e);
  if (!n.length) return [];
  const note = ((e.sejours || []).filter((s) => s && s.note)[0] || {}).note || "";
  return [{ id: "s1", du: n[0], au: finNuit(n[n.length - 1]), aConfirmer: aConfirmerDe(e), note: note }];
}
function nuiteesOf(e) { return nuitsDe(e).length; }
function montantOf(e) { return e && e.hote ? 0 : Math.min(nuiteesOf(e), NUITS.length) * CONFIG.prixNuit; }

/* Extra nights ("nuits en plus"): stays saved with plus: true, outside the party nights. Only stays
   written on purpose with the extra nights count: older wide dates never turn into extra nights. */
function nuitsPlusDe(e) {
  if (!e || e.dortAilleurs) return [];
  const pris = {};
  (e.sejours || []).forEach((s) => {
    if (!s || !s.plus || !validDate(s.du) || !validDate(s.au)) return;
    PLUS.forEach((nuit) => { if (s.du <= nuit && nuit < s.au) pris[nuit] = true; });
  });
  return PLUS.filter((nuit) => pris[nuit]);
}
function plusRuns(e) { return runsDe(nuitsPlusDe(e)); }
// sleeps at the gîte at some point (party nights or extra nights)
function aDesNuits(e) { return !!e && !e.dortAilleurs && (nuitsDe(e).length > 0 || nuitsPlusDe(e).length > 0); }
// has answered the nights question one way or the other
function reponduNuits(e) { return !!e && (!!e.dortAilleurs || aDesNuits(e)); }

function nuitsTexte(n) {
  if (!n.length) return "aucune nuit";
  if (n.length === 1) return "nuit du " + fmtShort(n[0]);
  return "nuits du " + n.map((nuit) => dayLabel(dparts(nuit).d)).join(" et du ") + " " + MOIS[dparts(n[n.length - 1]).m];
}
// "28 et 29 déc., puis 1er, 2 et 3 janv." (nights of those days)
function joursTexte(nuits) {
  const groupes = [];
  nuits.forEach((nuit) => {
    const p = dparts(nuit), g = groupes[groupes.length - 1];
    if (g && g.m === p.m) g.jours.push(dayLabel(p.d)); else groupes.push({ m: p.m, jours: [dayLabel(p.d)] });
  });
  return groupes.map((g) => listeNoms(g.jours) + " " + MOIS[g.m]).join(", puis ");
}
function plusTexte(nuits) { return nuits.length ? plural(nuits.length, "nuit") + " en plus : " + joursTexte(nuits) : ""; }
function rangeText(e) {
  if (e.dortAilleurs) return "dort ailleurs";
  const n = nuitsDe(e), plus = nuitsPlusDe(e);
  if (!n.length && !plus.length) return "pas encore de dates";
  return (n.length ? nuitsTexte(n) : "pas de nuit pendant la fête") + (plus.length ? " · " + plusTexte(plus) : "")
    + (aConfirmerDe(e) ? " (à confirmer)" : "");
}

// Draft of the nights panel, in the form of the calendar of the first version of the site: periods
// (arrival day -> departure day). Only the nights of 30 and 31 December count (30 € each, 60 € at most);
// the other nights (28 and 29 December, 1 to 4 January) are extra nights, an indication only.
function makeDraft(e) {
  const nuits = (e.dortAilleurs ? [] : nuitsDe(e).concat(nuitsPlusDe(e))).sort();
  const periodes = runsDe(nuits).map((r, i) => ({ id: "s" + (i + 1), du: r.du, au: r.au }));
  if (!periodes.length) periodes.push({ id: "s1", du: null, au: null });
  return { dortAilleurs: !!e.dortAilleurs, sejours: periodes, aConfirmer: aConfirmerDe(e) };
}
// the nights of one period of the calendar that can be slept at the gîte
function periodNights(s) {
  const out = [];
  if (!s || !s.du || !s.au) return out;
  for (let n = dnum(s.du); n < dnum(s.au); n++) {
    const j = dstr(n);
    if (NUITS.indexOf(j) !== -1 || PLUS.indexOf(j) !== -1) out.push(j);
  }
  return out;
}
function draftNights(d) {   // every night of the draft, once, in order
  if (!d || d.dortAilleurs) return [];
  const pris = {};
  d.sejours.forEach((s) => periodNights(s).forEach((j) => { pris[j] = true; }));
  return Object.keys(pris).sort();
}
const payantesDe = (nuits) => nuits.filter((j) => NUITS.indexOf(j) !== -1);   // 30 and 31 December: 30 € each
const enPlusDe = (nuits) => nuits.filter((j) => PLUS.indexOf(j) !== -1);      // the others: extra nights
function draftKey(d) {
  if (!d) return "";
  if (d.dortAilleurs) return "ailleurs";
  return JSON.stringify([draftNights(d), !!d.aConfirmer]);
}
function memesCoches() { return Object.keys(G.memes).filter((id) => G.memes[id] && D.espaces[id]); }
function isDirty(e) {
  if (!G.draft || !e) return false;
  return draftKey(G.draft) !== draftKey(makeDraft(e)) || memesCoches().length > 0;
}

function renderEspace() {
  const st = $("espaceState"), wrap = $("spaceWrap");
  const e = espaceVue();
  if (!e) {
    wrap.hidden = true;
    st.innerHTML = S.admin
      ? '<div class="live-note">' + ICON_INFO + '<div>Vous êtes connecté·e en organisation sans espace personnel. Ouvrez l\'espace d\'une personne depuis le <a href="#orga">tableau de bord</a>.</div></div>'
      : '<div class="live-note">' + ICON_INFO + "<div>Chargement…</div></div>";
    return;
  }
  st.innerHTML = "";
  wrap.hidden = false;
  renderSpace(e);
}

function renderSpace(e) {
  if (G.draftFor !== e.id) {
    G.draft = makeDraft(e);
    G.draftFor = e.id;
    G.draftTouched = false;
    G.editing = null;
    G.memes = {};
    $("profName").value = e.nom || "";
    $("dishName").value = "";
    $("dishNote").value = "";
    $("dishDup").hidden = true;
    ["nightsMsg", "dishMsg", "nameMsg"].forEach((id) => { setMsg($(id), ""); $(id).removeAttribute("data-kind"); });
  } else if (!isDirty(e) && !G.draftTouched) {
    G.draft = makeDraft(e);
  }

  const autre = !!G.moi && G.vue !== G.moi;
  const banner = $("vueBanner");
  if (G.asOrga) {
    banner.hidden = false;
    banner.innerHTML = "<span>Mode organisation&nbsp;: vous modifiez l'espace de <b>" + esc(e.nom) + "</b>.</span>"
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="orga-leave">Revenir au tableau de bord</button>';
  } else if (autre) {
    banner.hidden = false;
    banner.innerHTML = "<span>Vous remplissez l'espace de <b>" + esc(prenomDe(e)) + "</b>.</span>"
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="vue-moi">Revenir à mon espace</button>';
  } else {
    banner.hidden = true;
  }

  $("spAvatar").outerHTML = avatarHtml(e.id, e.nom, "lg").replace('class="avatar lg"', 'class="avatar lg" id="spAvatar"');
  $("spKicker").textContent = (autre || G.asOrga || !G.moi) ? "Espace de" : "Bonjour";
  $("spName").textContent = e.nom || "";
  const sub = [];
  const famNom = e.famille === (S.acces && S.acces.famille) ? S.familleNom : ((D.familles[e.famille] || {}).nom || "");
  if (famNom) sub.push("Famille " + famNom);
  if (e.hote) sub.push("L'hôtesse du séjour");
  if (goelandReussi(e)) sub.push("Agent certifié par le Goéland");
  $("spSub").textContent = sub.join(" · ");
  $("spSwitch").hidden = G.asOrga || familleEspaces().length < 2;

  const fam = familleEspaces(e.famille);
  $("famStrip").hidden = fam.length < 2;
  if (fam.length >= 2) {
    $("famStrip").querySelector(".fam-strip-lab").textContent = e.famille === (S.acces && S.acces.famille) ? "Votre famille" : "Sa famille";
    $("famChips").innerHTML = fam.map((m) => {
      const ok = reponduNuits(m);
      return '<button class="fam-chip" type="button" data-vue="' + esc(m.id) + '" aria-current="' + (m.id === e.id) + '"'
        + ' aria-label="' + esc("Espace de " + m.nom + (ok ? ", nuits indiquées" : ", pas encore de nuits")) + '">'
        + avatarHtml(m.id, m.nom) + esc(prenomDe(m))
        + '<span class="st' + (ok ? " ok" : "") + '" aria-hidden="true">' + (ok ? ICON_CHECK : "") + "</span></button>";
    }).join("");
  }

  const mesApports = Object.values(D.apports).filter((a) => a.espace === e.id);
  const dishes = mesApports.filter((a) => a.type !== "autre");
  const autres = mesApports.filter((a) => a.type === "autre");
  const nightsDone = reponduNuits(e);
  const nbPlus = nuitsPlusDe(e).length;
  const nightsTxt = e.dortAilleurs ? "Aucune nuit au gîte"
    : (nuiteesOf(e) ? plural(nuiteesOf(e), "nuit") + " au gîte" : "Pas de nuit pendant la fête") + (nbPlus ? " · " + nbPlus + " en plus" : "");
  const steps = [
    { href: "#pNuits", done: nightsDone, txt: nightsDone ? nightsTxt : "Les nuits" },
    { href: "#pPlats", done: dishes.length > 0, txt: dishes.length ? plural(dishes.length, "plat") + " au buffet" : "Un plat" },
    { href: "#pAutre", done: autres.length > 0, txt: autres.length ? plural(autres.length, "autre apport") : "Autre (facultatif)" }
  ];
  $("spProgress").innerHTML = steps.map((s) =>
    '<li><a href="' + s.href + '" class="' + (s.done ? "done" : "") + '"><span class="tick">' + ICON_CHECK + "</span>" + esc(s.txt) + "</a></li>").join("");

  renderNuits();
  renderSame(e);
  renderMyDishes(e);
  renderDishForm();
  renderOthers(e);
}

/* ---------- nights: the calendar ---------- */
// Calendar days: from the first extra night (28 December) to the morning after the last one (5 January).
function calDays() {
  const out = [];
  for (let n = dnum(CONFIG.plusDu); n <= dnum(CONFIG.plusAu); n++) out.push(dstr(n));
  return out;
}
const EV_DAYS = (() => {
  const o = {};
  for (let n = dnum(CONFIG.sejourDu); n <= dnum(CONFIG.sejourAu); n++) o[dstr(n)] = true;
  return o;
})();
// a night is counted (30 €, "paid") or extra ("xtra": an indication only)
function nuitType(nuit) { return NUITS.indexOf(nuit) !== -1 ? "paid" : "xtra"; }

function periodHtml(s, i, total) {
  const du = s.du ? dnum(s.du) : null, au = s.au ? dnum(s.au) : null;
  const days = calDays();
  const lead = (dparts(days[0]).w + 6) % 7;   // empty cells before the first day: the week starts on Monday
  const grid = '<span class="cal-blank" aria-hidden="true"></span>'.repeat(lead) + days.map((day, k) => {
    const n = dnum(day), p = dparts(day), col = (k + lead) % 7;
    const cls = ["cal-day"];
    if (col === 0) cls.push("wk-start");
    if (col === 6) cls.push("wk-end");
    if (du !== null && au !== null) {
      if (n === du) cls.push("start", nuitType(day));
      else if (n === au) cls.push("end", nuitType(dstr(n - 1)));
      else if (n > du && n < au) cls.push("in", nuitType(day));
    } else if (du !== null && n === du) {
      cls.push("solo", nuitType(day));
    }
    const mo = (k === 0 || p.d === 1) ? '<span class="mo">' + MOIS[p.m] + "</span>" : "";
    const lab = JOURS[p.w] + " " + dayLabel(p.d) + " " + MOIS[p.m]
      + (n === du ? ", arrivée" : "") + (n === au ? ", départ" : "") + (EV_DAYS[day] ? ", jour de la fête" : "");
    return '<button type="button" class="' + cls.join(" ") + '" data-act="day" data-p="' + i + '" data-d="' + day + '"'
      + ' aria-label="' + esc(lab) + '" aria-pressed="' + (n === du || n === au) + '">'
      + mo + '<span class="dn">' + p.d + "</span>" + (EV_DAYS[day] ? '<span class="ev"></span>' : "") + "</button>";
  }).join("");

  const help = !s.du ? "Touchez le jour d'arrivée." : (!s.au ? "Touchez maintenant le jour de départ." : "Pour changer, touchez un nouveau jour d'arrivée.");
  const nuits = periodNights(s), paid = payantesDe(nuits), plus = enPlusDe(nuits);
  const avecExtras = enPlusDe(draftNights(G.draft)).length > 0;   // the legend of the extra nights only shows when some are chosen
  const sum = (s.du && s.au)
    ? "<b>" + plural(nuits.length, "nuit") + '</b><span class="muted">arrivée ' + fmtDay(s.du) + " · départ " + fmtDay(s.au) + "</span>"
      + '<span class="split">'
      + (paid.length ? '<span class="tag paid">' + plural(paid.length, "nuit") + " à " + CONFIG.prixNuit + " €</span>" : "")
      + (plus.length ? '<span class="tag xtra">+ ' + plural(plus.length, "nuit") + " en plus, non organisée" + (plus.length > 1 ? "s" : "") + " par " + esc(hote()) + "</span>" : "")
      + "</span>"
    : (s.du ? '<span class="muted">Arrivée ' + fmtDay(s.du) + " · départ à choisir</span>" : '<span class="muted">Aucune date choisie</span>');

  return '<div class="period" data-p="' + i + '">'
    + (total > 1 ? '<div class="period-hd"><span class="lab">Période ' + (i + 1) + "</span>"
      + '<button type="button" class="icon-btn danger" data-act="del-period" data-p="' + i + '">Retirer cette période</button></div>' : "")
    + '<div class="cal">'
    +   '<p class="cal-help">' + help + "</p>"
    +   '<div class="cal-head" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>'
    +   '<div class="cal-grid" role="group" aria-label="Calendrier, du 28 décembre au 5 janvier">' + grid + "</div>"
    +   '<div class="cal-legend">'
    +     '<span><i></i>Jours de la fête, du 30 décembre au 1er janvier</span>'
    +     '<span><i class="sw paid"></i>Nuit à ' + CONFIG.prixNuit + " €</span>"
    +     (avecExtras ? '<span><i class="sw xtra"></i>Nuit en plus, non organisée par ' + esc(hote()) + "</span>" : "")
    +   "</div>"
    + "</div>"
    + '<div class="period-sum">' + sum + "</div>"
    + "</div>";
}

function renderNuits() {
  const d = G.draft;
  const e = espaceVue();
  if (!d || !e) return;
  $("nuitsMode").querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-pressed", String((b.getAttribute("data-v") === "ailleurs") === !!d.dortAilleurs));
  });
  const autre = G.vue !== G.moi;
  $("nuitsMode").querySelector('[data-v="gite"]').textContent = autre ? "Dort au gîte" : "Je dors au gîte";
  $("nuitsMode").querySelector('[data-v="ailleurs"]').textContent = autre ? "Dort ailleurs" : "Je dors ailleurs";
  const host = $("periods");
  if (d.dortAilleurs) {
    host.innerHTML = '<p class="hint" style="margin-top:1rem">' + (autre ? esc(prenomDe(e)) + " vient" : "Vous venez") + " sans dormir au gîte. Vous pouvez changer d'avis à tout moment.</p>";
  } else {
    host.innerHTML = d.sejours.map((s, i) => periodHtml(s, i, d.sejours.length)).join("")
      + '<div class="period-tools"><label class="check"><input type="checkbox" data-act="tent"' + (d.aConfirmer ? " checked" : "")
      + "> Dates encore à confirmer</label></div>";
  }

  // Money: only the nights of 30 and 31 December, 30 € each, 60 € at most. The extra nights are listed apart.
  const nuits = draftNights(d), paid = payantesDe(nuits), plus = enPlusDe(nuits);
  let cout = "";
  if (!d.dortAilleurs) {
    if (!e.hote) {
      cout += paid.length
        ? '<div class="cost"><span>Participation hébergement</span><b>' + euros(paid.length * CONFIG.prixNuit) + "</b><span>" + plural(paid.length, "nuit") + " × " + CONFIG.prixNuit + " €</span></div>"
        : '<div class="cost"><span>' + (plus.length
            ? "Aucune participation : ces nuits ne sont pas facturées."
            : "Participation hébergement&nbsp;: " + CONFIG.prixNuit + "&nbsp;€ par nuit et par personne, " + (NUITS.length * CONFIG.prixNuit) + "&nbsp;€ au plus.") + "</span></div>";
    }
    if (plus.length) {
      cout += '<div class="cost-plus"><b>' + plural(plus.length, "nuit") + " en plus</b><span>" + esc(joursTexte(plus)) + " · en extra non organisé par " + esc(hote()) + "</span></div>";
    }
  }
  $("nightsCost").innerHTML = cout;

  const dirty = isDirty(e);
  $("resetNights").hidden = !dirty;
  const saved = reponduNuits(e);
  const btn = $("saveNights");
  $("nightsActions").classList.toggle("is-dirty", dirty);
  btn.disabled = !dirty && saved;
  btn.className = "btn " + (dirty ? "btn-save" : (saved ? "btn-saved" : "btn-ghost"));
  btn.innerHTML = (!dirty && saved) ? ICON_CHECK + " Nuits enregistrées" : "Enregistrer les nuits";
  const msg = $("nightsMsg");
  if (dirty && msg.getAttribute("data-kind") !== "err") {
    msg.className = "dirty";
    msg.textContent = "Modifications non enregistrées";
    msg.setAttribute("data-kind", "dirty");
  } else if (!dirty && msg.getAttribute("data-kind") === "dirty") {
    setMsg(msg, "");
    msg.removeAttribute("data-kind");
  }
}

function renderSame(e) {
  const others = familleEspaces(e.famille).filter((m) => m.id !== e.id);
  $("sameBox").hidden = !others.length;
  if (!others.length) return;
  $("sameList").innerHTML = others.map((m) =>
    '<label class="same-opt"><input type="checkbox" data-same="' + esc(m.id) + '"' + (G.memes[m.id] ? " checked" : "") + ">"
      + esc(prenomDe(m)) + " <small>" + esc(rangeText(m)) + "</small></label>").join("");
}

function pickDay(i, day) {
  const s = G.draft.sejours[i];
  if (!s) return;
  let note = "";
  if (!s.du || (s.du && s.au)) {
    if (day === CONFIG.plusAu) note = "Le " + fmtShort(day) + " ne peut être que le jour de départ.";   // no night starts on the last day
    else { s.du = day; s.au = null; }
  } else if (dnum(day) > dnum(s.du)) { s.au = day; }
  else { s.du = day; }
  G.draftTouched = true;
  renderNuits();
  const btn = document.querySelector('.cal-day[data-p="' + i + '"][data-d="' + day + '"]');
  if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { /* nothing to do */ } }
  if (note) {
    const help = document.querySelector('.period[data-p="' + i + '"] .cal-help');
    if (help) help.textContent = note;
  }
}

async function saveNights() {
  const e = espaceVue();
  const d = G.draft;
  const msg = $("nightsMsg");
  msg.removeAttribute("data-kind");
  if (!e || !d) return;
  if (!d.dortAilleurs) {
    const used = d.sejours.filter((s, i) => i === 0 || s.du || s.au);
    for (let i = 0; i < used.length; i++) {
      const s = used[i], where = used.length > 1 ? " (période " + (i + 1) + ")" : "";
      if (!s.du || !s.au) {
        setMsg(msg, "Choisissez le jour d'arrivée et le jour de départ" + where + ".", true);
        msg.setAttribute("data-kind", "err");
        return;
      }
    }
  }
  // Written: the nights of 30 and 31 December as one stay (the only ones that count), then one stay flagged
  // plus: true per run of extra nights, an indication for the organizers, never counted or charged.
  // The import note ("départ non indiqué…") no longer applies once dates are chosen.
  const nuits = draftNights(d), paid = payantesDe(nuits), plus = enPlusDe(nuits);
  const sejours = paid.length ? [{ id: "s1", du: paid[0], au: finNuit(paid[paid.length - 1]), aConfirmer: !!d.aConfirmer, note: "" }] : [];
  runsDe(plus).forEach((r, i) => sejours.push({ id: "p" + (i + 1), du: r.du, au: r.au, aConfirmer: !!d.aConfirmer, note: "", plus: true }));
  const cibles = [e.id].concat(memesCoches().filter((id) => id !== e.id));
  const dortAilleurs = !!d.dortAilleurs;
  setMsg(msg, "Enregistrement…");
  try {
    await Promise.all(cibles.map((id) => upd("espaces", id, {
      sejours: sejours.map((s) => Object.assign({}, s)), dortAilleurs: dortAilleurs, maj: nowIso()
    })));
    const noms = listeNoms(cibles.map((id) => prenomDe(D.espaces[id])));
    G.draftTouched = false;
    G.draftFor = null;
    G.memes = {};
    renderEspace();
    setMsg($("nightsMsg"), "Enregistré. " + hoteCap() + " voit les dates.");
    toast(dortAilleurs
      ? "C'est noté : " + noms + (cibles.length > 1 ? " dorment ailleurs." : " dort ailleurs.")
      : "Nuits enregistrées pour " + noms);
  } catch (err) {
    setMsg($("nightsMsg"), errText(err), true);
    $("nightsMsg").setAttribute("data-kind", "err");
  }
}

/* ---------- dishes ---------- */
function renderMyDishes(e) {
  const dishes = Object.values(D.apports).filter((a) => a.espace === e.id && a.type !== "autre")
    .sort((a, b) => String(a.cree).localeCompare(String(b.cree)));
  const el = $("myDishes");
  if (!dishes.length) {
    el.innerHTML = '<li style="border-style:dashed;background:none"><span class="t"><small>Rien pour l\'instant. Ajoutez un plat ci-dessous, ou piochez dans les idées encore libres.</small></span></li>';
    return;
  }
  el.innerHTML = dishes.map((a) => {
    const c = CAT[a.type] || CAT.sale;
    const meta = [c.un, a.soir === "30" ? "soirée du 30" : "réveillon du 31"];
    if (a.note) meta.push(a.note);
    return '<li data-cat="' + c.id + '"' + (G.editing === a.id ? ' class="editing"' : "") + ">"
      + '<i class="cat-dot"></i>'
      + '<span class="t"><b>' + esc(a.intitule) + "</b><small>" + esc(meta.join(" · ")) + "</small></span>"
      + '<span class="acts">'
      +   '<button type="button" class="icon-btn" data-act="edit-item" data-id="' + esc(a.id) + '">Modifier</button>'
      +   '<button type="button" class="icon-btn danger" data-act="del-item" data-id="' + esc(a.id) + '" aria-label="Retirer ' + esc(a.intitule) + '">Retirer</button>'
      + "</span></li>";
  }).join("");
}

function renderDishForm() {
  $("dishCats").innerHTML = CATS.filter((c) => c.id !== "autre").map((c) =>
    '<button type="button" data-act="dish-cat" data-v="' + c.id + '" aria-pressed="' + (G.dishCat === c.id) + '">' + c.icon + esc(c.un) + "</button>").join("");
  $("dishSoir").querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === G.dishSoir));
  });
  $("dishSubmit").textContent = G.editing ? "Enregistrer la modification" : "Ajouter au buffet";
  $("dishCancel").hidden = !G.editing;
  let free = freeIdeas(allItems()).filter((i) => i.cat === G.dishCat);
  free = free.filter((i) => !!i.famille).reverse().concat(free.filter((i) => !i.famille)).slice(0, 6);
  $("dishIdeas").innerHTML = free.length
    ? '<span class="tiny" style="align-self:center;margin-right:.2rem">Encore libres&nbsp;:</span>' + free.map((i) =>
      '<button type="button" class="idea" data-act="pick-idea" data-idea="' + esc(i.ref) + '">' + esc(i.label) + "</button>").join("")
    : "";
  syncDishBtn();
}

/* The confirmation buttons glow (like "Enregistrer les nuits") as soon as there is something to confirm. */
function dishDirty() {
  const name = cleanName($("dishName").value);
  if (name.length < 2) return false;
  if (!G.editing) return true;
  const it = D.apports[G.editing];
  if (!it) return true;
  const cat = CAT[it.type] && it.type !== "autre" ? it.type : "sale";
  return name !== cleanName(it.intitule) || cleanName($("dishNote").value) !== cleanName(it.note)
    || G.dishCat !== cat || G.dishSoir !== (it.soir === "30" ? "30" : "31");
}
function syncDishBtn() { $("dishSubmit").classList.toggle("btn-glow", dishDirty()); }
function syncOtherBtn() { $("otherSubmit").classList.toggle("btn-glow", cleanName($("otherName").value).length >= 2); }

function checkDup() {
  const val = norm($("dishName").value);
  const el = $("dishDup");
  if (val.length < 3) { el.hidden = true; return; }
  const hits = allItems().filter((it) => {
    if (it.type !== G.dishCat) return false;
    if (G.editing && it.id === G.editing) return false;
    const t = norm(it.intitule);
    if (t === val || (val.length >= 4 && (t.indexOf(val) !== -1 || val.indexOf(t) !== -1))) return true;
    return IDEAS.some((idea) => idea.cat === it.type && ideaMatches(idea, val) && ideaMatches(idea, it.intitule));
  }).slice(0, 3);
  if (!hits.length) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = "Déjà prévu : " + hits.map((h) => h.intitule + " (" + h.qui + ")").join(", ") + ". Rien n'empêche d'en apporter aussi.";
}

async function submitDish(ev) {
  ev.preventDefault();
  const e = espaceVue();
  const msg = $("dishMsg");
  if (!e) return;
  const name = cleanName($("dishName").value);
  const note = cleanName($("dishNote").value);
  if (name.length < 2) { setMsg(msg, "Indiquez le plat.", true); $("dishName").focus(); return; }
  const editing = G.editing;
  const champs = { type: G.dishCat, intitule: name, soir: G.dishSoir, note: note, maj: nowIso() };
  setMsg(msg, "Enregistrement…");
  try {
    if (editing) {
      await upd("apports", editing, champs);
    } else {
      await F.setDoc(newRef("apports"), Object.assign({
        espace: e.id, famille: e.famille, qui: e.nom, idee: G.ideaRef || "", cree: nowIso()
      }, champs));
    }
    $("dishName").value = "";
    $("dishNote").value = "";
    $("dishDup").hidden = true;
    G.editing = null;
    G.ideaRef = null;
    setMsg(msg, editing ? "Modifié." : "Ajouté au buffet.");
    toast(editing ? "Plat modifié" : "« " + name + " » ajouté au buffet");
    renderEspace();
  } catch (err) { setMsg(msg, errText(err), true); }
}

async function removeItem(id) {
  const old = D.apports[id];
  if (!old) return;
  try {
    await del("apports", id);
    if (G.editing === id) { G.editing = null; $("dishName").value = ""; $("dishNote").value = ""; }
    renderEspace();
    toast("« " + old.intitule + " » retiré", { label: "Annuler", fn: () => {
      put("apports", id, sansId(old)).then(() => toast("C'est revenu"), (err) => toast(errText(err)));
    } });
  } catch (err) { toast(errText(err)); }
}

function startEdit(id) {
  const it = D.apports[id];
  if (!it) return;
  G.editing = id;
  G.ideaRef = null;
  G.dishCat = CAT[it.type] && it.type !== "autre" ? it.type : "sale";
  G.dishSoir = it.soir === "30" ? "30" : "31";
  $("dishName").value = it.intitule || "";
  $("dishNote").value = it.note || "";
  setMsg($("dishMsg"), "");
  const e = espaceVue();
  if (e) renderMyDishes(e);
  renderDishForm();
  checkDup();
  try { $("dishName").focus(); } catch (err) { /* nothing to do */ }
}

/* ---------- other contributions ---------- */
function renderOthers(e) {
  const autres = Object.values(D.apports).filter((a) => a.espace === e.id && a.type === "autre");
  $("myOthers").innerHTML = autres.length
    ? autres.map((a) => '<span class="pchip">' + esc(a.intitule) + (a.note ? ' <span class="tiny">· ' + esc(a.note) + "</span>" : "")
        + '<button type="button" data-act="del-item" data-id="' + esc(a.id) + '" aria-label="Retirer ' + esc(a.intitule) + '">×</button></span>').join("")
    : '<p class="empty-line" style="margin:0">Rien d\'autre pour l\'instant.</p>';
  syncOtherBtn();
}

async function submitOther(ev) {
  ev.preventDefault();
  const e = espaceVue();
  const inp = $("otherName");
  const name = cleanName(inp.value);
  if (!e || name.length < 2) { inp.focus(); return; }
  try {
    await F.setDoc(newRef("apports"), {
      espace: e.id, famille: e.famille, qui: e.nom, type: "autre", intitule: name,
      soir: "", note: "", idee: "", cree: nowIso(), maj: nowIso()
    });
    inp.value = "";
    syncOtherBtn();
    toast("« " + name + " » ajouté");
  } catch (err) { toast(errText(err)); }
}

/* ---------- display name ---------- */
async function submitName(ev) {
  ev.preventDefault();
  const e = espaceVue();
  const nom = cleanName($("profName").value);
  const msg = $("nameMsg");
  if (!e) return;
  if (nom.length < 2) { setMsg(msg, "Le nom affiché ne peut pas être vide.", true); return; }
  if (nom === e.nom) { setMsg(msg, "C'est déjà le nom affiché."); return; }
  setMsg(msg, "Enregistrement…");
  try {
    await upd("espaces", e.id, { nom: nom, maj: nowIso() });
    const siens = Object.values(D.apports).filter((a) => a.espace === e.id && a.qui !== nom);
    for (const a of siens) await upd("apports", a.id, { qui: nom, maj: nowIso() });
    setMsg(msg, "Nom affiché mis à jour.");
  } catch (err) { setMsg(msg, errText(err), true); }
}

function ouvrirVue(pid, depuisOrga) {
  if (!D.espaces[pid]) return;
  // opening the targeted guest's space from a relative's space goes through the Goéland check too
  if (!GOELAND.force && pid !== G.moi && goelandVise(pid)) { lancerGoeland(pid, () => ouvrirVue(pid, depuisOrga)); return; }
  G.vue = pid;
  if (depuisOrga) G.asOrga = true;
  G.draftFor = null;
  G.editing = null;
  G.ideaRef = null;
  renderEspace();
  refreshFree();
  scrollToId("espace");
}

function refreshFree() { if (D.ready.app) renderFree(allItems()); }

function wireEspace() {
  const sec = $("espace");
  $("dishForm").addEventListener("submit", submitDish);
  $("otherForm").addEventListener("submit", submitOther);
  $("nameForm").addEventListener("submit", submitName);
  $("dishName").addEventListener("input", function () {
    if (!this.value.trim()) G.ideaRef = null;
    checkDup();
    syncDishBtn();
  });
  $("dishNote").addEventListener("input", syncDishBtn);
  $("otherName").addEventListener("input", syncOtherBtn);
  sec.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.getAttribute("data-act") === "tent" && G.draft) {
      G.draft.aConfirmer = !!t.checked;
      G.draftTouched = true;
      renderNuits();
    }
    if (t.hasAttribute("data-same")) {
      G.memes[t.getAttribute("data-same")] = !!t.checked;
      renderNuits();
    }
  });
  sec.addEventListener("click", (ev) => {
    const chip = ev.target.closest("[data-vue]");
    if (chip) { ouvrirVue(chip.getAttribute("data-vue"), G.asOrga); return; }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const act = b.getAttribute("data-act");
    const d = G.draft;
    switch (act) {
      case "mode":   // sleeps at the gîte, or elsewhere
        if (!d) break;
        d.dortAilleurs = b.getAttribute("data-v") === "ailleurs";
        G.draftTouched = true;
        if ($("nightsMsg").getAttribute("data-kind") === "err") { setMsg($("nightsMsg"), ""); $("nightsMsg").removeAttribute("data-kind"); }
        renderNuits();
        break;
      case "day": pickDay(+b.getAttribute("data-p") || 0, b.getAttribute("data-d")); break;
      case "del-period":   // only offered when older data holds several separate stays; none can be added any more
        if (d && d.sejours.length > 1) { d.sejours.splice(+b.getAttribute("data-p") || 0, 1); G.draftTouched = true; renderNuits(); }
        break;
      case "save-nights": saveNights(); break;
      case "reset-nights":
        G.draftFor = null;
        G.draftTouched = false;
        G.memes = {};
        $("nightsMsg").removeAttribute("data-kind");
        setMsg($("nightsMsg"), "");
        renderEspace();
        break;
      case "dish-cat": G.dishCat = b.getAttribute("data-v"); G.ideaRef = null; renderDishForm(); checkDup(); break;
      case "dish-soir": G.dishSoir = b.getAttribute("data-v"); renderDishForm(); break;
      case "pick-idea": {
        const idea = findIdea(b.getAttribute("data-idea"));
        if (idea) { $("dishName").value = idea.label; G.ideaRef = idea.ref; checkDup(); syncDishBtn(); try { $("dishName").focus(); } catch (err) { /* nothing to do */ } }
        break;
      }
      case "dish-cancel": {
        G.editing = null; G.ideaRef = null;
        $("dishName").value = ""; $("dishNote").value = ""; $("dishDup").hidden = true;
        setMsg($("dishMsg"), "");
        const e = espaceVue();
        if (e) renderMyDishes(e);
        renderDishForm();
        break;
      }
      case "edit-item": startEdit(b.getAttribute("data-id")); break;
      case "del-item": removeItem(b.getAttribute("data-id")); break;
      case "vue-moi": ouvrirVue(G.moi, false); break;
      case "orga-leave":
        G.asOrga = false;
        G.vue = G.moi;
        G.draftFor = null;
        renderEspace();
        refreshFree();
        scrollToId("orga");
        break;
      default: break;
    }
  });
}

/* ============================================================
   ORGANIZERS — dashboard
   ============================================================ */
const Orga = { sort: "arrivee", sel: null, confirm: null, open: {}, importData: null, famDiffere: false };

function updateOrgaUi() {
  $("navOrga").hidden = !S.admin;
  $("orga").hidden = !(S.admin || S.orgaVisible);
  $("orgaGate").hidden = S.admin;
  $("orgaBody").hidden = !S.admin;
  if (S.admin) $("orgaWho").innerHTML = "Connecté·e en organisation avec <b>" + esc(S.email || "") + "</b>.";
}

function allStays() {
  const rows = [];
  Object.values(D.espaces).forEach((e) => {
    staysOf(e).forEach((s, i) => rows.push({ e: e, s: s, key: e.id + "|" + (s.id || i) }));
  });
  return rows;
}
function occupancy(rows, lo, hi) {
  const occ = [];
  for (let n = lo; n <= hi; n++) {
    let c = 0;
    rows.forEach((r) => { if (r.s && dnum(r.s.du) <= n && n < dnum(r.s.au)) c += 1; });
    occ.push(c);
  }
  return occ;
}
// People sleeping on an extra night (indication only), night by night
function occupancyPlus(rows, lo, hi) {
  const occ = [];
  for (let n = lo; n <= hi; n++) {
    let c = 0;
    rows.forEach((r) => { if (r.plus && r.plus.some((x) => dnum(x.du) <= n && n < dnum(x.au))) c += 1; });
    occ.push(c);
  }
  return occ;
}
// One row per person who sleeps at the gîte at some point: the party nights (s, or null) and the extra nights (plus runs)
function allRows() {
  const rows = [];
  Object.values(D.espaces).forEach((e) => {
    const s = staysOf(e)[0] || null, plus = plusRuns(e);
    if (s || plus.length) rows.push({ e: e, s: s, plus: plus, key: e.id });
  });
  return rows;
}
function rowFirst(r) { return Math.min(r.s ? dnum(r.s.du) : Infinity, r.plus.length ? dnum(r.plus[0].du) : Infinity); }
function rowLast(r) { return Math.max(r.s ? dnum(r.s.au) : -Infinity, r.plus.length ? dnum(r.plus[r.plus.length - 1].au) : -Infinity); }
function nomFamille(fid) { return (D.familles[fid] && D.familles[fid].nom) || fid || ""; }

Orga.render = function () {
  if (!S.admin || S.phase !== "site") return;
  const st = $("orgaState");
  if (!D.ready.esp) {
    st.innerHTML = '<div class="live-note">' + ICON_INFO + "<div>Chargement…</div></div>";
    return;
  }
  st.innerHTML = D.status === "error"
    ? '<div class="live-note warn">' + ICON_INFO + "<div><b>La base ne répond plus.</b> Rechargez la page.</div></div>"
    : "";
  renderTiles();
  renderTimeline();
  renderPending();
  renderDemandes();
  renderFamilles();
};

function renderTiles() {
  const people = Object.values(D.espaces);
  let attendus = 0, ailleurs = 0, sans = 0, nuitees = 0, du = 0, recu = 0, payants = 0, regles = 0, vus = 0, resteEnPlus = 0, nuitsEnPlus = 0;
  people.forEach((e) => {
    if (e.dortAilleurs) ailleurs++;
    else if (!aDesNuits(e)) sans++;
    else attendus++;
    nuitees += nuiteesOf(e);
    const np = nuitsPlusDe(e).length;   // extra nights: counted apart, never in the nights or the money
    if (np) { resteEnPlus++; nuitsEnPlus += np; }
    const m = montantOf(e);
    du += m;
    if (m > 0) { payants++; if (e.regle) { regles++; recu += m; } }
    if (e.vu) vus++;
  });
  const n31 = dnum("2026-12-31"), n30 = dnum(NUITS[0]);
  const reveillon = occupancy(allStays(), n31, n31)[0];
  const veille = n30 < n31 ? occupancy(allStays(), n30, n30)[0] : 0;
  const tiles = [
    { lead: true, k: "Nuit du réveillon", v: reveillon, s: plural(reveillon, "personne") + " au gîte la nuit du 31 · " + veille + " la nuit du 30" },
    { k: "Personnes attendues", v: attendus, s: (ailleurs ? plural(ailleurs, "personne dort", "personnes dorment") + " ailleurs · " : "") + sans + " sans dates" },
    { k: "Nuitées", v: nuitees, s: euros(du) + " de participation" },
    { k: "Participations réglées", v: regles + " / " + payants, s: euros(recu) + " reçus sur " + euros(du) },
    { k: "Espaces ouverts", v: vus + " / " + people.length, s: "personnes déjà venues sur le site" },
    { wide: true, plus: true, k: "Restent en plus", v: resteEnPlus, s: resteEnPlus ? plural(nuitsEnPlus, "nuit") + " en plus, non facturées" : "Personne pour l'instant · nuits non facturées" }
  ];
  $("orgaTiles").innerHTML = tiles.map((t) =>
    '<div class="otile' + (t.lead ? " lead" : "") + (t.wide ? " wide" : "") + (t.plus ? " plus" : "") + '"><div class="k">' + esc(t.k) + '</div><div class="v">' + esc(String(t.v)) + '</div><div class="s">' + esc(t.s) + "</div></div>").join("");
}

function renderTimeline() {
  const rows = allRows();
  const tl = $("tl");
  $("tlSort").querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === Orga.sort));
  });
  if (!rows.length) {
    tl.innerHTML = '<div class="tl-empty">Personne n\'a encore indiqué ses nuits.</div>';
    $("tlDetail").hidden = true;
    return;
  }
  if (Orga.sort === "nom") {
    rows.sort((a, b) => byNom(a.e, b.e) || rowFirst(a) - rowFirst(b));
  } else {
    rows.sort((a, b) => rowFirst(a) - rowFirst(b) || rowLast(b) - rowLast(a) || byNom(a.e, b.e));
  }
  // One column per DAY, from the first night to the morning after the last one (30, 31 Dec, 1 Jan), and
  // wider when somebody stays on before or after the party (extra nights, up to 28 Dec and 5 Jan).
  // A stay is a bar from its arrival day to its departure day: 1 night covers 2 days, 2 nights cover 3.
  let lo = dnum(NUITS[0]), hi = dnum(CONFIG.sejourAu);
  rows.forEach((r) => r.plus.forEach((x) => { lo = Math.min(lo, dnum(x.du)); hi = Math.max(hi, dnum(x.au)); }));
  const narrow = (window.innerWidth || 1000) < 640;
  let COL = narrow ? 50 : 60;
  const NAME = narrow ? 136 : 200;
  const N = hi - lo + 1;
  const avail = $("tlScroll").clientWidth || 0;
  if (avail > NAME + N * COL) COL = N <= 3 ? Math.floor((avail - NAME - 2) / N) : Math.min(112, Math.floor((avail - NAME - 2) / N));
  const W = N * COL;
  const ev0 = dnum(CONFIG.sejourDu) - lo, evN = dnum(CONFIG.sejourAu) - dnum(CONFIG.sejourDu) + 1;   // the party days
  const evBand = '<div class="tl-evband" style="left:' + (ev0 * COL) + "px;width:" + (evN * COL) + 'px"></div>';
  const occ = occupancy(rows, lo, hi - 1);   // people per night: the last day has no night of its own
  const occX = occupancyPlus(rows, lo, hi - 1);   // extra nights only fall outside the party nights
  const tot = occ.map((c, j) => c + occX[j]);
  const max = Math.max.apply(null, tot);

  let head = '<div class="tl-row head"><div class="tl-name">Jour</div><div class="tl-track" style="width:' + W + 'px">' + evBand;
  for (let j = 0; j < N; j++) {
    const day = dstr(lo + j), p = dparts(day);
    const isEv = j >= ev0 && j < ev0 + evN;
    head += '<div class="tl-day' + (isEv ? " ev" : "") + '" style="left:' + (j * COL) + "px;width:" + COL + 'px">'
      + '<span class="w">' + JOURS[p.w] + '</span><span class="d">' + dayLabel(p.d) + "</span>"
      + (day === "2026-12-31" ? '<span class="rv">réveillon</span>' : '<span class="m">' + MOIS[p.m] + "</span>")
      + "</div>";
  }
  head += "</div></div>";

  // a bar runs from the arrival day to the departure day: (nights + 1) day columns
  const bar = (du, n, lab, cls) => '<div class="' + cls + '" style="left:' + ((du - lo) * COL + 3) + "px;width:" + ((n + 1) * COL - 6) + 'px">' + esc(lab) + "</div>";
  const body = rows.map((r) => {
    const s = r.s, tent = aConfirmerDe(r.e);
    const dual = !!(s && r.plus.length);   // party nights and extra nights: two lanes, so the bars never overlap
    let bars = "";
    const aria = [r.e.nom];
    if (s) {
      const n = nights(s);
      bars += bar(dnum(s.du), n, plural(n, "nuit"), "tl-bar" + (tent ? " tent" : "") + (dual ? " l1" : ""));
      aria.push("arrivée " + fmtDay(s.du) + ", départ " + fmtDay(s.au) + ", " + plural(n, "nuit"));
    }
    r.plus.forEach((x) => { bars += bar(dnum(x.du), x.n, "+ " + plural(x.n, "nuit"), "tl-bar plus" + (tent ? " tent" : "") + (dual ? " l2" : "")); });
    if (r.plus.length) aria.push(plusTexte(nuitsPlusDe(r.e)) + ", sans participation");
    if (tent) aria.push("à confirmer");
    return '<div class="tl-row data' + (dual ? " dual" : "") + (Orga.sel === r.key ? " sel" : "") + '" data-row="' + esc(r.key) + '" tabindex="0" role="button" aria-label="' + esc(aria.join(", ")) + '">'
      + '<div class="tl-name"><b>' + esc(r.e.nom) + "</b>" + (norm(nomFamille(r.e.famille)) !== norm(nomDeFamilleDe(r.e)) ? "<small>Famille " + esc(nomFamille(r.e.famille)) + "</small>" : "") + "</div>"
      + '<div class="tl-track" style="width:' + W + 'px">' + evBand + bars
      + "</div></div>";
  }).join("");

  let foot = '<div class="tl-row foot"><div class="tl-name">Personnes<br>la nuit du</div><div class="tl-track" style="width:' + W + 'px">' + evBand;
  tot.forEach((c, j) => {
    const horsFete = occX[j] > 0 || NUITS.indexOf(dstr(lo + j)) === -1;   // an extra night: counted apart, in another colour
    const h = max ? Math.max(c ? 3 : 0, Math.round(c / max * 44)) : 0;
    foot += '<div class="tl-count' + (horsFete ? " plus" : "") + (c === max && c && !horsFete ? " peak" : "") + (c ? "" : " zero") + '" style="left:' + (j * COL) + "px;width:" + COL + 'px"'
      + (horsFete && c ? ' title="' + esc(plural(c, "personne") + " en plus cette nuit-là, sans participation") + '"' : "") + ">"
      + '<i style="height:' + h + 'px"></i><b>' + c + "</b></div>";
  });
  foot += "</div></div>";

  tl.style.setProperty("--tl-col", COL + "px");
  tl.style.setProperty("--tl-name", NAME + "px");
  tl.innerHTML = head + body + foot;
  renderDetail(rows);
}

function renderDetail(rows) {
  const el = $("tlDetail");
  const r = (rows || allRows()).filter((x) => x.key === Orga.sel)[0];
  if (!r) { el.hidden = true; Orga.sel = null; return; }
  const s = r.s;
  const tent = aConfirmerDe(r.e) ? ' · <b style="color:var(--soleil)">à confirmer</b>' : "";
  let lignes;
  if (s) {
    const n = nights(s);
    const m = r.e.hote ? "" : " · participation " + euros(n * CONFIG.prixNuit) + (r.e.regle ? " (réglée)" : "");
    lignes = "<p>Arrivée " + fmtDay(s.du) + " · départ " + fmtDay(s.au) + " · " + plural(n, "nuit") + esc(m) + tent + "</p>"
      + (s.note ? "<p>" + esc(s.note) + "</p>" : "");
  } else {
    lignes = "<p>Pas de nuit pendant la fête (aucune participation)" + tent + "</p>";
  }
  if (r.plus.length) lignes += '<p><span class="plus-tag">sans participation</span> ' + esc(plusTexte(nuitsPlusDe(r.e))) + "</p>";
  el.hidden = false;
  el.innerHTML = "<div><h4>" + esc(r.e.nom) + "</h4>"
    + "<p>Famille " + esc(nomFamille(r.e.famille)) + "</p>"
    + lignes
    + '</div><div class="acts">'
    + '<button class="btn btn-or btn-sm" type="button" data-act="orga-open" data-id="' + esc(r.e.id) + '">Ouvrir son espace</button>'
    + '<button class="btn btn-ghost btn-sm" type="button" data-act="tl-close">Fermer</button></div>';
}

function renderPending() {
  const people = Object.values(D.espaces).sort(byNom);
  const sans = people.filter((e) => !e.dortAilleurs && !aDesNuits(e));
  const ailleurs = people.filter((e) => e.dortAilleurs);
  const chips = (list) => list.length
    ? '<div class="chips">' + list.map((e) => '<button class="chip" type="button" data-act="orga-open" data-id="' + esc(e.id) + '">' + esc(e.nom)
        + (e.confirme === false ? ' <span class="n">· pas confirmé</span>' : "") + "</button>").join("") + "</div>"
    : '<p class="tiny">Personne.</p>';
  $("orgaPending").innerHTML = '<div class="pend-box"><h4>Pas encore de dates · ' + sans.length + "</h4>" + chips(sans) + "</div>"
    + '<div class="pend-box"><h4>Dorment ailleurs · ' + ailleurs.length + "</h4>" + chips(ailleurs) + "</div>";
}

function focusDans(id) {
  const box = $(id);
  const a = document.activeElement;
  return !!(box && a && box.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName));
}

function renderDemandes() {
  const list = Object.values(D.demandes).sort((a, b) => String(a.cree).localeCompare(String(b.cree)));
  $("demandesBlock").hidden = !list.length;
  if (focusDans("orgaDemandes")) { Orga.famDiffere = true; return; }
  const fams = Object.values(D.familles).sort(byNom);
  $("orgaDemandes").innerHTML = list.map((d) =>
    '<div class="dem"><div><b>' + esc(d.nom || "Sans nom") + "</b> · " + esc(d.email) + " · " + esc(fmtVu(d.cree)) + "</div>"
      + (d.message ? "<p>" + esc(d.message) + "</p>" : "")
      + '<form data-form="dem-add" data-id="' + esc(d.id) + '">'
      +   '<select aria-label="Famille de rattachement"><option value="">Rattacher à la famille…</option>'
      +     fams.map((f) => '<option value="' + esc(f.id) + '">' + esc(f.nom || f.id) + "</option>").join("") + "</select>"
      +   '<label class="check"><input type="checkbox" checked> Créer son espace</label>'
      +   '<button class="btn btn-or btn-sm" type="submit">Ajouter</button>'
      +   '<button class="btn btn-ghost btn-sm" type="button" data-act="dem-del" data-id="' + esc(d.id) + '">Supprimer</button>'
      + "</form></div>").join("");
}

function personRowHtml(e) {
  const m = montantOf(e);
  const badges = (e.hote ? '<span class="badge badge-host">Hôtesse</span> ' : "")
    + (e.confirme === false ? '<span class="badge badge-wait">Pas encore confirmé</span> ' : "")
    + (e.vu ? '<span class="badge badge-ok">' + ICON_CHECK + "Venu·e le " + esc(fmtVu(e.vu)) + "</span>" : '<span class="badge badge-wait">Pas encore venu·e</span>');
  const pay = e.hote ? '<span class="tiny">—</span>'
    : (m > 0 ? '<label class="check" style="font-size:.84rem"><input type="checkbox" data-act="orga-paid" data-id="' + esc(e.id) + '"' + (e.regle ? " checked" : "") + ">" + euros(m) + "</label>"
             : '<span class="tiny">0 €</span>');
  let conf = "";
  if (Orga.confirm && Orga.confirm.type === "person" && Orga.confirm.id === e.id) {
    conf = '<div class="confirm-line">Supprimer définitivement ' + esc(e.nom) + ", ses dates et ses plats&nbsp;?"
      + ' <button class="btn btn-or btn-sm" type="button" data-act="conf-yes">Supprimer</button>'
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="conf-no">Annuler</button></div>';
  }
  return '<div class="acc-row">'
    + '<div class="who"><b>' + esc(e.nom) + "</b>" + '<div style="margin-top:.25rem">' + badges + "</div></div>"
    + '<div class="meta">'
    +   '<span class="cell"><span class="lbl">Séjour : </span>' + esc(rangeText(e)) + "</span>"
    +   '<span class="cell"><span class="lbl">Nuits </span>' + nuiteesOf(e) + "</span>"
    +   '<span class="cell">' + pay + "</span>"
    + "</div>"
    + '<div class="acts">'
    +   '<button class="icon-btn" type="button" data-act="orga-open" data-id="' + esc(e.id) + '">Ouvrir</button>'
    +   '<button class="icon-btn danger" type="button" data-act="person-del" data-id="' + esc(e.id) + '">Supprimer</button>'
    + "</div>"
    + conf
    + "</div>";
}

function famBlockHtml(f) {
  const membres = familleEspaces(f.id);
  const mails = Object.values(D.acces).filter((a) => a.famille === f.id).sort((a, b) => a.id.localeCompare(b.id));
  const avecDates = membres.filter(reponduNuits).length;
  const payants = membres.filter((e) => montantOf(e) > 0);
  const regles = payants.filter((e) => e.regle).length;
  const prenoms = (ids) => (ids || []).map((id) => D.espaces[id] ? prenomDe(D.espaces[id]) : null).filter(Boolean).join(", ");
  let conf = "";
  if (Orga.confirm && Orga.confirm.fam === f.id && Orga.confirm.type !== "person") {
    conf = '<div class="confirm-line">'
      + (Orga.confirm.type === "mail" ? "Retirer l'adresse " + esc(Orga.confirm.id) + "&nbsp;? Elle n'ouvrira plus le site." : "Supprimer la famille " + esc(f.nom) + "&nbsp;?")
      + ' <button class="btn btn-or btn-sm" type="button" data-act="conf-yes">' + (Orga.confirm.type === "mail" ? "Retirer" : "Supprimer") + "</button>"
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="conf-no">Annuler</button></div>';
  }
  return '<details class="fam" data-fam="' + esc(f.id) + '"' + (Orga.open[f.id] ? " open" : "") + ">"
    + "<summary><h4>" + esc(f.nom || f.id) + '</h4><span class="fam-meta">'
    +   plural(membres.length, "personne") + " · <b>" + avecDates + "</b> avec dates · " + regles + "/" + payants.length + " réglé" + (regles > 1 ? "s" : "")
    +   " · " + plural(mails.length, "adresse")
    + "</span></summary>"
    + '<div class="fam-in">'
    +   '<div class="fam-mails">' + (mails.length
          ? mails.map((m) => '<span class="mail-chip">' + esc(m.id) + (prenoms(m.personnes) ? " <small>(" + esc(prenoms(m.personnes)) + ")</small>" : "")
              + '<button type="button" data-act="mail-del" data-mail="' + esc(m.id) + '" data-fam="' + esc(f.id) + '" aria-label="' + esc("Retirer l'adresse " + m.id) + '">×</button></span>').join("")
          : '<span class="tiny">Aucune adresse : personne de cette famille ne peut entrer.</span>') + "</div>"
    +   (membres.length
          ? '<div class="acc"><div class="acc-row acc-head"><span>Personne</span><span>Séjour</span><span>Nuits</span><span>Participation</span><span></span></div>'
              + membres.map(personRowHtml).join("") + "</div>"
          : '<p class="fam-empty">Aucune personne dans cette famille pour l\'instant.</p>')
    +   conf
    +   '<div class="fam-forms">'
    +     '<form data-form="add-mail" data-fam="' + esc(f.id) + '" novalidate>'
    +       '<input type="email" maxlength="120" placeholder="Nouvelle adresse e-mail" aria-label="' + esc("Nouvelle adresse pour la famille " + (f.nom || f.id)) + '">'
    +       '<select aria-label="Personne liée à cette adresse"><option value="">Pour toute la famille</option>'
    +         membres.map((e) => '<option value="' + esc(e.id) + '">' + esc(prenomDe(e)) + "</option>").join("") + "</select>"
    +       '<button class="btn btn-ghost btn-sm" type="submit">Ajouter l\'adresse</button>'
    +     "</form>"
    +     '<form data-form="add-person" data-fam="' + esc(f.id) + '" novalidate>'
    +       '<input type="text" maxlength="60" placeholder="Prénom et nom" aria-label="' + esc("Nouvelle personne dans la famille " + (f.nom || f.id)) + '">'
    +       '<button class="btn btn-ghost btn-sm" type="submit">Ajouter la personne</button>'
    +     "</form>"
    +   "</div>"
    +   (!membres.length && !mails.length ? '<p style="margin-top:.8rem"><button class="icon-btn danger" type="button" data-act="fam-del" data-fam="' + esc(f.id) + '">Supprimer la famille</button></p>' : "")
    + "</div></details>";
}

function renderFamilles() {
  if (focusDans("orgaFamilles")) { Orga.famDiffere = true; return; }
  Orga.famDiffere = false;
  const fams = Object.values(D.familles);
  Object.values(D.espaces).forEach((e) => {
    if (e.famille && !D.familles[e.famille] && !fams.some((f) => f.id === e.famille)) fams.push({ id: e.famille, nom: e.famille });
  });
  fams.sort(byNom);
  $("orgaFamilles").innerHTML = fams.length
    ? fams.map(famBlockHtml).join("")
    : '<div class="tl-empty">Aucune famille pour l\'instant. Importez le fichier préparé (rubrique Données), ou créez une famille ci-dessous.</div>';
}

function idLibre(base, pris) {
  let id = base || "personne", k = 2;
  while (pris[id]) id = base + "-" + (k++);
  return id;
}

async function confirmer() {
  const c = Orga.confirm;
  Orga.confirm = null;
  if (!c) return;
  try {
    if (c.type === "person") {
      const e = D.espaces[c.id];
      const b = F.writeBatch(db);
      b.delete(ref("espaces", c.id));
      Object.values(D.apports).filter((a) => a.espace === c.id).forEach((a) => b.delete(ref("apports", a.id)));
      Object.values(D.idees).filter((d) => d.espace === c.id).forEach((d) => b.delete(ref("idees", d.id)));
      Object.values(D.acces).filter((a) => (a.personnes || []).indexOf(c.id) !== -1).forEach((a) => {
        b.update(ref("acces", a.id), { personnes: a.personnes.filter((x) => x !== c.id) });
      });
      await b.commit();
      if (G.vue === c.id) { G.vue = G.moi; G.asOrga = false; }
      toast((e ? e.nom : "La personne") + " supprimé·e");
    } else if (c.type === "mail") {
      await del("acces", c.id);
      toast("Adresse retirée");
    } else if (c.type === "fam") {
      await del("familles", c.fam);
      toast("Famille supprimée");
    }
  } catch (err) { toast(errText(err)); }
  Orga.render();
}

async function ajouterAdresse(form) {
  const fid = form.getAttribute("data-fam");
  const email = normMail(form.querySelector("input").value);
  const pid = form.querySelector("select").value;
  if (!mailOk(email)) { toast("Adresse e-mail invalide"); form.querySelector("input").focus(); return; }
  const deja = D.acces[email];
  if (deja && deja.famille !== fid) { toast("Cette adresse est déjà rattachée à la famille " + nomFamille(deja.famille)); return; }
  const personnes = deja ? (deja.personnes || []).slice() : [];
  if (pid && personnes.indexOf(pid) === -1) personnes.push(pid);
  try {
    await put("acces", email, { famille: fid, personnes: personnes });
    form.querySelector("input").value = "";
    form.querySelector("input").blur();
    toast("Adresse ajoutée à la famille " + nomFamille(fid));
  } catch (err) { toast(errText(err)); }
}

async function ajouterPersonne(form) {
  const fid = form.getAttribute("data-fam");
  const nom = cleanName(form.querySelector("input").value);
  if (nom.length < 2) { toast("Indiquez le prénom et le nom"); form.querySelector("input").focus(); return; }
  const id = idLibre(slug(nom), D.espaces);
  const now = nowIso();
  try {
    await put("espaces", id, {
      famille: fid, nom: nom, prenom: firstName(nom), sejours: [], dortAilleurs: false,
      regle: false, hote: false, confirme: true, source: "orga", cree: now, maj: now
    });
    form.querySelector("input").value = "";
    form.querySelector("input").blur();
    toast(nom + " ajouté·e à la famille " + nomFamille(fid));
  } catch (err) { toast(errText(err)); }
}

async function traiterDemande(form) {
  const d = D.demandes[form.getAttribute("data-id")];
  const fid = form.querySelector("select").value;
  const creer = form.querySelector('input[type="checkbox"]').checked;
  if (!d) return;
  if (!fid) { toast("Choisissez une famille"); form.querySelector("select").focus(); return; }
  const email = normMail(d.email);
  const deja = D.acces[email];
  if (deja && deja.famille !== fid) { toast("Cette adresse est déjà rattachée à la famille " + nomFamille(deja.famille)); return; }
  try {
    const b = F.writeBatch(db);
    const personnes = deja ? (deja.personnes || []).slice() : [];
    if (creer && cleanName(d.nom).length >= 2) {
      const nom = cleanName(d.nom);
      const id = idLibre(slug(nom), D.espaces);
      const now = nowIso();
      b.set(ref("espaces", id), {
        famille: fid, nom: nom, prenom: firstName(nom), sejours: [], dortAilleurs: false,
        regle: false, hote: false, confirme: true, source: "demande", cree: now, maj: now
      });
      personnes.push(id);
    }
    b.set(ref("acces", email), { famille: fid, personnes: personnes });
    b.delete(ref("demandes", d.id));
    await b.commit();
    toast(email + " peut maintenant entrer");
  } catch (err) { toast(errText(err)); }
}

/* ---------- exports ---------- */
function toCsv(rows) {
  return "﻿" + rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(";")).join("\r\n");
}
function csvStays() {
  // "Nuits en plus" (last column): nights before or after the party, an indication only, never counted or charged
  const rows = [["Famille", "Personne", "Arrivée", "Départ", "Nuits", "À confirmer", "Participation (€)", "Réglé", "Venu·e sur le site", "Nuits en plus (sans participation)"]];
  const people = Object.values(D.espaces).sort((a, b) => nomFamille(a.famille).localeCompare(nomFamille(b.famille), "fr") || byNom(a, b));
  people.forEach((e) => {
    const fam = nomFamille(e.famille);
    const vu = e.vu ? fmtVu(e.vu) : "";
    if (e.dortAilleurs) { rows.push([fam, e.nom, "", "", 0, "", 0, "dort ailleurs", vu, ""]); return; }
    const st = staysOf(e), plus = nuitsPlusDe(e);
    const plusTxt = plus.length ? plural(plus.length, "nuit") + " : " + joursTexte(plus) : "";
    if (!st.length && !plus.length) { rows.push([fam, e.nom, "", "", 0, "", 0, "pas de dates", vu, ""]); return; }
    if (!st.length) { rows.push([fam, e.nom, "", "", 0, aConfirmerDe(e) ? "oui" : "non", 0, e.hote ? "hôtesse" : "sans participation", vu, plusTxt]); return; }
    st.forEach((s) => {
      const n = nights(s);
      rows.push([fam, e.nom, s.du, s.au, n, s.aConfirmer ? "oui" : "non", e.hote ? 0 : n * CONFIG.prixNuit,
        e.hote ? "hôtesse" : (e.regle ? "oui" : "non"), vu, plusTxt]);
    });
  });
  telecharger("sejours-ile-grande.csv", toCsv(rows), "text/csv");
}
function csvItems() {
  const rows = [["Catégorie", "Plat ou apport", "Soir", "Précision", "Apporté par", "Famille"]];
  allItems().forEach((it) => {
    rows.push([CAT[it.type].nom, it.intitule, it.type === "autre" ? "" : (it.soir === "30" ? "30 déc." : "31 déc."), it.note, it.qui, nomFamille(it.famille)]);
  });
  telecharger("buffet-ile-grande.csv", toCsv(rows), "text/csv");
}
function exportJson() {
  const strip = (o) => { const r = {}; Object.keys(o).forEach((k) => { r[k] = sansId(o[k]); }); return r; };
  const out = {
    format: "reveillon-import-v1",
    genere: nowIso(),
    contenu: { site: C.raw },
    familles: strip(D.familles),
    acces: strip(D.acces),
    espaces: strip(D.espaces),
    apports: strip(D.apports),
    idees: strip(D.idees)
  };
  telecharger("reveillon-sauvegarde-" + nowIso().slice(0, 10) + ".json", JSON.stringify(out, null, 1), "application/json");
}

/* ---------- import ---------- */
const IMPORT_COLS = ["contenu", "familles", "acces", "espaces", "apports", "idees"];
function onImportFile(file) {
  const box = $("importBox");
  const reader = new FileReader();
  reader.onload = () => {
    let data = null;
    try { data = JSON.parse(String(reader.result)); } catch (e) { data = null; }
    box.hidden = false;
    if (!data || data.format !== "reveillon-import-v1") {
      Orga.importData = null;
      box.innerHTML = '<div class="import-box"><b>Ce fichier n\'est pas un export du site.</b> Choisissez le fichier « import-reveillon.json » ou une sauvegarde complète.</div>';
      return;
    }
    Orga.importData = data;
    const n = (c) => Object.keys(data[c] || {}).length;
    box.innerHTML = '<div class="import-box"><b>Importer ce fichier&nbsp;?</b>'
      + "<ul>"
      + "<li>" + plural(n("familles"), "famille") + ", " + plural(n("espaces"), "personne") + ", " + plural(n("acces"), "adresse") + "</li>"
      + "<li>" + plural(n("apports"), "plat ou apport", "plats ou apports") + ", " + plural(n("idees"), "idée") + "</li>"
      + "<li>Le contenu réservé aux invités (adresse, contacts)</li>"
      + "</ul>"
      + '<p class="tiny" style="margin-top:.6rem">Chaque document du fichier remplace celui qui porte le même identifiant ; le reste n\'est pas touché.</p>'
      + '<div class="acts"><button class="btn btn-or btn-sm" type="button" data-act="import-go">Importer</button>'
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="import-cancel">Annuler</button></div></div>';
  };
  reader.readAsText(file);
}
async function doImport(btn) {
  const data = Orga.importData;
  if (!data) return;
  const ops = [];
  IMPORT_COLS.forEach((c) => Object.keys(data[c] || {}).forEach((id) => ops.push([c, id, data[c][id]])));
  busy(btn, true, "Import…");
  try {
    for (let i = 0; i < ops.length; i += 400) {
      const b = F.writeBatch(db);
      ops.slice(i, i + 400).forEach((op) => { b.set(ref(op[0], op[1]), sansId(op[2])); });
      await b.commit();
    }
    Orga.importData = null;
    $("importBox").hidden = true;
    $("importFile").value = "";
    toast(plural(ops.length, "document") + " importés");
    try { const c = await F.getDoc(ref("contenu", "site")); applyContenu(c.exists() ? c.data() : {}); } catch (e) { /* nothing to do */ }
    try {
      if (S.email) {
        const a = await F.getDoc(ref("acces", S.email));
        if (a.exists()) {
          S.acces = a.data();
          const f = await F.getDoc(ref("familles", S.acces.famille));
          S.familleNom = f.exists() ? (f.data().nom || "") : "";
        }
      }
    } catch (e) { /* nothing to do */ }
    emit();
  } catch (err) {
    toast(errText(err));
  } finally {
    busy(btn, false);
  }
}

function wireTimelineTip() {
  const scroll = $("tlScroll"), tip = $("tlTip");
  const find = (key) => allRows().filter((r) => r.key === key)[0];
  function show(row, x, y) {
    const r = find(row.getAttribute("data-row"));
    if (!r) return;
    tip.innerHTML = "<b>" + esc(r.e.nom) + "</b><span>Famille " + esc(nomFamille(r.e.famille)) + "</span>"
      + (r.s ? "<span>" + fmtDay(r.s.du) + " → " + fmtDay(r.s.au) + " · " + plural(nights(r.s), "nuit") + "</span>" : "<span>Pas de nuit pendant la fête</span>")
      + (r.plus.length ? "<span>" + esc(plusTexte(nuitsPlusDe(r.e))) + " (sans participation)</span>" : "")
      + (aConfirmerDe(r.e) ? '<span style="color:var(--soleil)">Dates à confirmer</span>' : "");
    tip.classList.add("on");
    const box = scroll.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x - box.left + scroll.scrollLeft + 14;
    const maxLeft = scroll.scrollLeft + box.width - tw - 8;
    if (left > maxLeft) left = Math.max(scroll.scrollLeft + 8, x - box.left + scroll.scrollLeft - tw - 14);
    let top = y - box.top - th - 12;
    if (top < 4) top = y - box.top + 18;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  const hide = () => tip.classList.remove("on");
  scroll.addEventListener("mousemove", (e) => {
    const row = e.target.closest(".tl-row.data");
    if (row) show(row, e.clientX, e.clientY); else hide();
  });
  scroll.addEventListener("mouseleave", hide);
  scroll.addEventListener("focusin", (e) => {
    const row = e.target.closest(".tl-row.data");
    if (!row) return;
    const bar = row.querySelector(".tl-bar");
    const rb = (bar || row).getBoundingClientRect();
    show(row, rb.left + Math.min(rb.width, 120), rb.top + 4);
  });
  scroll.addEventListener("focusout", hide);
  scroll.addEventListener("scroll", hide, { passive: true });
}

function wireOrga() {
  const sec = $("orga");
  $("orgaForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const email = normMail($("orgaGateMail").value);
    if (!mailOk(email)) { setMsg($("orgaMsg"), "Indiquez votre adresse d'organisateur.", true); return; }
    envoyerLien(email, "orga", $("orgaMsg"), ev.target.querySelector('button[type="submit"]'));
  });
  $("famAdd").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nom = cleanName($("famAddNom").value);
    const msg = $("famAddMsg");
    if (nom.length < 2) { setMsg(msg, "Indiquez le nom de famille.", true); return; }
    const id = idLibre(slug(nom), D.familles);
    try {
      await put("familles", id, { nom: nom, cree: nowIso() });
      $("famAddNom").value = "";
      Orga.open[id] = true;
      setMsg(msg, "Famille " + nom + " créée : ajoutez-y des personnes et au moins une adresse.");
    } catch (err) { setMsg(msg, errText(err), true); }
  });
  $("importFile").addEventListener("change", (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (f) onImportFile(f);
  });

  sec.addEventListener("submit", (ev) => {
    const form = ev.target.closest("form[data-form]");
    if (!form) return;
    ev.preventDefault();
    const kind = form.getAttribute("data-form");
    if (kind === "add-mail") ajouterAdresse(form);
    if (kind === "add-person") ajouterPersonne(form);
    if (kind === "dem-add") traiterDemande(form);
  });
  sec.addEventListener("toggle", (ev) => {
    const d = ev.target;
    if (d && d.matches && d.matches("details.fam")) Orga.open[d.getAttribute("data-fam")] = d.open;
  }, true);
  sec.addEventListener("focusout", () => {
    setTimeout(() => {
      if (Orga.famDiffere && !focusDans("orgaFamilles") && !focusDans("orgaDemandes")) { renderFamilles(); renderDemandes(); }
    }, 0);
  });
  sec.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.getAttribute && t.getAttribute("data-act") === "orga-paid") {
      const id = t.getAttribute("data-id"), val = !!t.checked;
      upd("espaces", id, { regle: val, maj: nowIso() })
        .then(() => toast(val ? "Participation marquée comme réglée" : "Participation marquée comme non réglée"),
              (err) => { t.checked = !val; toast(errText(err)); });
    }
  });
  sec.addEventListener("keydown", (ev) => {
    const row = ev.target.closest && ev.target.closest(".tl-row.data");
    if (row && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); row.click(); }
  });
  sec.addEventListener("click", (ev) => {
    const row = ev.target.closest(".tl-row.data");
    if (row) {
      const key = row.getAttribute("data-row");
      Orga.sel = Orga.sel === key ? null : key;
      sec.querySelectorAll(".tl-row.data").forEach((rw) => rw.classList.toggle("sel", rw.getAttribute("data-row") === Orga.sel));
      renderDetail();
      return;
    }
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const act = b.getAttribute("data-act");
    const id = b.getAttribute("data-id");
    switch (act) {
      case "tl-sort": Orga.sort = b.getAttribute("data-v"); renderTimeline(); break;
      case "tl-close": Orga.sel = null; renderTimeline(); break;
      case "orga-open": ouvrirVue(id, true); break;
      case "person-del": Orga.confirm = { type: "person", id: id }; renderFamilles(); break;
      case "mail-del": Orga.confirm = { type: "mail", id: b.getAttribute("data-mail"), fam: b.getAttribute("data-fam") }; renderFamilles(); break;
      case "fam-del": Orga.confirm = { type: "fam", fam: b.getAttribute("data-fam") }; renderFamilles(); break;
      case "conf-no": Orga.confirm = null; renderFamilles(); break;
      case "conf-yes": confirmer(); break;
      case "dem-del":
        del("demandes", id).then(() => toast("Demande supprimée"), (err) => toast(errText(err)));
        break;
      case "csv-stays": csvStays(); break;
      case "csv-items": csvItems(); break;
      case "json-export": exportJson(); break;
      case "import-go": doImport(b); break;
      case "import-cancel": Orga.importData = null; $("importBox").hidden = true; $("importFile").value = ""; break;
      default: break;
    }
  });
  wireTimelineTip();

  let rz = null, lastW = window.innerWidth || 0;
  window.addEventListener("resize", () => {
    if (rz) clearTimeout(rz);
    rz = setTimeout(() => {
      const w = window.innerWidth || 0;
      if (Math.abs(w - lastW) > 40) { lastW = w; if (S.admin && D.ready.esp && !$("orgaBody").hidden) renderTimeline(); }
    }, 200);
  });
}

/* ============================================================
   RENDERING — countdown, area, contact, links
   ============================================================ */
const cdEl = $("countdown");
const target = new Date(CONFIG.reveillon).getTime();
function renderCountdown() {
  const diff = target - Date.now();
  if (diff <= 0) {
    cdEl.innerHTML = '<div class="cd-cell" style="min-width:auto;padding-inline:1.1rem"><span class="cd-num">Bloavezh mat&nbsp;!</span><span class="cd-lab">On y est</span></div>';
    return;
  }
  const s = Math.floor(diff / 1000);
  const parts = [
    { n: Math.floor(s / 86400), l: "jours" },
    { n: Math.floor(s / 3600) % 24, l: "heures" },
    { n: Math.floor(s / 60) % 60, l: "minutes" },
    { n: s % 60, l: "secondes" }
  ];
  cdEl.innerHTML = parts.map((p) => '<div class="cd-cell"><span class="cd-num">' + p.n + '</span><span class="cd-lab">' + p.l + "</span></div>").join("");
}

let activeFilter = "tout";
function renderFilters() {
  $("poiFilters").innerHTML = FILTERS.map((f) =>
    '<button class="filter" type="button" data-f="' + f.id + '" aria-pressed="' + (f.id === activeFilter) + '">' + esc(f.nom) + "</button>").join("");
}
function renderPois() {
  const list = POIS.filter((p) => activeFilter === "tout" || p.tags.indexOf(activeFilter) !== -1);
  $("poiGrid").innerHTML = list.map((p) => {
    const h = HIVER_LABEL[p.hiver] || HIVER_LABEL.open;
    return '<article class="poi">'
      + '<div class="poi-top"><h3>' + esc(p.nom) + '</h3><span class="dist">' + esc(p.dist) + "</span></div>"
      + "<p>" + esc(p.txt) + "</p>"
      + '<div class="poi-foot">'
      + '<span class="winter ' + h.cls + '"><span class="dot"></span>' + esc(h.txt) + "</span>"
      + '<a class="btn btn-ghost btn-sm" href="' + urlPrimary(p.lat, p.lng) + '" target="_blank" rel="noopener">Itinéraire</a>'
      + "</div></article>";
  }).join("");
}

function renderPeople() {
  $("people").innerHTML = C.orgas.map((o) =>
    '<article class="person">'
      + '<span class="role">' + esc(o.role || "") + "</span>"
      + "<h3>" + esc(o.nom || "") + "</h3>"
      + (o.telAff ? '<div class="tel">' + esc(o.telAff) + "</div>" : "")
      + (o.mail ? '<div class="mail">' + esc(o.mail) + "</div>" : "")
      + '<div class="acts">'
      +   (o.tel ? '<a class="btn btn-or btn-sm" href="tel:' + esc(o.tel) + '">Appeler</a>' : "")
      +   (o.wa ? '<a class="btn btn-wa btn-sm" href="' + esc(o.wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : "")
      +   (o.tel ? '<a class="btn btn-ghost btn-sm" href="sms:' + esc(o.tel) + '">SMS</a>' : "")
      +   (o.mail ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(o.mail) + "?subject=" + encodeURIComponent("Réveillon à l'Île Grande") + '">E-mail</a>' : "")
      + "</div></article>").join("");
}

function wireLinks() {
  const adr = C.lieu.adresse || "";
  $("goPrimary").href = adr ? urlPrimaryAdr(adr) : "#venir";
  $("goPrimary").textContent = isApple() ? "Itinéraire dans Plans, depuis ma position" : "Itinéraire dans Google Maps, depuis ma position";
  $("goGoogle").href = adr ? urlGoogleAdr(adr) : "#venir";
  $("goApple").href = adr ? urlAppleAdr(adr) : "#venir";
  $("goWaze").href = adr ? urlWazeAdr(adr) : "#venir";
}

function wireNav() {
  const ids = ["accueil", "sejour", "venir", "region", "boued", "espace", "contact", "orga"];
  const links = [].slice.call(document.querySelectorAll(".nav-desktop a, .tabbar a"));
  const mark = (id) => { links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + id)); };
  if ("IntersectionObserver" in window) {
    const seen = {};
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { seen[en.target.id] = en.intersectionRatio; });
      let best = null, bestR = 0;
      ids.forEach((id) => { const r = seen[id] || 0; if (r > bestR) { bestR = r; best = id; } });
      if (best) mark(best);
    }, { threshold: [0, 0.15, 0.35, 0.6, 0.9] });
    ids.forEach((id) => { const el = $(id); if (el) obs.observe(el); });
  }
  $("poiFilters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-f]");
    if (!btn) return;
    activeFilter = btn.getAttribute("data-f");
    renderFilters();
    renderPois();
  });
}

function renderStoreState() {
  const el = $("storeState"), tx = $("storeStateText");
  el.classList.remove("live", "off");
  if (D.status === "live") { el.classList.add("live"); tx.textContent = "Liste partagée en direct"; }
  else if (D.status === "error") { el.classList.add("off"); tx.textContent = "Liste partagée injoignable"; }
  else tx.textContent = "Connexion à la liste partagée…";
}

/* Wax seal: the outline ripples gently (the wax only, not the emblem).
   Settings taken from the "Wax Seal Motion" prototype. */
   (function sceauVivant() {
    const S = {"amp":2.75,"cycle":5,"ripple":0.68,"swell":1.15,"seed":7,"smooth":true};
    const svg = document.querySelector(".env .seal");
    if (!svg) return;
    const env = svg.closest(".env");
    const cire = svg.querySelector("path");
    const grad = svg.querySelector("radialGradient");
    // frozen gradient: the light stays put, only the outline moves
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("cx", "0"); grad.setAttribute("cy", "0"); grad.setAttribute("r", "1");
    grad.setAttribute("gradientTransform", "matrix(48 0 0 47.25 23.14 18)");

    const engine = (function sealEngine(d0, cx, cy) {
    const TAU = Math.PI * 2;
    const nums = d0.match(/-?\d*\.?\d+/g).map(Number);
    const n = nums.length >> 1;
    const ux = [], uy = [], r0 = [], th = [];
    for (let i = 0; i < n; i++) {
      const dx = nums[2 * i] - cx, dy = nums[2 * i + 1] - cy, r = Math.hypot(dx, dy);
      ux.push(dx / r); uy.push(dy / r); r0.push(r); th.push(Math.atan2(dy, dx));
    }
    let waves = [], norm = 1;
    // slow standing waves around the edge: each lobe swells and recedes without rotating
    function raw(i, t) {
      let s = 0;
      for (const w of waves) s += w.a * Math.sin(w.k * th[i] + w.p) * Math.sin(w.w * t + w.q);
      return s;
    }
    function configure(ripple, seed) {
      let x = (seed >>> 0) || 1;
      const rand = () => {
        x = (x + 0x6D2B79F5) | 0;
        let z = Math.imul(x ^ (x >>> 15), 1 | x);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
      };
      const fall = 2 - 1.6 * ripple;
      waves = [];
      for (let k = 2; k <= 8; k++) for (let j = 0; j < 2; j++) {
        waves.push({ k, a: Math.pow(k / 2, -fall), p: rand() * TAU, q: rand() * TAU, w: (0.6 + 0.8 * rand()) * (1 + 0.05 * (k - 2)) });
      }
      let peak = 0;
      for (let s = 0; s < 200; s++) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw(i, s * 0.41)));
      norm = peak ? 1 / peak : 1;
    }
    function path(t, amp, swell, smooth) {
      const b = swell * Math.sin(t * 0.61 + 1.3);
      const P = [];
      for (let i = 0; i < n; i++) {
        const r = r0[i] + amp * norm * raw(i, t) + b;
        P.push([cx + ux[i] * r, cy + uy[i] * r]);
      }
      const f = (v) => v.toFixed(2);
      if (!smooth) return "M" + P.map((p) => f(p[0]) + " " + f(p[1])).join("L") + "Z";
      let d = "M" + f(P[0][0]) + " " + f(P[0][1]);
      for (let i = 0; i < n; i++) {
        const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
        d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " "
          + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " "
          + f(p2[0]) + " " + f(p2[1]);
      }
      return d + "Z";
    }
    return { configure, path };
  })(cire.getAttribute("d"), 32, 31);
    engine.configure(S.ripple, S.seed);

    const calme = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0, drawn = 0, t = 0;
    function frame(now) {
      if (env.classList.contains("open") || calme.matches) { raf = 0; return; }
      t += Math.min(now - last, 100) / 1000 * (Math.PI * 2 / S.cycle);
      last = now;
      if (now - drawn >= 33) { drawn = now; cire.setAttribute("d", engine.path(t, S.amp, S.swell, S.smooth)); }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (raf || calme.matches || env.classList.contains("open")) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    new MutationObserver(start).observe(env, { attributes: true, attributeFilter: ["class"] });
    if (calme.addEventListener) calme.addEventListener("change", start);
    start();
  })();

/* ============================================================
   GLOBAL EVENTS
   ============================================================ */
function wireGeneral() {
  $("paneMail").addEventListener("submit", submitMail);
  $("paneAsk").addEventListener("submit", submitAsk);
  $("paneConfirm").addEventListener("submit", submitConfirm);
  $("paneOrga").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const email = normMail($("orgaMail").value);
    if (!mailOk(email)) { setMsg($("orgaMailMsg"), "Indiquez votre adresse d'organisateur.", true); return; }
    envoyerLien(email, "orga", $("orgaMailMsg"), ev.target.querySelector('button[type="submit"]'));
  });
  $("meBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleMeMenu(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("meMenu").hidden) { closeMeMenu(); $("meBtn").focus(); }
  });
  $("copyAddr").addEventListener("click", () => {
    const txt = [C.lieu.nom, C.lieu.adresse].filter(Boolean).join(", ");
    if (!txt) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => toast("Adresse copiée"), () => toast(txt));
    } else {
      toast(txt);
    }
  });

  document.addEventListener("click", (e) => {
    if (!$("meMenu").hidden && !e.target.closest(".me")) closeMeMenu();
    const pick = e.target.closest("[data-pick]");
    if (pick) { choisirPersonne(pick.getAttribute("data-pick")); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    switch (b.getAttribute("data-act")) {
      case "logout": e.preventDefault(); seDeconnecter(); break;
      case "switch-person": e.preventDefault(); changerDePersonne(); break;
      case "go-espace":
        closeMeMenu();
        if (G.moi && G.vue !== G.moi) ouvrirVue(G.moi, false); else scrollToId("espace");
        G.asOrga = false;
        break;
      case "go-orga": closeMeMenu(); S.orgaVisible = true; updateOrgaUi(); scrollToId("orga"); break;
      case "orga-show": e.preventDefault(); S.orgaVisible = true; updateOrgaUi(); Orga.render(); scrollToId("orga"); break;
      case "orga-pane":
        setMsg($("orgaMailMsg"), "");
        $("orgaMail").value = normMail($("mailInput").value);
        Gate.show("paneOrga", true);
        break;
      case "ask-open":
        if (!$("askMail").value) $("askMail").value = normMail($("mailInput").value);
        setMsg($("askMsg"), "");
        Gate.show("paneAsk", true);
        break;
      case "to-mail":
        setMsg($("mailMsg"), "");
        $("mailAsk").hidden = true;
        if (Soon.actif) { setMsg($("soonMsg"), ""); Gate.show("paneSoon"); break; }   // before the opening, back to "Bientôt disponible…"
        Gate.show("paneMail", true);
        break;
      default: break;
    }
  });
}

/* ============================================================
   STARTUP
   ============================================================ */
onData(() => {
  if (S.phase === "famille") renderPlaces();
  if (S.phase !== "site") return;
  if (D.ready.esp && G.moi && !D.espaces[G.moi]) {
    lsDel("ig.moi");
    G.moi = null;
    if (!S.admin && familleEspaces().length) { G.vue = null; setPhase("famille"); return; }
  }
  if (D.ready.esp && G.vue && !D.espaces[G.vue]) { G.vue = G.moi; G.asOrga = false; G.draftFor = null; }
  renderMe();
  Buffet.render();
  renderEspace();
  Orga.render();
  renderStoreState();
});

function boot() {
  renderCountdown();
  setInterval(renderCountdown, 1000);
  renderFilters();
  renderPois();
  wireLinks();
  wireNav();
  wireBuffet();
  wireEspace();
  wireOrga();
  wireGeneral();
  wirePeek();
  const quand = texteOuverture();
  if (quand) $("soonWhen").textContent = "Votre invitation s'ouvrira ici " + quand + ".";
  armerOuverture();
  setPhase("boot");
  Gate.show("paneBoot");

  if (F.isSignInWithEmailLink(auth, location.href)) {
    S.lien = new URLSearchParams(location.search).get("lien") || "invite";
    const email = lsGet("ig.lienMail");
    if (email) {
      S.busy = true;
      terminerLien(email);
    } else {
      S.attenteLien = true;
      setPhase("entree");
      Gate.show("paneConfirm");
    }
  }
  F.onAuthStateChanged(auth, onAuth);
}

boot();
