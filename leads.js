import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, writeBatch, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "style") e.setAttribute("style", v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e[k] = v;
  }
  e.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return e;
}
const SCREENS = ["loading", "signed-out", "denied", "setup", "app"];
const show = (id) => SCREENS.forEach((x) => $(x).classList.toggle("hidden", x !== id));
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "page";

const PAGES = new Map();
let editing = false;

const byOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.title).localeCompare(b.title);
const childrenOf = (id, group) => [...PAGES.values()]
  .filter((p) => p.parent === id && (group === undefined || (p.group || "") === group))
  .sort(byOrder);
function ancestors(p) {
  const out = []; let cur = p; const seen = new Set();
  while (cur && cur.parent && PAGES.has(cur.parent) && !seen.has(cur.parent)) {
    seen.add(cur.parent); cur = PAGES.get(cur.parent); out.unshift(cur);
  }
  return out;
}
function groupedChildren(id) {
  const map = new Map();
  for (const p of childrenOf(id)) {
    const g = p.group || "";
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(p);
  }
  return map;
}
const pageLabel = (p) => `${p.emoji || "📄"} ${p.title}`;
const pageHref = (id) => "#" + encodeURIComponent(id);

// Soft cover gradient per page, so gallery cards look like Notion's.
function cover(title) {
  let h = 0; for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = 250 + (h % 70), b = (a + 40 + (h % 50)) % 360;
  return `background: linear-gradient(135deg, hsl(${a} 55% 88%), hsl(${b} 60% 80%));`;
}

// ---------- inline formatting: **bold**, *italic*, ***both***, `code`, [label](url), [[page-id]] ----------
const INLINE = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)\s]+\))/g;
function inline(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("***")) out.push(el("strong", {}, el("em", { textContent: t.slice(3, -3) })));
    else if (t.startsWith("**")) out.push(el("strong", { textContent: t.slice(2, -2) }));
    else if (t.startsWith("*")) out.push(el("em", { textContent: t.slice(1, -1) }));
    else if (t.startsWith("`")) out.push(el("code", { textContent: t.slice(1, -1) }));
    else if (t.startsWith("[[")) {
      const id = t.slice(2, -2).trim();
      const p = PAGES.get(id);
      out.push(p ? el("a", { className: "internal", href: pageHref(id), textContent: pageLabel(p) }) : el("span", { className: "muted", textContent: `[missing page: ${id}]` }));
    } else {
      const [, label, url] = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      out.push(/^(https?:|mailto:)/i.test(url) ? el("a", { href: url, target: "_blank", rel: "noopener", textContent: label }) : label);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function inlineLines(lines) {
  const out = [];
  lines.forEach((l, i) => { if (i) out.push(el("br")); out.push(...inline(l)); });
  return out;
}

// ---------- page renderer (small, safe markdown: builds DOM nodes, never raw HTML) ----------
function renderContent(src, page) {
  const root = el("div", { className: "doc" });
  const lines = String(src || "").replace(/\r/g, "").split("\n");
  const headings = [];
  let tocSlot = null;
  let i = 0;

  const isBlockStart = (l) => /^(#{1,3}\s|>|\+\s|-\s|\||---\s*$|\[(toc|subpages)\]|\[(gallery|list):)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    let m;
    if (/^---\s*$/.test(t)) { root.append(el("hr")); i++; continue; }
    if (t === "[toc]") { tocSlot = el("nav", { className: "toc" }); root.append(tocSlot); i++; continue; }
    if (t === "[subpages]") {
      const box = el("div", { className: "plist" });
      for (const [g, list] of groupedChildren(page.id)) {
        if (g) box.append(el("div", { className: "gt", textContent: g }));
        for (const p of list) box.append(el("a", { href: pageHref(p.id) }, pageLabel(p)));
      }
      root.append(box); i++; continue;
    }
    if ((m = t.match(/^\[(gallery|list):\s*(.*)\]$/))) {
      const list = childrenOf(page.id, m[2].trim());
      if (!list.length) root.append(el("p", { className: "muted", textContent: "No pages here yet." }));
      else if (m[1] === "gallery") {
        root.append(el("div", { className: "gallery" }, list.map((p) =>
          el("a", { className: "gcard", href: pageHref(p.id) }, el("div", { className: "cover", style: cover(p.title) }), el("div", { className: "t", textContent: p.title })))));
      } else {
        root.append(el("div", { className: "plist" }, list.map((p) => el("a", { href: pageHref(p.id) }, pageLabel(p)))));
      }
      i++; continue;
    }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      const level = m[1].length;
      const h = el("h" + (level + 1), { id: "h-" + headings.length }, inline(m[2]));
      headings.push({ level, text: m[2].replace(/[*`]/g, ""), node: h });
      root.append(h); i++; continue;
    }
    if (t.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { buf.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      const box = el("div", { className: "callout" });
      buf.join("\n").split(/\n\s*\n/).forEach((para) => box.append(el("p", {}, inlineLines(para.split("\n")))));
      root.append(box); continue;
    }
    if (/^\+\s/.test(t)) {
      const wrap = el("div", { className: "toggles" });
      while (i < lines.length && /^\+\s/.test(lines[i].trim())) {
        const title = lines[i].trim().slice(2); i++;
        const items = [];
        while (i < lines.length && /^\s+\S/.test(lines[i]) && !/^\+\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^-\s*/, "")); i++; }
        const d = el("details", { className: "toggle" }, el("summary", {}, inline(title)));
        d.append(items.length ? el("ul", {}, items.map((it) => el("li", {}, inline(it)))) : el("ul", {}, el("li", { className: "muted", textContent: "Nothing added yet." })));
        wrap.append(d);
      }
      root.append(wrap); continue;
    }
    if (/^-\s/.test(t)) {
      const ul = el("ul", { className: "bul" });
      while (i < lines.length && /^-\s/.test(lines[i].trim())) { ul.append(el("li", {}, inline(lines[i].trim().slice(2)))); i++; }
      root.append(ul); continue;
    }
    if (t.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const r = lines[i].trim();
        if (!/^\|[\s|:-]+\|$/.test(r)) rows.push(r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows;
      const isPeopleCol = (h) => /responsible|involved|people|who|owner/i.test(h);
      const table = el("table", {},
        el("thead", {}, el("tr", {}, head.map((h) => el("th", {}, inline(h))))),
        el("tbody", {}, body.map((r) => el("tr", {}, head.map((h, ci) => {
          const v = r[ci] || "";
          if (isPeopleCol(h) && v) return el("td", {}, v.split(",").map((n) => el("span", { className: "chip", textContent: n.trim() })));
          return el("td", {}, inline(v));
        })))));
      root.append(el("div", { className: "table-wrap" }, table)); continue;
    }
    // paragraph: consecutive plain lines
    const buf = [];
    while (i < lines.length && lines[i].trim() && !(buf.length && isBlockStart(lines[i].trim()))) { buf.push(lines[i]); i++; if (isBlockStart(buf[0].trim())) break; }
    root.append(el("p", {}, inlineLines(buf)));
  }

  if (tocSlot) {
    if (!headings.length) tocSlot.remove();
    for (const h of headings) {
      tocSlot.append(el("a", {
        href: "#", textContent: h.text, style: `padding-left:${(h.level - 1) * 22}px`,
        onclick: (e) => { e.preventDefault(); h.node.scrollIntoView({ behavior: "smooth", block: "start" }); },
      }));
    }
  }
  return root;
}

// ---------- sidebar ----------
function renderSidebar(active) {
  const sb = $("sidebar");
  const home = PAGES.get("home");
  const activeChain = new Set(active ? [...ancestors(active).map((p) => p.id), active.id] : []);
  sb.replaceChildren(el("a", { href: "#home", className: active?.id === "home" ? "active" : "" }, pageLabel(home)));

  const addTree = (container, id, depth) => {
    for (const p of childrenOf(id)) {
      container.append(el("a", { href: pageHref(p.id), className: active?.id === p.id ? "active" : "" }, pageLabel(p)));
      if (activeChain.has(p.id) && childrenOf(p.id).length && depth < 4) {
        const nest = el("div", { className: "nested" });
        addTree(nest, p.id, depth + 1);
        container.append(nest);
      }
    }
  };
  for (const [g, list] of groupedChildren("home")) {
    if (g) sb.append(el("h4", { textContent: g }));
    for (const p of list) {
      sb.append(el("a", { href: pageHref(p.id), className: active?.id === p.id ? "active" : "" }, pageLabel(p)));
      if (activeChain.has(p.id) && childrenOf(p.id).length) {
        const nest = el("div", { className: "nested" });
        addTree(nest, p.id, 1);
        sb.append(nest);
      }
    }
  }
  sb.append(el("h4", { textContent: "Public website" }),
    el("a", { href: "#team-editor", className: location.hash === "#team-editor" ? "active" : "" }, "👥 Team (Who We Are page)"));
}

// ---------- page view ----------
function renderPage(p) {
  const v = $("view");
  const crumbs = ancestors(p);
  const newBox = el("div", { className: "newpage hidden" });
  const newInput = el("input", { placeholder: "Title of the new sub-page" });
  const newGroup = el("input", { placeholder: "Section (optional, e.g. Current)", style: "max-width:260px" });
  newBox.append(newInput, newGroup,
    el("button", { className: "btn primary", textContent: "Create", onclick: () => createPage(p, newInput.value, newGroup.value) }),
    el("button", { className: "btn", textContent: "Cancel", onclick: () => newBox.classList.add("hidden") }));
  newInput.addEventListener("keydown", (e) => { if (e.key === "Enter") createPage(p, newInput.value, newGroup.value); });

  const meta = p.updatedBy
    ? `Last edited by ${p.updatedBy}${p.updatedAt?.toDate ? " · " + p.updatedAt.toDate().toLocaleString() : ""}`
    : "";

  v.replaceChildren(
    crumbs.length ? el("div", { className: "crumb" }, crumbs.flatMap((c, idx) => [idx ? " / " : "", el("a", { href: pageHref(c.id), textContent: c.title })])) : el("div", { className: "crumb" }, " "),
    el("div", { className: "page-head" },
      el("h1", {}, `${p.emoji ? p.emoji + " " : ""}${p.title}`),
      el("div", { className: "tools" },
        el("button", { className: "btn", textContent: "+ Sub-page", onclick: () => { newBox.classList.remove("hidden"); newInput.focus(); } }),
        el("button", { className: "btn", textContent: "✎ Edit", onclick: () => { editing = true; route(); } }))),
    newBox,
    renderContent(p.content, p),
    meta ? el("div", { className: "meta", textContent: meta }) : null,
  );
}

const HELP = `# Heading            ## Smaller heading      ### Smallest heading
**bold**  *italic*  \`code\`  [Link text](https://...)  [[page-id]] (link to another page)
- bullet point
> callout box (grey box)
+ Toggle title
    - item inside the toggle (indent with spaces)
| Column | Column |        (table; first row = header; names in a
|---|---|                  "Responsible"/"Involved" column become chips)
| cell | Name A, Name B |
---                       divider line
[toc]                     table of contents of this page
[subpages]                list all sub-pages, grouped by their section
[gallery: Current]        gallery of sub-pages whose section is "Current"
[list: Past]              list of sub-pages whose section is "Past"`;

function renderEditor(p) {
  const v = $("view");
  const loadedTs = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : 0;
  const f = {
    emoji: el("input", { value: p.emoji || "" }),
    title: el("input", { value: p.title || "" }),
    group: el("input", { value: p.group || "", placeholder: "e.g. Current" }),
    order: el("input", { value: p.order ?? "", type: "number" }),
    content: el("textarea", { value: p.content || "", spellcheck: true }),
  };
  const msg = el("div");
  const save = async (force) => {
    msg.replaceChildren(el("span", { className: "muted", textContent: "Saving…" }));
    try {
      const ref = doc(db, "leads", p.id);
      const fresh = await getDoc(ref);
      const freshTs = fresh.data()?.updatedAt?.toMillis?.() ?? 0;
      if (!force && freshTs !== loadedTs) {
        msg.replaceChildren(el("div", { className: "warn" },
          `${fresh.data()?.updatedBy || "Someone"} saved this page after you opened it. Saving now would overwrite their changes. `,
          el("button", { className: "btn", textContent: "Overwrite anyway", onclick: () => save(true) })));
        return;
      }
      const data = {
        emoji: f.emoji.value.trim(), title: f.title.value.trim() || "Untitled",
        group: f.group.value.trim(), content: f.content.value,
        updatedAt: serverTimestamp(), updatedBy: auth.currentUser.email.toLowerCase(),
      };
      if (f.order.value !== "") data.order = Number(f.order.value);
      await setDoc(ref, data, { merge: true });
      await loadPages();
      editing = false; route();
    } catch (e) {
      msg.replaceChildren(el("span", { className: "error", textContent: "Could not save: " + e.message }));
    }
  };
  const field = (label, input) => el("div", {}, el("label", { textContent: label }), input);
  v.replaceChildren(
    el("div", { className: "editor" },
      el("div", { className: "row" }, field("Emoji", f.emoji), field("Title", f.title), field("Section in parent", f.group), field("Order", f.order)),
      field("Content", f.content),
      el("div", { className: "actions" },
        el("button", { className: "btn primary", textContent: "Save", onclick: () => save(false) }),
        el("button", { className: "btn", textContent: "Cancel", onclick: () => { editing = false; route(); } }),
        el("span", { className: "muted", style: "font-size:13px", textContent: `Page ID (for [[links]]): ${p.id}` })),
      msg,
      el("details", {}, el("summary", { textContent: "Formatting help" }), el("pre", { textContent: HELP }))));
  f.content.focus();
}

async function createPage(parent, title, group) {
  title = (title || "").trim();
  if (!title) return;
  const id = `${slug(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const siblings = childrenOf(parent.id);
  await setDoc(doc(db, "leads", id), {
    parent: parent.id, title, emoji: "📄", group: (group || "").trim(),
    order: siblings.length + 1, content: "",
    updatedAt: serverTimestamp(), updatedBy: auth.currentUser.email.toLowerCase(),
  });
  await loadPages();
  editNext = true;
  location.hash = pageHref(id);
}

// ---------- routing & data ----------
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) =>
  setTimeout(() => rej(new Error(`${what} didn't respond within ${ms / 1000}s. Check that the Firestore database exists and projectId in firebase-config.js is right.`)), ms))]);

async function loadPages() {
  const snap = await withTimeout(getDocs(collection(db, "leads")), 12000, "Firestore");
  PAGES.clear();
  snap.docs.forEach((d) => PAGES.set(d.id, { id: d.id, ...d.data() }));
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1)) || "home";
  if (id === "team-editor") {
    renderSidebar(null);
    import("./team-editor.js")
      .then((m) => m.renderTeamEditor($("view"), { db, auth, el, fs: { collection, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp } }))
      .catch(() => $("view").replaceChildren(el("p", { className: "error", textContent: "team-editor.js is missing. Upload it from the latest zip." })));
    window.scrollTo(0, 0);
    return;
  }
  const p = PAGES.get(id) || PAGES.get("home");
  renderSidebar(p);
  editing ? renderEditor(p) : renderPage(p);
  window.scrollTo(0, 0);
}
let editNext = false; // set by createPage so a brand-new page opens in edit mode
window.addEventListener("hashchange", () => { editing = editNext; editNext = false; route(); });

$("seed").onclick = async () => {
  try {
    // Loaded only here, so the site works without this file. It holds internal content:
    // run the setup once from your computer, then keep leads-seed.js OUT of the GitHub repo.
    let SEED;
    try { ({ SEED } = await import("./leads-seed.js")); }
    catch { throw new Error("leads-seed.js not found. Run the setup from your computer (see README)."); }
    const batch = writeBatch(db);
    for (const { id, ...data } of SEED) {
      batch.set(doc(db, "leads", id), { ...data, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.email.toLowerCase() });
    }
    await batch.commit();
    await loadPages();
    show("app"); route();
  } catch (e) {
    $("seed-error").textContent = "Could not create pages: " + e.message;
    $("seed-error").classList.remove("hidden");
  }
};

$("login").onclick = async () => {
  try { await signInWithPopup(auth, provider); }
  catch (e) { $("login-error").textContent = "Sign-in failed: " + e.message; $("login-error").classList.remove("hidden"); }
};
document.querySelectorAll(".logout").forEach((b) => (b.onclick = () => signOut(auth)));

onAuthStateChanged(auth, async (user) => {
  if (!user) return show("signed-out");
  show("loading");
  try {
    await loadPages(); // Firestore rules only allow this for emails in leadUsers
    $("user-email").textContent = user.email;
    if (!PAGES.has("home")) return show("setup");
    show("app"); route();
  } catch (e) {
    if (e.code === "permission-denied") { $("denied-email").textContent = user.email; show("denied"); }
    else if (window.__bootProblem) { window.__bootProblem("Couldn't load the leads area", "<p></p>"); $("loading").querySelector("p").textContent = e.message; }
    else { $("login-error").textContent = "Error: " + e.message; $("login-error").classList.remove("hidden"); show("signed-out"); }
  }
});
