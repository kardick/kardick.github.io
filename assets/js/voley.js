(() => {
  "use strict";

  // =========================================================
  // ALMACENAMIENTO
  // =========================================================

  const LEGACY_STORAGE_KEY = "voleyPlayersV1";
  const GROUPS_STORAGE_KEY = "voleyGroupsV1";
  const ACTIVE_GROUP_KEY = "voleyActiveGroupV1";

  const state = {
    groups: [],
    activeGroupId: null,
    lastTeams: null,
    lastSuggestions: null
  };

  // =========================================================
  // ELEMENTOS
  // =========================================================

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    // Grupos
    groupSelect: $("#group-select"),
    addGroup: $("#add-group-btn"),
    editGroup: $("#edit-group-btn"),
    groupPlace: $("#group-place"),
    groupDays: $("#group-days"),
    groupTime: $("#group-time"),

    groupDialog: $("#group-dialog"),
    groupForm: $("#group-form"),
    groupDialogTitle: $("#group-dialog-title"),
    groupDialogClose: $("#group-dialog-close"),
    groupId: $("#group-id"),
    groupName: $("#group-name"),
    groupPlaceInput: $("#group-place-input"),
    groupDaysInput: $("#group-days-input"),
    groupStartTimeInput: $("#group-start-time-input"),
    groupEndTimeInput: $("#group-end-time-input"),
    deleteGroup: $("#delete-group-btn"),
    cancelGroup: $("#cancel-group-btn"),

    // Jugadores
    body: $("#players-body"),
    empty: $("#empty-state"),
    total: $("#total-players"),
    selected: $("#selected-players"),
    addPlayer: $("#add-player-btn"),
    toggleAll: $("#toggle-all-btn"),

    // Sorteo
    draw: $("#draw-btn"),
    redraw: $("#redraw-btn"),
    status: $("#status-message"),
    results: $("#results-section"),
    teams: $("#teams-grid"),
    balance: $("#balance-card"),
    suggestions: $("#rotation-suggestions"),
    format15Wrap: $("#format-15-wrap"),
    format15Inputs: $$('input[name="format-15"]'),

    // Diálogo jugador
    playerDialog: $("#player-dialog"),
    playerForm: $("#player-form"),
    dialogTitle: $("#dialog-title"),
    dialogClose: $("#dialog-close"),
    cancelPlayer: $("#cancel-player-btn"),
    playerId: $("#player-id"),
    playerName: $("#player-name"),
    playerLevel: $("#player-level"),
    playerToday: $("#player-today"),
    positionsGroup: $("#positions-group")
  };

  // =========================================================
  // UTILIDADES
  // =========================================================

  function uid(prefix = "id") {
    if (crypto?.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  function formatTime(value) {
    if (!value) return "—";

    const [hours, minutes] = value.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return value;
    }

    const d = new Date();
    d.setHours(hours, minutes, 0, 0);

    return d.toLocaleTimeString("es-PE", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function formatSchedule(startTime, endTime) {
    if (!startTime && !endTime) {
      return "—";
    }

    if (startTime && endTime) {
      return `${formatTime(startTime)} – ${formatTime(endTime)}`;
    }

    if (startTime) {
      return `Desde ${formatTime(startTime)}`;
    }

    return `Hasta ${formatTime(endTime)}`;
  }

  function normalizePlayer(player = {}) {
    return {
      id: player.id || uid("player"),
      name: String(player.name || "").trim(),
      positions: Array.isArray(player.positions)
        ? player.positions.filter((p) =>
            ["arme", "ataque", "defensa"].includes(p)
          )
        : [],
      level: Math.min(
        5,
        Math.max(1, Number(player.level) || 3)
      ),
      today: player.today !== false
    };
  }

  function normalizeGroup(group = {}) {
    return {
      id: group.id || uid("group"),
      name: String(group.name || "Grupo").trim(),
      place: String(group.place || "").trim(),
      days: String(group.days || "").trim(),
      startTime: String(group.startTime || group.time || "").trim(),
      endTime: String(group.endTime || "").trim(),
      players: Array.isArray(group.players)
        ? group.players.map(normalizePlayer)
        : []
    };
  }

  function activeGroup() {
    return (
      state.groups.find(
        (group) => group.id === state.activeGroupId
      ) || null
    );
  }

  function players() {
    return activeGroup()?.players || [];
  }

  function selectedPlayers() {
    return players().filter((player) => player.today);
  }

  function isValidPlayerCount(count) {
    return count === 12 || (count >= 15 && count <= 18);
  }

  function resetResults() {
    state.lastTeams = null;
    state.lastSuggestions = null;

    els.results.hidden = true;
    els.teams.innerHTML = "";
    els.balance.innerHTML = "";
    els.suggestions.innerHTML = "";
    els.suggestions.hidden = true;
    els.redraw.disabled = true;
  }

  // =========================================================
  // ALMACENAMIENTO Y MIGRACIÓN
  // =========================================================

  function save() {
    localStorage.setItem(
      GROUPS_STORAGE_KEY,
      JSON.stringify(state.groups)
    );

    if (state.activeGroupId) {
      localStorage.setItem(
        ACTIVE_GROUP_KEY,
        state.activeGroupId
      );
    }
  }

  function load() {
    let loadedGroups = [];

    try {
      const storedGroups = JSON.parse(
        localStorage.getItem(GROUPS_STORAGE_KEY) || "[]"
      );

      if (Array.isArray(storedGroups)) {
        loadedGroups = storedGroups.map(normalizeGroup);
      }
    } catch (error) {
      console.error("No se pudieron cargar los grupos:", error);
    }

    // Migración automática desde la versión antigua
    if (!loadedGroups.length) {
      let legacyPlayers = [];

      try {
        const legacy = JSON.parse(
          localStorage.getItem(LEGACY_STORAGE_KEY) || "[]"
        );

        if (Array.isArray(legacy)) {
          legacyPlayers = legacy.map(normalizePlayer);
        }
      } catch (error) {
        console.error(
          "No se pudo leer la lista antigua:",
          error
        );
      }

      loadedGroups = [
        {
          id: uid("group"),
          name: "Grupo principal",
          place: "",
          days: "",
          startTime: "",
          endTime: "",
          players: legacyPlayers
        }
      ];

      // No borramos voleyPlayersV1.
      // Queda como respaldo de la lista antigua.
    }

    state.groups = loadedGroups;

    const storedActiveId =
      localStorage.getItem(ACTIVE_GROUP_KEY);

    if (
      storedActiveId &&
      state.groups.some(
        (group) => group.id === storedActiveId
      )
    ) {
      state.activeGroupId = storedActiveId;
    } else {
      state.activeGroupId = state.groups[0].id;
    }

    save();
  }

  // =========================================================
  // GRUPOS
  // =========================================================

  function renderGroupSelector() {
    els.groupSelect.innerHTML = state.groups
      .map(
        (group) => `
          <option
            value="${escapeHtml(group.id)}"
            ${
              group.id === state.activeGroupId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(group.name)}
          </option>
        `
      )
      .join("");
  }

  function renderGroupInfo() {
    const group = activeGroup();

    if (!group) {
      els.groupPlace.textContent = "—";
      els.groupDays.textContent = "—";
      els.groupTime.textContent = "—";
      return;
    }

    els.groupPlace.textContent = group.place || "—";
    els.groupDays.textContent = group.days || "—";
    els.groupTime.textContent = formatSchedule(
    group.startTime,
    group.endTime
    );
  }

  function renderGroups() {
    renderGroupSelector();
    renderGroupInfo();
  }

  function openGroupDialog(group = null) {
    els.groupForm.reset();

    if (group) {
      els.groupDialogTitle.textContent = "Editar grupo";
      els.groupId.value = group.id;
      els.groupName.value = group.name;
      els.groupPlaceInput.value = group.place || "";
      els.groupDaysInput.value = group.days || "";
      els.groupStartTimeInput.value = group.startTime || "";
      els.groupEndTimeInput.value = group.endTime || "";

      els.deleteGroup.hidden = false;
    } else {
      els.groupDialogTitle.textContent = "Nuevo grupo";
      els.groupId.value = "";
      els.deleteGroup.hidden = true;
    }

    els.groupDialog.showModal();

    requestAnimationFrame(() => {
      els.groupName.focus();
    });
  }

  function closeGroupDialog() {
    els.groupDialog.close();
  }

  function saveGroupFromForm(event) {
    event.preventDefault();

    const name = els.groupName.value.trim();

    if (!name) {
      els.groupName.focus();
      return;
    }

    const id = els.groupId.value;

    if (id) {
      const group = state.groups.find(
        (item) => item.id === id
      );

      if (!group) return;

      group.name = name;
      group.place = els.groupPlaceInput.value.trim();
      group.days = els.groupDaysInput.value.trim();
      group.startTime = els.groupStartTimeInput.value.trim();
      group.endTime = els.groupEndTimeInput.value.trim();
    } else {
      const group = {
        id: uid("group"),
        name,
        place: els.groupPlaceInput.value.trim(),
        days: els.groupDaysInput.value.trim(),
        startTime: els.groupStartTimeInput.value.trim(),
        endTime: els.groupEndTimeInput.value.trim(),
        players: []
      };

      state.groups.push(group);
      state.activeGroupId = group.id;
    }

    save();
    closeGroupDialog();
    resetResults();
    renderAll();
  }

  function deleteActiveGroup() {
    const id = els.groupId.value;

    if (!id) return;

    if (state.groups.length <= 1) {
      alert(
        "Debe existir al menos un grupo. No puedes eliminar el único grupo."
      );
      return;
    }

    const group = state.groups.find(
      (item) => item.id === id
    );

    if (!group) return;

    const confirmed = confirm(
      `¿Eliminar el grupo "${group.name}"?\n\nTambién se eliminarán los jugadores registrados dentro de este grupo.`
    );

    if (!confirmed) return;

    state.groups = state.groups.filter(
      (item) => item.id !== id
    );

    if (state.activeGroupId === id) {
      state.activeGroupId = state.groups[0].id;
    }

    save();
    closeGroupDialog();
    resetResults();
    renderAll();
  }

  function changeGroup() {
    state.activeGroupId = els.groupSelect.value;
    save();
    resetResults();
    renderAll();
  }

  // =========================================================
  // JUGADORES
  // =========================================================

  function positionLabel(position) {
    return {
      arme: "Arme",
      ataque: "Ataque",
      defensa: "Defensa"
    }[position] || position;
  }

  function playerPositionsHtml(player) {
    if (!player.positions.length) {
      return `<span class="voley-muted">Sin definir</span>`;
    }

    return player.positions
      .map(
        (position) =>
          `<span class="voley-tag">${positionLabel(
            position
          )}</span>`
      )
      .join(" ");
  }

  function renderPlayers() {
    const list = [...players()].sort((a, b) =>
      a.name.localeCompare(b.name, "es", {
        sensitivity: "base"
      })
    );

    els.body.innerHTML = list
      .map(
        (player, index) => `
          <tr>
            <td>${index + 1}</td>

            <td>
              <input
                class="voley-today-checkbox"
                type="checkbox"
                data-player-id="${escapeHtml(player.id)}"
                ${player.today ? "checked" : ""}
                aria-label="Juega hoy"
              >
            </td>

            <td>
              <strong>${escapeHtml(player.name)}</strong>
            </td>

            <td>
              ${playerPositionsHtml(player)}
            </td>

            <td>
              <span class="voley-level">
                ${player.level}
              </span>
            </td>

            <td>
              <div class="voley-row-actions">
                <button
                  class="voley-icon-btn edit-player-btn"
                  type="button"
                  data-player-id="${escapeHtml(player.id)}"
                  title="Editar jugador"
                >
                  ✏️
                </button>

                <button
                  class="voley-icon-btn delete-player-btn"
                  type="button"
                  data-player-id="${escapeHtml(player.id)}"
                  title="Eliminar jugador"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");

    const selectedCount = selectedPlayers().length;

    update15FormatVisibility(selectedCount);

    els.total.textContent = players().length;
    els.selected.textContent = selectedCount;
    els.empty.hidden = players().length > 0;

    els.draw.disabled = !isValidPlayerCount(selectedCount);

    updateStatus(selectedCount);
    updateToggleAllButton();

    bindPlayerTableEvents();
  }

  function updateStatus(count) {
    if (count < 12) {
      els.status.textContent =
        `Faltan ${12 - count} jugador${
          12 - count === 1 ? "" : "es"
        } para poder formar 2 equipos completos.`;
      return;
    }

    if (count === 12) {
      els.status.textContent =
        "12 jugadores seleccionados: se formarán 2 equipos de 6.";
      return;
    }

    if (count === 13 || count === 14) {
      els.status.textContent =
        `${count} jugadores no es una cantidad válida. ` +
        `Debes tener 12 o entre 15 y 18 jugadores.`;
      return;
    }

    if (count === 15) {
      if (selected15Format() === "5-5-5") {
        els.status.textContent =
          "15 jugadores: se formarán 3 equipos completos de 5.";
      } else {
        els.status.textContent =
          "15 jugadores: se formarán equipos de 6 / 6 / 3. El Equipo 3 necesitará 3 jugadores del equipo que pierda.";
      }

      return;
    }

    if (count === 16) {
      els.status.textContent =
        "16 jugadores: se formarán equipos de 6 / 6 / 4. El Equipo 3 necesitará 2 jugadores del equipo que pierda.";
      return;
    }

    if (count === 17) {
      els.status.textContent =
        "17 jugadores: se formarán equipos de 6 / 6 / 5. El Equipo 3 necesitará 1 jugador del equipo que pierda.";
      return;
    }

    if (count === 18) {
      els.status.textContent =
        "18 jugadores seleccionados: se formarán 3 equipos completos de 6.";
      return;
    }

    els.status.textContent =
      `${count} jugadores seleccionados. ` +
      `El máximo permitido es 18; desmarca ${count - 18}.`;
  }

  function updateToggleAllButton() {
    const list = players();

    if (!list.length) {
      els.toggleAll.textContent = "☑ Marcar todos";
      return;
    }

    const allSelected = list.every(
      (player) => player.today
    );

    els.toggleAll.textContent = allSelected
      ? "☐ Desmarcar todos"
      : "☑ Marcar todos";
  }

  function bindPlayerTableEvents() {
    $$(".voley-today-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const player = players().find(
          (item) => item.id === checkbox.dataset.playerId
        );

        if (!player) return;

        player.today = checkbox.checked;

        save();
        resetResults();
        renderPlayers();
      });
    });

    $$(".edit-player-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const player = players().find(
          (item) => item.id === button.dataset.playerId
        );

        if (player) {
          openPlayerDialog(player);
        }
      });
    });

    $$(".delete-player-btn").forEach((button) => {
      button.addEventListener("click", () => {
        deletePlayer(button.dataset.playerId);
      });
    });
  }

  function openPlayerDialog(player = null) {
    els.playerForm.reset();

    els.playerId.value = player?.id || "";
    els.dialogTitle.textContent = player
      ? "Editar jugador"
      : "Agregar jugador";

    els.playerName.value = player?.name || "";
    els.playerLevel.value = String(
      player?.level || 3
    );

    els.playerToday.checked = player
      ? player.today
      : true;

    $$("#positions-group input").forEach(
      (checkbox) => {
        checkbox.checked = Boolean(
          player?.positions?.includes(checkbox.value)
        );
      }
    );

    els.playerDialog.showModal();

    requestAnimationFrame(() => {
      els.playerName.focus();
    });
  }

  function closePlayerDialog() {
    els.playerDialog.close();
  }

  function savePlayerFromForm(event) {
    event.preventDefault();

    const group = activeGroup();

    if (!group) return;

    const name = els.playerName.value.trim();

    if (!name) {
      els.playerName.focus();
      return;
    }

    const positions = $$("#positions-group input:checked")
      .map((checkbox) => checkbox.value);

    const data = {
      name,
      positions,
      level: Number(els.playerLevel.value),
      today: els.playerToday.checked
    };

    const id = els.playerId.value;

    if (id) {
      const player = group.players.find(
        (item) => item.id === id
      );

      if (!player) return;

      Object.assign(player, data);
    } else {
      group.players.push({
        id: uid("player"),
        ...data
      });
    }

    save();
    closePlayerDialog();
    resetResults();
    renderPlayers();
  }

  function deletePlayer(id) {
    const group = activeGroup();

    if (!group) return;

    const player = group.players.find(
      (item) => item.id === id
    );

    if (!player) return;

    const confirmed = confirm(
      `¿Eliminar a "${player.name}" de este grupo?`
    );

    if (!confirmed) return;

    group.players = group.players.filter(
      (item) => item.id !== id
    );

    save();
    resetResults();
    renderPlayers();
  }

  function toggleAllPlayers() {
    const list = players();

    if (!list.length) return;

    const allSelected = list.every(
      (player) => player.today
    );

    list.forEach((player) => {
      player.today = !allSelected;
    });

    save();
    resetResults();
    renderPlayers();
  }

  // =========================================================
  // ESTADÍSTICAS DE EQUIPO
  // =========================================================

  function teamStats(team) {
    return {
      players: team.length,

      levelTotal: team.reduce(
        (sum, player) => sum + player.level,
        0
      ),

      levelAverage: team.length
        ? team.reduce(
            (sum, player) => sum + player.level,
            0
          ) / team.length
        : 0,

      beginners: team.filter(
        (player) => player.level === 1
      ).length,

      setters: team.filter((player) =>
        player.positions.includes("arme")
      ).length,

      attackers: team.filter((player) =>
        player.positions.includes("ataque")
      ).length,

      defenders: team.filter((player) =>
        player.positions.includes("defensa")
      ).length
    };
  }

  function matchupPenalty(teamA, teamB) {
    const a = teamStats(teamA);
    const b = teamStats(teamB);

    let score = 0;

    score += Math.abs(
      a.levelTotal - b.levelTotal
    ) * 6;

    score += Math.abs(
      a.levelAverage - b.levelAverage
    ) * 12;

    score += Math.abs(
      a.beginners - b.beginners
    ) * 8;

    score += Math.abs(
      a.setters - b.setters
    ) * 10;

    score += Math.abs(
      a.attackers - b.attackers
    ) * 5;

    score += Math.abs(
      a.defenders - b.defenders
    ) * 5;

    if (a.setters === 0) score += 18;
    if (b.setters === 0) score += 18;

    return score;
  }

  function incompleteTeamPenalty(team, targetAverage) {
    const stats = teamStats(team);

    let score = 0;

    score += Math.abs(
      stats.levelAverage - targetAverage
    ) * 7;

    if (stats.setters === 0) {
      score += 8;
    }

    return score;
  }

  // =========================================================
  // COMBINACIONES PARA PRÉSTAMOS
  // =========================================================

  function combinations(array, size) {
    const result = [];

    function walk(start, current) {
      if (current.length === size) {
        result.push([...current]);
        return;
      }

      for (
        let i = start;
        i <= array.length - (size - current.length);
        i++
      ) {
        current.push(array[i]);
        walk(i + 1, current);
        current.pop();
      }
    }

    walk(0, []);

    return result;
  }

  function bestBorrowers(
    team3,
    losingTeam,
    winningTeam
  ) {
    const needed = 6 - team3.length;

    if (needed <= 0) {
      return {
        players: [],
        score: matchupPenalty(team3, winningTeam)
      };
    }

    const options = combinations(
      losingTeam,
      needed
    );

    let best = null;

    for (const borrowed of options) {
      const completedTeam3 = [
        ...team3,
        ...borrowed
      ];

      let score = matchupPenalty(
        completedTeam3,
        winningTeam
      );

      if (!best || score < best.score) {
        best = {
          players: borrowed,
          score
        };
      }
    }

    return best || {
      players: [],
      score: Number.POSITIVE_INFINITY
    };
  }

  // =========================================================
  // GENERACIÓN DE EQUIPOS
  // =========================================================

  function selected15Format() {
    const selected = els.format15Inputs.find(
      (input) => input.checked
    );

    return selected?.value || "6-6-3";
  }


  function teamSizes(count) {
    if (count === 12) {
      return [6, 6];
    }

    if (count === 15) {
      return selected15Format() === "5-5-5"
        ? [5, 5, 5]
        : [6, 6, 3];
    }

    if (count === 16) {
      return [6, 6, 4];
    }

    if (count === 17) {
      return [6, 6, 5];
    }

    if (count === 18) {
      return [6, 6, 6];
    }

    return [];
  }

  function update15FormatVisibility(count) {
    els.format15Wrap.hidden = count !== 15;
  }

  function generateCandidate(list) {
    const sizes = teamSizes(list.length);

    if (!sizes.length) {
      return [];
    }

    const shuffled = shuffle(list);

    if (sizes.length === 2) {
      return [
        shuffled.slice(0, sizes[0]),
        shuffled.slice(sizes[0])
      ];
    }

    return [
      shuffled.slice(0, sizes[0]),
      shuffled.slice(
        sizes[0],
        sizes[0] + sizes[1]
      ),
      shuffled.slice(
        sizes[0] + sizes[1]
      )
    ];
  }

  function scoreCandidate(teams) {
    if (teams.length === 2) {
      return matchupPenalty(
        teams[0],
        teams[1]
      );
    }

    const [team1, team2, team3] = teams;

    let score = 0;

    const allPlayers = teams.flat();

    const globalAverage = average(
      allPlayers.map((player) => player.level)
    );

    const isFiveFiveFive =
      teams.length === 3 &&
      teams.every((team) => team.length === 5);

    // =====================================================
    // 5 / 5 / 5
    // Los tres equipos deben quedar equilibrados entre sí.
    // =====================================================

    if (isFiveFiveFive) {
      score += matchupPenalty(
        team1,
        team2
      );

      score += matchupPenalty(
        team1,
        team3
      );

      score += matchupPenalty(
        team2,
        team3
      );
    }

    // =====================================================
    // 6 / 6 / 3, 6 / 6 / 4, 6 / 6 / 5 y 6 / 6 / 6
    // =====================================================

    else {
      // Los Equipos 1 y 2 juegan primero,
      // por eso su equilibrio tiene mayor peso.
      score += matchupPenalty(
        team1,
        team2
      ) * 2;

      if (team3.length < 6) {
        // También buscamos que la base del Equipo 3
        // tenga una composición razonablemente equilibrada.
        score += incompleteTeamPenalty(
          team3,
          globalAverage
        );

        // Escenario A:
        // gana Equipo 1, pierde Equipo 2.
        const ifTeam1Wins = bestBorrowers(
          team3,
          team2,
          team1
        );

        // Escenario B:
        // gana Equipo 2, pierde Equipo 1.
        const ifTeam2Wins = bestBorrowers(
          team3,
          team1,
          team2
        );

        score += ifTeam1Wins.score;
        score += ifTeam2Wins.score;
      } else {
        score += matchupPenalty(
          team1,
          team3
        );

        score += matchupPenalty(
          team2,
          team3
        );
      }
    }

    // =====================================================
    // REPARTO DE ARMADORES
    // =====================================================

    const totalSetters = allPlayers.filter(
      (player) =>
        player.positions.includes("arme")
    ).length;

    if (
      teams.length === 3 &&
      totalSetters >= 3
    ) {
      teams.forEach((team) => {
        if (
          !team.some((player) =>
            player.positions.includes("arme")
          )
        ) {
          score += 25;
        }
      });
    }

    if (
      teams.length === 2 &&
      totalSetters >= 2
    ) {
      teams.forEach((team) => {
        if (
          !team.some((player) =>
            player.positions.includes("arme")
          )
        ) {
          score += 25;
        }
      });
    }

    return score;
  }

  function optimizeTeams(list) {
    let best = null;

    // Hay pocas personas, por lo que podemos
    // probar bastantes distribuciones sin problema.
    const iterations =
      list.length === 12 ? 8000 : 12000;

    for (let i = 0; i < iterations; i++) {
      const teams = generateCandidate(list);
      const score = scoreCandidate(teams);

      if (
        !best ||
        score < best.score
      ) {
        best = {
          teams,
          score
        };
      }
    }

    return best;
  }

  // =========================================================
  // EQUILIBRIO ESTIMADO
  // =========================================================

  function balancePercent(score, teamCount) {
    const divisor =
      teamCount === 2 ? 2.5 : 5;

    const result =
      100 - score / divisor;

    return Math.max(
      0,
      Math.min(100, Math.round(result))
    );
  }

  // =========================================================
  // RENDER DE RESULTADOS
  // =========================================================

  function renderTeamCard(team, index) {
    const stats = teamStats(team);

    const isFiveFiveFive =
      Array.isArray(state.lastTeams) &&
      state.lastTeams.length === 3 &&
      state.lastTeams.every((item) => item.length === 5);

    const isIncomplete =
      index === 2 &&
      team.length < 6 &&
      !isFiveFiveFive;

    const ordered = [...team].sort(
      (a, b) =>
        b.level - a.level ||
        a.name.localeCompare(
          b.name,
          "es",
          { sensitivity: "base" }
        )
    );

    return `
      <article class="voley-team-card${isIncomplete ? " is-incomplete" : ""}">
        <div class="voley-team-head">
          <div>
            <h3>Equipo ${index + 1}</h3>
            <span class="voley-team-count">
              ${team.length} jugador${
                team.length === 1 ? "" : "es"
              }
            </span>

            ${
              isIncomplete
                ? `<span class="voley-team-pending">Pendiente de completar</span>`
                : ""
            }
          </div>

          <div class="voley-team-score">
            ${stats.levelTotal}
            <small>nivel total</small>
          </div>
        </div>

        <div class="voley-team-stats">
          <span>
            Prom. ${stats.levelAverage.toFixed(1)}
          </span>

          <span>
            Arme ${stats.setters}
          </span>

          <span>
            Ataque ${stats.attackers}
          </span>

          <span>
            Defensa ${stats.defenders}
          </span>
        </div>

        <div class="voley-team-players">
          ${ordered
            .map(
              (player) => `
                <div class="voley-team-player">
                  <div>
                    <strong>
                      ${escapeHtml(player.name)}
                    </strong>

                    <small>
                      ${
                        player.positions.length
                          ? player.positions
                              .map(positionLabel)
                              .join(" · ")
                          : "Sin posición definida"
                      }
                    </small>
                  </div>

                  <span class="voley-level">
                    ${player.level}
                  </span>
                </div>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function renderSuggestions(teams) {
    const [team1, team2, team3] = teams;

    const isFiveFiveFive =
      teams.length === 3 &&
      teams.every((team) => team.length === 5);

    if (
      !team3 ||
      team3.length >= 6 ||
      isFiveFiveFive
    ) {
      els.suggestions.hidden = true;
      els.suggestions.innerHTML = "";

      state.lastSuggestions = null;
      return;
    }

    const ifTeam1Wins = bestBorrowers(
      team3,
      team2,
      team1
    );

    const ifTeam2Wins = bestBorrowers(
      team3,
      team1,
      team2
    );

    state.lastSuggestions = {
      ifTeam1Wins,
      ifTeam2Wins
    };

    function playersHtml(list) {
      return list
        .map(
          (player) => `
            <span class="voley-borrow-player">
              <strong>${escapeHtml(player.name)}</strong>
              <small>
                Nivel ${player.level}
                ${
                  player.positions.length
                    ? " · " +
                      player.positions
                        .map(positionLabel)
                        .join(" / ")
                    : ""
                }
              </small>
            </span>
          `
        )
        .join("");
    }

    els.suggestions.innerHTML = `
      <div class="voley-panel-head">
        <div>
          <h3>
            🔄 Sugerencias para completar el Equipo 3
          </h3>

          <p>
            El Equipo 3 necesita
            <strong>${6 - team3.length}</strong>
            jugador${
              6 - team3.length === 1 ? "" : "es"
            } del equipo que pierda el primer partido.
          </p>
        </div>
      </div>

      <div class="voley-rotation-options">

        <div class="voley-rotation-option">
          <h4>Si gana el Equipo 1</h4>

          <p>
            El Equipo 2 pierde y presta:
          </p>

          <div class="voley-borrow-list">
            ${playersHtml(ifTeam1Wins.players)}
          </div>
        </div>

        <div class="voley-rotation-option">
          <h4>Si gana el Equipo 2</h4>

          <p>
            El Equipo 1 pierde y presta:
          </p>

          <div class="voley-borrow-list">
            ${playersHtml(ifTeam2Wins.players)}
          </div>
        </div>

      </div>
    `;

    els.suggestions.hidden = false;
  }

  function renderResults(result) {
    state.lastTeams = result.teams;

    const percent = balancePercent(
      result.score,
      result.teams.length
    );

    const isFiveFiveFive =
      result.teams.length === 3 &&
      result.teams.every((team) => team.length === 5);

    const hasIncompleteTeam =
      result.teams.length === 3 &&
      result.teams[2].length < 6 &&
      !isFiveFiveFive;

    const balanceDescription = hasIncompleteTeam
      ? "Estimación considerando el equilibrio de los Equipos 1 y 2 y las combinaciones sugeridas para completar el Equipo 3."
      : "Equilibrio entre los equipos formados considerando nivel, arme, ataque y defensa.";

    els.balance.innerHTML = `
      <div class="voley-balance-head">
        <span>Equilibrio estimado</span>
        <strong>${percent}%</strong>
      </div>

      <div
        class="voley-balance-progress"
        role="progressbar"
        aria-label="Equilibrio estimado"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${percent}"
      >
        <span style="width: ${percent}%"></span>
      </div>

      <small class="voley-balance-description">
        ${balanceDescription}
      </small>
    `;

    els.teams.innerHTML = result.teams
      .map(renderTeamCard)
      .join("");

    renderSuggestions(result.teams);

    els.results.hidden = false;
    els.redraw.disabled = false;
  }

  // =========================================================
  // SORTEO
  // =========================================================

  function drawTeams() {
    const list = selectedPlayers();

    if (!isValidPlayerCount(list.length)) {
      updateStatus(list.length);
      resetResults();
      return;
    }

    els.draw.disabled = true;
    els.redraw.disabled = true;

    els.status.textContent =
      "Buscando una distribución equilibrada...";

    // Permitimos que el navegador actualice el texto
    // antes del cálculo.
    setTimeout(() => {
      const result = optimizeTeams(list);

      if (!result) {
        els.status.textContent =
          "No se pudo generar una distribución.";
        els.draw.disabled = false;
        return;
      }

      renderResults(result);

    if (list.length === 12) {
      els.status.textContent =
        "Sorteo realizado: 2 equipos de 6.";

    } else if (
      list.length === 15 &&
      selected15Format() === "5-5-5"
    ) {
      els.status.textContent =
        "Sorteo realizado: 3 equipos completos de 5.";

    } else if (list.length === 18) {
      els.status.textContent =
        "Sorteo realizado: 3 equipos completos de 6.";

    } else {
      els.status.textContent =
        `Sorteo realizado: ${teamSizes(
          list.length
        ).join(" / ")}. Revisa las sugerencias para completar el Equipo 3.`;
    }

      els.draw.disabled = false;
    }, 30);
  }

  // =========================================================
  // RENDER GENERAL
  // =========================================================

  function renderAll() {
    renderGroups();
    renderPlayers();
  }

  // =========================================================
  // EVENTOS
  // =========================================================

  els.addGroup.addEventListener("click", () => {
    openGroupDialog();
  });

  els.editGroup.addEventListener("click", () => {
    const group = activeGroup();

    if (group) {
      openGroupDialog(group);
    }
  });

  els.groupSelect.addEventListener(
    "change",
    changeGroup
  );

  els.groupForm.addEventListener(
    "submit",
    saveGroupFromForm
  );

  els.groupDialogClose.addEventListener(
    "click",
    closeGroupDialog
  );

  els.cancelGroup.addEventListener(
    "click",
    closeGroupDialog
  );

  els.deleteGroup.addEventListener(
    "click",
    deleteActiveGroup
  );

  els.addPlayer.addEventListener("click", () => {
    openPlayerDialog();
  });

  els.playerForm.addEventListener(
    "submit",
    savePlayerFromForm
  );

  els.dialogClose.addEventListener(
    "click",
    closePlayerDialog
  );

  els.cancelPlayer.addEventListener(
    "click",
    closePlayerDialog
  );

  els.toggleAll.addEventListener(
    "click",
    toggleAllPlayers
  );

  els.format15Inputs.forEach((input) => {
    input.addEventListener("change", () => {
      resetResults();
      updateStatus(selectedPlayers().length);
    });
  });

  els.draw.addEventListener(
    "click",
    drawTeams
  );

  els.redraw.addEventListener(
    "click",
    drawTeams
  );

  // Cerrar diálogos al hacer clic fuera.
  els.playerDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === els.playerDialog) {
        closePlayerDialog();
      }
    }
  );

  els.groupDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === els.groupDialog) {
        closeGroupDialog();
      }
    }
  );

  // =========================================================
  // INICIO
  // =========================================================

  load();
  renderAll();
})();