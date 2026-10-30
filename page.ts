// The scripts of the CV pages, after violethpark/workspace plan-page.mts
// (51087a6). convert.ts inlines String(fn) of each, so they may use no
// imports or names from outside the function; the storage key is written in
// both. The page works without them, following the system theme.

// In <head>, before the first paint: the theme the reader picked last, so a
// dark choice does not flash light. Storage may be missing or refused
// (file:// in some browsers, private windows); then the system decides.
export function applyTheme(): void {
  try {
    const theme = localStorage.getItem("cv-theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  } catch {
    // The system theme stays.
  }
}

// At the end of <body>: the theme buttons, the section buttons, the current
// section in the table of contents and the panel, and closing the contents
// drawer after a jump.
export function enhance(): void {
  const root = document.documentElement;
  root.classList.add("js");
  // Auto (the system), light, dark, and around again. Each button carries
  // its labels in the page's language (data-auto, data-light, data-dark);
  // style.css picks its icon from the root's data-theme.
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>(".theme-toggle"),
  ];
  const theme = () =>
    root.dataset.theme === "light" || root.dataset.theme === "dark"
      ? root.dataset.theme
      : "auto";
  const label = () => {
    for (const button of buttons) {
      const text = button.dataset[theme()] ?? theme();
      const name = button.querySelector(".theme-label");
      if (name) name.textContent = text;
      // The bar shows the icon alone; a pointer still finds the name.
      button.title = text;
      button.hidden = false;
    }
  };
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const next = ({ auto: "light", light: "dark", dark: "auto" } as const)[
        theme()
      ];
      if (next === "auto") delete root.dataset.theme;
      else root.dataset.theme = next;
      try {
        if (next === "auto") localStorage.removeItem("cv-theme");
        else localStorage.setItem("cv-theme", next);
      } catch {
        // Not kept for the next page; this one still changes.
      }
      label();
    });
  }
  label();
  // Each section's button opens and closes what the panel would show.
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    ".section-toggle",
  )) {
    const info = document.getElementById(
      button.getAttribute("aria-controls") ?? "",
    );
    if (!info) continue;
    button.hidden = false;
    button.addEventListener("click", () => {
      info.hidden = !info.hidden;
      button.setAttribute("aria-expanded", String(!info.hidden));
    });
  }
  const toc = document.getElementById("cv.toc");
  let section = "";
  const marks = [
    ...document.querySelectorAll<HTMLElement>("main :is(h2, h3)[id]"),
  ].map((heading) => {
    if (heading.tagName === "H2") section = heading.id;
    const link = toc?.querySelector(`a[href="#${CSS.escape(heading.id)}"]`);
    return { heading, section, link };
  });
  const panels = [...document.querySelectorAll<HTMLElement>(".panel-section")];
  const branches = [
    ...(toc?.querySelectorAll<HTMLElement>("li[data-section]") ?? []),
  ];
  let current: (typeof marks)[number] | undefined;
  let shown: string | undefined;
  const top = (m: (typeof marks)[number]) =>
    m.heading.getBoundingClientRect().top;
  const shows = (m: (typeof marks)[number]) =>
    top(m) >= 0 && top(m) < innerHeight;
  const hash = () => {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return "";
    }
  };
  // The current heading is the last one above the top 30% of the window;
  // above the first one, the first section's panel shows. At the end of the
  // page a short last section never reaches that line, so there it is the
  // heading the address points at, when it shows, or else the last heading
  // that shows.
  const update = () => {
    const line = innerHeight * 0.3;
    let found = marks.findLast((m) => top(m) <= line);
    if (scrollY + innerHeight >= root.scrollHeight - 2) {
      const picked = hash();
      found =
        marks.find((m) => m.heading.id === picked && shows(m)) ??
        marks.findLast(shows) ??
        found;
    }
    if (found !== current) {
      current?.link?.removeAttribute("aria-current");
      found?.link?.setAttribute("aria-current", "true");
      current = found;
    }
    const open = found?.section || panels[0]?.dataset.section || "";
    if (open === shown) return;
    shown = open;
    for (const li of branches)
      li.classList.toggle("open", li.dataset.section === open);
    for (const p of panels)
      p.classList.toggle("current", p.dataset.section === open);
  };
  // Every scroll, at most once a frame: a jump from one section's text to
  // another's may cross no heading at a watched line, so watching headings
  // (IntersectionObserver) misses it.
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  // A link to a heading that already shows at the end scrolls nothing.
  addEventListener("hashchange", schedule);
  update();
  if (!toc) return;
  toc.addEventListener("click", (event) => {
    const link = event.target instanceof Element && event.target.closest("a");
    if (link && toc.matches(":popover-open")) toc.hidePopover();
  });
  // From this width the contents are a sidebar, not a drawer.
  matchMedia("(min-width: 60rem)").addEventListener("change", (wide) => {
    if (wide.matches && toc.matches(":popover-open")) toc.hidePopover();
  });
}
