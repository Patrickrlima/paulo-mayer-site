(function () {
  "use strict";

  var loginScreen = document.getElementById("loginScreen");
  var panelScreen = document.getElementById("panelScreen");
  var loginForm = document.getElementById("loginForm");
  var loginError = document.getElementById("loginError");
  var logoutBtn = document.getElementById("logoutBtn");

  var showForm = document.getElementById("showForm");
  var formTitle = document.getElementById("formTitle");
  var formStatus = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");
  var cancelEditBtn = document.getElementById("cancelEditBtn");
  var showsList = document.getElementById("showsList");

  function showLogin() {
    loginScreen.hidden = false;
    panelScreen.hidden = true;
    logoutBtn.hidden = true;
  }

  function showPanel() {
    loginScreen.hidden = true;
    panelScreen.hidden = false;
    logoutBtn.hidden = false;
  }

  function resetForm() {
    showForm.reset();
    document.getElementById("showId").value = "";
    formTitle.textContent = "Novo show";
    submitBtn.textContent = "Salvar show";
    cancelEditBtn.hidden = true;
    formStatus.textContent = "";
  }

  function formatDateBR(iso) {
    var parts = String(iso || "").split("-");
    if (parts.length !== 3) return iso || "—";
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function isPast(iso) {
    var today = new Date().toISOString().slice(0, 10);
    return iso < today;
  }

  function escapeHTML(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderList(shows) {
    if (!shows.length) {
      showsList.innerHTML = '<p class="admin__empty">Nenhum show cadastrado ainda.</p>';
      return;
    }
    var sorted = shows.slice().sort(function (a, b) { return (a.data || "").localeCompare(b.data || ""); });
    showsList.innerHTML = "";
    sorted.forEach(function (show) {
      var row = document.createElement("div");
      row.className = "admin__row" + (isPast(show.data) ? " admin__row--past" : "");
      var metaBits = [];
      if (show.cidade) metaBits.push(escapeHTML(show.cidade));
      if (show.horario) metaBits.push(escapeHTML(show.horario));
      row.innerHTML =
        '<div class="admin__row-date">' + formatDateBR(show.data) + "</div>" +
        '<div class="admin__row-body">' +
          '<div class="admin__row-local">' + escapeHTML(show.local || "(sem nome)") +
            (isPast(show.data) ? '<span class="admin__row-tag">passado</span>' : "") +
          "</div>" +
          (metaBits.length ? '<div class="admin__row-meta">' + metaBits.join(" · ") + "</div>" : "") +
        "</div>" +
        '<div class="admin__row-actions">' +
          '<button type="button" data-action="edit">Editar</button>' +
          '<button type="button" data-action="delete" class="is-danger">Excluir</button>' +
        "</div>";
      row.querySelector('[data-action="edit"]').addEventListener("click", function () { startEdit(show); });
      row.querySelector('[data-action="delete"]').addEventListener("click", function () { deleteShow(show); });
      showsList.appendChild(row);
    });
  }

  function startEdit(show) {
    document.getElementById("showId").value = show.id;
    document.getElementById("showData").value = show.data || "";
    document.getElementById("showHorario").value = show.horario || "";
    document.getElementById("showLocal").value = show.local || "";
    document.getElementById("showCidade").value = show.cidade || "";
    document.getElementById("showLink").value = show.linkIngresso || "";
    document.getElementById("showObs").value = show.observacao || "";
    formTitle.textContent = "Editar show";
    submitBtn.textContent = "Salvar alterações";
    cancelEditBtn.hidden = false;
    showForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteShow(show) {
    var label = (show.local || "este show") + (show.data ? " em " + formatDateBR(show.data) : "");
    if (!confirm('Excluir "' + label + '"? Essa ação não pode ser desfeita.')) return;
    try {
      var res = await fetch("/api/shows", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: show.id }),
      });
      if (!res.ok) throw new Error("delete failed");
      await loadShows();
    } catch {
      alert("Não foi possível excluir agora. Tente de novo em instantes.");
    }
  }

  async function loadShows() {
    try {
      var res = await fetch("/api/shows");
      var data = await res.json();
      if (!data.admin) { showLogin(); return; }
      showPanel();
      renderList(data.shows || []);
    } catch {
      // Falha de rede/API (ou o backend ainda não foi configurado — veja o
      // README). Sem confirmação de sessão, o mais seguro é mostrar a tela
      // de login em vez de deixar o painel visível com dados incertos.
      showLogin();
      loginError.textContent = "Não foi possível conectar ao servidor. Verifique se o site já está configurado (veja o README) e tente novamente.";
    }
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var password = document.getElementById("loginPassword").value;
    try {
      var res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password }),
      });
      var data = await res.json();
      if (!res.ok || !data.ok) {
        loginError.textContent = data.error || "Não foi possível entrar.";
        return;
      }
      document.getElementById("loginPassword").value = "";
      await loadShows();
    } catch {
      loginError.textContent = "Falha de conexão. Tente de novo.";
    }
  });

  logoutBtn.addEventListener("click", async function () {
    try { await fetch("/api/logout", { method: "POST" }); } catch {}
    showLogin();
  });

  cancelEditBtn.addEventListener("click", resetForm);

  showForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var id = document.getElementById("showId").value;
    var payload = {
      data: document.getElementById("showData").value,
      horario: document.getElementById("showHorario").value,
      local: document.getElementById("showLocal").value,
      cidade: document.getElementById("showCidade").value,
      linkIngresso: document.getElementById("showLink").value,
      observacao: document.getElementById("showObs").value,
    };
    if (id) payload.id = id;

    formStatus.textContent = "Salvando...";
    try {
      var res = await fetch("/api/shows", {
        method: id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (!res.ok || !data.ok) {
        formStatus.textContent = data.error || "Não foi possível salvar.";
        return;
      }
      resetForm();
      formStatus.textContent = "Show salvo.";
      await loadShows();
    } catch {
      formStatus.textContent = "Falha de conexão. Tente de novo.";
    }
  });

  loadShows();
})();
