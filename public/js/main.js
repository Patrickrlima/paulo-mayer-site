(function(){
  "use strict";

  /* =================================================================
     CONFIGURAÇÃO — editar aqui
     ================================================================= */

  // TODO: trocar pelo número real de WhatsApp, formato 55DDDNÚMERO
  var WHATSAPP_NUMBER = "5500000000000";

  // TODO: substituir por vídeos reais {title, embed}
  // embed: URL de embed do YouTube (https://www.youtube.com/embed/ID)
  // ou Instagram. Deixe embed:null enquanto não houver vídeo.
  var VIDEOS = [
    { title: "Show ao vivo — vídeo a adicionar", embed: null },
    { title: "Bastidores — vídeo a adicionar", embed: null },
    { title: "Apresentação especial — vídeo a adicionar", embed: null }
  ];

  // TODO: substituir os quadros por fotos reais do artista.
  var GALLERY = [
    { caption: "Palco — foto a inserir", big: true },
    { caption: "Bastidores — foto a inserir" },
    { caption: "Público — foto a inserir" },
    { caption: "Retrato — foto a inserir", tall: true },
    { caption: "Apresentação — foto a inserir" },
    { caption: "Detalhe — foto a inserir" }
  ];

  function waLink(number, text){
    var base = "https://wa.me/" + number;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }

  var directLink = waLink(WHATSAPP_NUMBER, "Olá! Gostaria de saber mais sobre a contratação do Paulo Mayer para um evento.");
  document.getElementById("waDirectLink").href = directLink;
  document.getElementById("waFooterLink").href = directLink;
  document.getElementById("waFloat").addEventListener("click", function(){ window.open(directLink, "_blank", "noopener"); });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------- cursor spotlight ---------------- */
  (function(){
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var glow = document.getElementById("cursorGlow");
    var shadow = document.getElementById("cursorShadow");
    if(reduceMotion || !canHover){
      glow.style.display = "none";
      shadow.style.display = "none";
      return;
    }
    var root = document.documentElement;
    var raf = null, x = null, y = null;
    function apply(){
      root.style.setProperty("--mx", x + "px");
      root.style.setProperty("--my", y + "px");
      raf = null;
    }
    document.addEventListener("mousemove", function(e){
      x = e.clientX; y = e.clientY;
      if(raf === null) raf = requestAnimationFrame(apply);
    }, { passive: true });
  })();

  /* ---------------- nav scroll state ---------------- */
  var nav = document.getElementById("topo");
  function onScroll(){ nav.classList.toggle("is-scrolled", window.scrollY > 12); }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById("burgerBtn");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMenu(){ burger.setAttribute("aria-expanded","false"); mobileMenu.classList.remove("is-open"); }
  function toggleMenu(){
    var open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    mobileMenu.classList.toggle("is-open", !open);
  }
  burger.addEventListener("click", toggleMenu);
  mobileMenu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeMenu(); });

  /* ---------------- reveal on scroll ----------------
     Elements are visible at rest by CSS (no opacity:0 default). This only
     layers a one-time entrance animation on top via the Web Animations
     API when an element scrolls into view — if JS or the observer never
     runs, the content is already fully visible. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if(!reduceMotion && "IntersectionObserver" in window && "animate" in Element.prototype){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.animate(
            [{ opacity: 0, transform: "translateY(22px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 700, easing: "ease", fill: "backwards" }
          );
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---------------- media-frame helper ---------------- */
  function mediaFrameHTML(label, extraClass){
    return '<div class="media-frame ' + (extraClass||'') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
      '<span class="media-frame__label">' + label + '</span></div>';
  }

  /* ---------------- videos grid ---------------- */
  var videoGrid = document.getElementById("videoGrid");
  VIDEOS.forEach(function(v, i){
    var card = document.createElement("button");
    card.className = "video-card";
    card.type = "button";
    card.setAttribute("aria-haspopup","dialog");
    card.innerHTML =
      '<span class="video-card__thumb">' +
        '<span class="video-card__play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
      '</span>' +
      '<span class="video-card__title">' + v.title + '</span>' +
      '<span class="video-card__meta">Paulo Mayer</span>';
    card.addEventListener("click", function(){ openVideoModal(i); });
    videoGrid.appendChild(card);
  });

  var videoModal = document.getElementById("videoModal");
  var videoModalContent = document.getElementById("videoModalContent");
  function openVideoModal(i){
    var v = VIDEOS[i];
    if(v.embed){
      videoModalContent.innerHTML = '<div class="video-modal__frame"><iframe src="' + v.embed + '" title="' + v.title + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p class="video-modal__title">' + v.title + '</p>';
    } else {
      videoModalContent.innerHTML = '<div class="video-modal__frame"><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" style="width:36px;height:36px;color:var(--gold);margin:0 auto 1em"><path d="M8 5v14l11-7z"/></svg><p style="color:var(--ink-dim);max-width:32ch">Vídeo em breve — adicione o link do YouTube ou Instagram no array VIDEOS.</p></div></div><p class="video-modal__title">' + v.title + '</p>';
    }
    openOverlay(videoModal);
  }
  document.getElementById("videoModalClose").addEventListener("click", function(){ closeOverlay(videoModal); videoModalContent.innerHTML=""; });

  /* ---------------- gallery + lightbox ---------------- */
  var galleryGrid = document.getElementById("galleryGrid");
  GALLERY.forEach(function(g, i){
    var btn = document.createElement("button");
    btn.type = "button";
    if(g.big) btn.classList.add("g-span-2");
    if(g.tall) btn.classList.add("g-row-2");
    btn.innerHTML = mediaFrameHTML(g.caption);
    btn.addEventListener("click", function(){ openLightbox(i); });
    galleryGrid.appendChild(btn);
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxContent = document.getElementById("lightboxContent");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lbIndex = 0;
  function renderLightbox(){
    var g = GALLERY[lbIndex];
    lightboxContent.innerHTML = mediaFrameHTML(g.caption);
    lightboxCaption.textContent = (lbIndex+1) + " / " + GALLERY.length + " — " + g.caption;
  }
  function openLightbox(i){ lbIndex = i; renderLightbox(); openOverlay(lightbox); }
  document.getElementById("lightboxPrev").addEventListener("click", function(){ lbIndex = (lbIndex - 1 + GALLERY.length) % GALLERY.length; renderLightbox(); });
  document.getElementById("lightboxNext").addEventListener("click", function(){ lbIndex = (lbIndex + 1) % GALLERY.length; renderLightbox(); });
  document.getElementById("lightboxClose").addEventListener("click", function(){ closeOverlay(lightbox); });

  /* ---------------- overlay helpers ---------------- */
  var activeOverlay = null;
  function openOverlay(el){
    el.classList.add("is-open");
    activeOverlay = el;
    document.body.style.overflow = "hidden";
  }
  function closeOverlay(el){
    el.classList.remove("is-open");
    if(activeOverlay === el) activeOverlay = null;
    document.body.style.overflow = "";
  }
  [lightbox, videoModal].forEach(function(el){
    el.addEventListener("click", function(e){ if(e.target === el) closeOverlay(el); });
  });
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape" || !activeOverlay) return;
    closeOverlay(activeOverlay);
    videoModalContent.innerHTML = "";
  });
  document.addEventListener("keydown", function(e){
    if(activeOverlay !== lightbox) return;
    if(e.key === "ArrowRight") document.getElementById("lightboxNext").click();
    if(e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
  });

  /* ---------------- booking form -> whatsapp ---------------- */
  var form = document.getElementById("bookingForm");
  var formStatus = document.getElementById("formStatus");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    var d = new FormData(form);
    var lines = [
      "Olá! Gostaria de solicitar um orçamento para contratação do Paulo Mayer.",
      "",
      "Nome: " + (d.get("nome") || "-"),
      "WhatsApp: " + (d.get("whatsapp") || "-"),
      "E-mail: " + (d.get("email") || "-"),
      "Tipo de evento: " + (d.get("tipo") || "-"),
      "Cidade: " + (d.get("cidade") || "-"),
      "Data do evento: " + (d.get("data") || "-"),
      "Convidados (aprox.): " + (d.get("convidados") || "-"),
      "Mensagem: " + (d.get("mensagem") || "-")
    ];
    window.open(waLink(WHATSAPP_NUMBER, lines.join("\n")), "_blank", "noopener");
    formStatus.textContent = "Abrindo o WhatsApp com sua solicitação...";
  });

  /* ---------------- agenda (próximos shows) ----------------
     Reads from /api/shows, served by the Cloudflare Pages Function in
     /functions/api/shows.js. That endpoint only exists once this project
     is deployed to Cloudflare Pages with the SHOWS_KV namespace bound —
     on any other host (a plain static preview, file://, etc.) the fetch
     fails and the section just falls back to the empty state below. */
  var MESES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

  function formatDateParts(isoDate){
    var parts = String(isoDate || "").split("-");
    if(parts.length !== 3) return null;
    var y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2]);
    if(!y || !m || !d) return null;
    return { day: String(d).padStart(2, "0"), month: MESES[m - 1] || "" };
  }

  function escapeHTML(str){
    return String(str == null ? "" : str).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  function renderAgendaEmpty(container){
    container.innerHTML =
      '<div class="agenda__empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>' +
        '<p>Nenhuma data confirmada no momento.<br>Siga o Instagram pra ficar por dentro dos próximos shows.</p>' +
      '</div>';
  }

  function renderAgenda(container, shows){
    if(!shows || !shows.length){ renderAgendaEmpty(container); return; }
    container.innerHTML = '<div class="agenda__list"></div>';
    var list = container.querySelector(".agenda__list");
    shows.forEach(function(show){
      var parts = formatDateParts(show.data);
      var metaBits = [];
      if(show.cidade) metaBits.push(escapeHTML(show.cidade));
      if(show.horario) metaBits.push(escapeHTML(show.horario));
      var item = document.createElement("div");
      item.className = "agenda__item";
      item.innerHTML =
        '<div class="agenda__date">' +
          '<span class="agenda__date-day">' + (parts ? parts.day : "—") + '</span>' +
          '<span class="agenda__date-month">' + (parts ? parts.month : "") + '</span>' +
        '</div>' +
        '<div class="agenda__body">' +
          '<div class="agenda__local">' + escapeHTML(show.local || "Local a confirmar") + '</div>' +
          (metaBits.length ? '<div class="agenda__meta">' + metaBits.join(" · ") + '</div>' : "") +
        '</div>' +
        (show.linkIngresso
          ? '<a class="btn btn-ghost agenda__cta" href="' + escapeHTML(show.linkIngresso) + '" target="_blank" rel="noopener">Ingressos</a>'
          : "");
      list.appendChild(item);
    });
  }

  var agendaList = document.getElementById("agendaList");
  if(agendaList){
    fetch("/api/shows")
      .then(function(res){ if(!res.ok) throw new Error("bad response"); return res.json(); })
      .then(function(data){ renderAgenda(agendaList, data && data.shows); })
      .catch(function(){ renderAgendaEmpty(agendaList); });
  }

})();
