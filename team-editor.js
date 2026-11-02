// Leads-only editor for the public "Current Team" section (index.html).
// Data: Firestore collection "team" (one doc per person) + doc "site/team" (intro text).
// Anyone can read these (they're public on the website); only leads can change them.

const STARTER = [
  { name: "Asuka Kähler", study: "8th Sem. B.Sc. Psychology and 2nd Sem B.Sc. Biophysics at HU Berlin", role: "Current Representative and Founder" },
  { name: "Sebastian Wilhelm", study: "8th Sem. B.Sc. Psychology at University Osnabrück", role: "Current Representative" },
  { name: "Juliana Gollwitzer", study: "2nd Sem. M.Sc. Translational Neuroscience at HHU Düsseldorf", role: "Current Representative" },
  { name: "Jakob Menkens", study: "2nd Sem. M.Sc. Neural and Behavioral Science at Eberhard-Karls University Tübingen", role: "" },
  { name: "Larissa Marie Nelle", study: "2nd Sem., M.Sc. Experimental Psychology and Neuroscience at University Bielefeld", role: "" },
  { name: "Julia Benita Senfft", study: "6th Sem. B.Sc. Psychology and 2nd Sem. B.Sc. AI and Cognitive Computing at University Bielefeld", role: "" },
];
// Contact & link fields shown as pill buttons on the public card (same set as the design mockup).
export const LINK_FIELDS = [
  ["website", "Website", "https://…"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/in/…"],
  ["github", "GitHub", "https://github.com/…"],
  ["scholar", "Google Scholar", "https://scholar.google.com/citations?user=…"],
  ["orcid", "ORCID", "0000-0000-0000-0000 or full link"],
  ["researchgate", "ResearchGate", "https://www.researchgate.net/profile/…"],
  ["social", "Bluesky / X", "https://bsky.app/profile/… or https://x.com/…"],
  ["cv", "CV", "Link to a PDF or page"],
];

const DEFAULT_INTRO = "We are currently a Team of 27 Students organizing the Student Network for Neuroscience and its activities.";

// Crop to a 3:4 portrait and shrink, so a photo is ~30–60 KB and fits in Firestore (no paid Storage needed).
async function toPortrait(file) {
  const img = await createImageBitmap(file);
  const W = 360, H = 480, target = W / H;
  let sw = img.width, sh = img.height;
  if (sw / sh > target) sw = sh * target; else sh = sw / target;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  c.getContext("2d").drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
  return c.toDataURL("image/jpeg", 0.82);
}

export async function renderTeamEditor(view, { db, auth, el, fs }) {
  const { collection, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp } = fs;
  const me = () => auth.currentUser.email.toLowerCase();
  view.replaceChildren(el("p", { className: "muted", textContent: "Loading team…" }));

  let members, intro;
  try {
    const [snap, introSnap] = await Promise.all([getDocs(collection(db, "team")), getDoc(doc(db, "site", "team"))]);
    members = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name));
    intro = introSnap.exists() ? introSnap.data().intro : DEFAULT_INTRO;
  } catch (e) {
    view.replaceChildren(el("p", { className: "error", textContent: "Could not load team: " + e.message }));
    return;
  }

  const rerender = () => renderTeamEditor(view, { db, auth, el, fs });
  const status = (box, text, cls = "muted") => box.replaceChildren(el("span", { className: cls, textContent: text }));

  // ---- intro text ----
  const introInput = el("textarea", { value: intro, rows: 2 });
  const introMsg = el("span");
  const introBox = el("div", { className: "team-intro" },
    el("label", { textContent: "Intro text above the team cards" }), introInput,
    el("div", { className: "actions" },
      el("button", { className: "btn", textContent: "Save intro", onclick: async () => {
        status(introMsg, "Saving…");
        try { await setDoc(doc(db, "site", "team"), { intro: introInput.value.trim(), updatedBy: me(), updatedAt: serverTimestamp() }); status(introMsg, "Saved ✓"); }
        catch (e) { status(introMsg, e.message, "error"); }
      } }), introMsg));

  // ---- one editable card per member ----
  const card = (m) => {
    const isNew = !m.id;
    const f = {
      name: el("input", { value: m.name || "", placeholder: "Full name" }),
      study: el("textarea", { value: m.study || "", rows: 2, placeholder: "e.g. 2nd Sem. M.Sc. Neuroscience at …" }),
      role: el("input", { value: m.role || "", placeholder: "e.g. Current Representative (optional)" }),
      workingOn: el("input", { value: m.workingOn || "", placeholder: "e.g. Website, Neuro Talk Evenings" }),
      interests: el("input", { value: m.interests || "", placeholder: "e.g. Memory, computational neuroscience" }),
      order: el("input", { type: "number", value: m.order ?? "", placeholder: "Order" }),
      email: el("input", { type: "email", value: m.email || "", placeholder: "name@uni.edu (shown publicly)" }),
      otherLabel: el("input", { value: m.links?.otherLabel || "" }),
      otherUrl: el("input", { value: m.links?.otherUrl || "" }),
    };
    const L = m.links || {};
    const linkInputs = Object.fromEntries(LINK_FIELDS.map(([k, , ph]) => [k, el("input", { value: L[k] || "", placeholder: ph })]));
    let photo = m.photo || "";
    const preview = el("div", { className: "tphoto" });
    const showPhoto = () => preview.replaceChildren(photo ? el("img", { src: photo, alt: "" }) : el("span", { textContent: (f.name.value || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("") }));
    showPhoto();
    const fileIn = el("input", { type: "file", accept: "image/*", className: "hidden" });
    const msg = el("span");
    fileIn.onchange = async () => {
      if (!fileIn.files[0]) return;
      try { photo = await toPortrait(fileIn.files[0]); showPhoto(); status(msg, "New photo – click Save"); }
      catch { status(msg, "Could not read that image", "error"); }
    };

    let confirmDelete = false;
    const delBtn = el("button", { className: "btn", textContent: "Remove", onclick: async () => {
      if (isNew) return rerender();
      if (!confirmDelete) { confirmDelete = true; delBtn.textContent = "Click again to remove"; delBtn.classList.add("danger"); return; }
      status(msg, "Removing…");
      try { await deleteDoc(doc(db, "team", m.id)); rerender(); } catch (e) { status(msg, e.message, "error"); }
    } });

    const save = async () => {
      const name = f.name.value.trim();
      if (!name) return status(msg, "Name is required", "error");
      const bad = [...LINK_FIELDS.map(([k, label]) => [label, linkInputs[k].value.trim(), k]), ["Other link", f.otherUrl.value.trim(), "other"]]
        .find(([, v, k]) => v && !/^https:\/\//i.test(v) && !(k === "orcid" && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(v)) && !(k === "other" && /^#[\w-]+$/.test(v)));
      if (bad) return status(msg, `${bad[0]} must start with https://`, "error");
      if (f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return status(msg, "Email doesn't look right", "error");
      status(msg, "Saving…");
      const id = m.id || name.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 5);
      const data = {
        name, study: f.study.value.trim(), role: f.role.value.trim(),
        workingOn: f.workingOn.value.trim(), interests: f.interests.value.trim(), photo,
        email: f.email.value.trim(),
        links: {
          ...Object.fromEntries(LINK_FIELDS.map(([k]) => [k, linkInputs[k].value.trim()])),
          otherLabel: f.otherLabel.value.trim(), otherUrl: f.otherUrl.value.trim(),
        },
        order: f.order.value === "" ? 999 : Number(f.order.value),
        updatedBy: me(), updatedAt: serverTimestamp(),
      };
      try { await setDoc(doc(db, "team", id), data); if (isNew) rerender(); else status(msg, "Saved ✓"); }
      catch (e) { status(msg, "Could not save: " + e.message, "error"); }
    };

    const lab = (t, input) => el("div", {}, el("label", { textContent: t }), input);
    return el("div", { className: "tcard" + (isNew ? " new" : "") },
      el("div", {}, preview,
        el("div", { className: "tphoto-actions" },
          el("button", { className: "btn small", textContent: photo ? "Change photo" : "Add photo", onclick: () => fileIn.click() }),
          el("button", { className: "btn small", textContent: "No photo", onclick: () => { photo = ""; showPhoto(); status(msg, "Photo removed – click Save"); } })),
        fileIn),
      el("div", { className: "tfields" },
        el("div", { className: "two" }, lab("Name", f.name), lab("Order", f.order)),
        lab("Study", f.study),
        lab("Role", f.role),
        lab("Working on", f.workingOn),
        lab("Research interests", f.interests),
        lab("Email", f.email),
        el("details", { className: "links-box", open: LINK_FIELDS.some(([k]) => L[k]) || !!L.otherUrl },
          el("summary", {}, "Links"),
          el("p", { className: "muted hint", textContent: "Fill in any that apply. Empty ones are hidden. Each shows as a pill button on the card." }),
          el("div", { className: "two-eq" },
            ...LINK_FIELDS.map(([k, label]) => lab(label, linkInputs[k])),
            el("div", {}, el("label", { textContent: "Other link label" }), f.otherLabel, el("div", { className: "muted hint", textContent: "e.g. lab page, portfolio, get involved" })),
            el("div", {}, el("label", { textContent: "Other link" }), f.otherUrl, el("div", { className: "muted hint", textContent: "https://… or #get-involved" })))),
        el("div", { className: "actions" },
          el("button", { className: "btn primary", textContent: isNew ? "Add to website" : "Save", onclick: save }),
          delBtn, msg)));
  };

  const list = el("div", { className: "tlist" }, members.map(card));
  const addBtn = el("button", { className: "btn primary", textContent: "+ Add team member", onclick: () => { list.prepend(card({})); window.scrollTo({ top: list.offsetTop - 90, behavior: "smooth" }); } });

  const importBox = members.length ? null : el("div", { className: "callout" },
    el("p", { textContent: "No team members on the website yet. Start with the six members from the current Notion page (photos can be added afterwards)?" }),
    el("button", { className: "btn primary", textContent: "Import starter list", onclick: async (e) => {
      e.target.disabled = true;
      try {
        await Promise.all(STARTER.map((m, i) => setDoc(doc(db, "team", `starter-${i + 1}`), { ...m, workingOn: "", interests: "", photo: "", order: i + 1, updatedBy: me(), updatedAt: serverTimestamp() })));
        rerender();
      } catch (err) { e.target.disabled = false; e.target.after(el("p", { className: "error", textContent: err.message })); }
    } }));

  view.replaceChildren(
    el("div", { className: "crumb" }, "Public website"),
    el("div", { className: "page-head" },
      el("h1", {}, "👥 Team (Who We Are page)"),
      el("div", { className: "tools" }, el("a", { className: "btn", href: "index.html#team", target: "_blank", textContent: "View on website ↗" }))),
    el("p", { className: "muted", textContent: "Changes here appear on the public Who We Are page immediately. Empty fields are simply hidden. Lower order numbers come first." }),
    introBox, importBox, el("div", { style: "margin:20px 0" }, addBtn), list);
}
