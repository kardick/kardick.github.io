---
layout: page
title: Sorteo Vóley
permalink: /voley/
toc: false
---

<link rel="stylesheet" href="{{ '/assets/css/voley.css' | relative_url }}">

<div id="voley-app" class="voley-app">

  <!-- ===================================================== -->
  <!-- GRUPOS -->
  <!-- ===================================================== -->

  <section class="voley-panel voley-groups-panel">
    <div class="voley-panel-head">
      <div>
        <h3>Grupo de pichanga</h3>
        <p>Selecciona el grupo que deseas administrar.</p>
      </div>

      <div class="voley-actions">
        <button
          id="add-group-btn"
          class="voley-btn voley-btn-primary"
          type="button"
        >
          + Nuevo grupo
        </button>

        <button
          id="edit-group-btn"
          class="voley-btn"
          type="button"
        >
          ✏️ Editar grupo
        </button>
      </div>
    </div>

    <div class="voley-group-toolbar">
      <label class="voley-field voley-group-select-wrap">
        <span>Grupo</span>
        <select id="group-select"></select>
      </label>
    </div>

    <div id="group-info" class="voley-group-info">
      <div>
        <span>Lugar</span>
        <strong id="group-place">—</strong>
      </div>

      <div>
        <span>Días</span>
        <strong id="group-days">—</strong>
      </div>

      <div>
        <span>Horario</span>
        <strong id="group-time">—</strong>
      </div>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- RESUMEN -->
  <!-- ===================================================== -->

  <section class="voley-hero">
    <div>
      <p class="voley-kicker">🏐 Organizador de pichangas</p>

      <h2>Sorteo equilibrado de equipos</h2>

      <p>
        Forma 2 o 3 equipos equilibrados considerando nivel,
        arme, ataque y defensa.
      </p>
    </div>

    <div class="voley-summary">
      <div>
        <strong id="total-players">0</strong>
        <span>registrados</span>
      </div>

      <div>
        <strong id="selected-players">0</strong>
        <span>juegan hoy</span>
      </div>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- JUGADORES -->
  <!-- ===================================================== -->

  <section class="voley-panel">
    <div class="voley-panel-head">
      <div>
        <h3>Jugadores</h3>

        <p>
          Marca quiénes participarán hoy y asigna su nivel
          y posiciones habituales.
        </p>
      </div>

      <div class="voley-actions">
        <button
          id="add-player-btn"
          class="voley-btn voley-btn-primary"
          type="button"
        >
          + Agregar jugador
        </button>

        <button
          id="toggle-all-btn"
          class="voley-btn"
          type="button"
        >
          ☑ Marcar todos
        </button>
      </div>
    </div>

    <div class="voley-table-wrap">
      <table class="voley-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Hoy</th>
            <th>Jugador</th>
            <th>Posiciones</th>
            <th>Nivel</th>
            <th></th>
          </tr>
        </thead>

        <tbody id="players-body"></tbody>
      </table>

      <div id="empty-state" class="voley-empty">
        Aún no hay jugadores registrados en este grupo.
      </div>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- SORTEO -->
  <!-- ===================================================== -->

  <section class="voley-panel voley-sort-panel">

    <div
      id="format-15-wrap"
      class="voley-format-15"
      hidden
    >
      <span class="voley-format-title">
        Formato para 15 jugadores
      </span>

      <div class="voley-format-options">
        <label>
          <input
            type="radio"
            name="format-15"
            value="6-6-3"
            checked
          >

          <span>
            <strong>6 / 6 / 3</strong>
            <small>
              El tercer equipo se completa con jugadores
              del equipo que pierda.
            </small>
          </span>
        </label>

        <label>
          <input
            type="radio"
            name="format-15"
            value="5-5-5"
          >

          <span>
            <strong>5 / 5 / 5</strong>
            <small>
              Tres equipos completos de 5 jugadores.
            </small>
          </span>
        </label>
      </div>
    </div>

    <div class="voley-sort-actions">
      <button
        id="draw-btn"
        class="voley-btn voley-btn-primary voley-btn-lg"
        type="button"
      >
        🎲 Sortear equipos
      </button>

      <button
        id="redraw-btn"
        class="voley-btn voley-btn-lg"
        type="button"
        disabled
      >
        🔄 Volver a sortear
      </button>
    </div>

    <p id="status-message" class="voley-status">
      Selecciona 12 o entre 15 y 18 jugadores para realizar el sorteo.
    </p>

  </section>

  <!-- ===================================================== -->
  <!-- RESULTADOS -->
  <!-- ===================================================== -->

  <section id="results-section" class="voley-results" hidden>
    <div id="balance-card" class="voley-balance"></div>

    <div id="teams-grid" class="voley-teams-grid"></div>

    <section
      id="rotation-suggestions"
      class="voley-panel voley-rotation-panel"
      hidden
    >
    </section>
  </section>

  <!-- ===================================================== -->
  <!-- DIÁLOGO JUGADOR -->
  <!-- ===================================================== -->

  <dialog id="player-dialog" class="voley-dialog">
    <form id="player-form" method="dialog">
      <div class="voley-dialog-head">
        <h3 id="dialog-title">Agregar jugador</h3>

        <button
          id="dialog-close"
          class="voley-icon-btn"
          type="button"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <input type="hidden" id="player-id">

      <label class="voley-field">
        <span>Nombre</span>

        <input
          id="player-name"
          type="text"
          maxlength="40"
          autocomplete="off"
          required
        >
      </label>

      <div class="voley-field">
        <span>Posiciones</span>

        <div class="voley-check-grid" id="positions-group">
          <label>
            <input type="checkbox" value="arme">
            Arme
          </label>

          <label>
            <input type="checkbox" value="ataque">
            Ataque
          </label>

          <label>
            <input type="checkbox" value="defensa">
            Defensa
          </label>
        </div>
      </div>

      <label class="voley-field">
        <span>Nivel</span>

        <select id="player-level">
          <option value="1">1 — Inicial</option>
          <option value="2">2 — Básico</option>
          <option value="3" selected>3 — Intermedio</option>
          <option value="4">4 — Bueno</option>
          <option value="5">5 — Avanzado</option>
        </select>
      </label>

      <label class="voley-switch-row">
        <input
          id="player-today"
          type="checkbox"
          checked
        >

        <span>
          <strong>Juega hoy</strong>
          <small>
            Participará en el próximo sorteo.
          </small>
        </span>
      </label>

      <div class="voley-dialog-actions">
        <button
          id="cancel-player-btn"
          class="voley-btn"
          type="button"
        >
          Cancelar
        </button>

        <button
          class="voley-btn voley-btn-primary"
          type="submit"
        >
          Guardar
        </button>
      </div>
    </form>
  </dialog>

  <!-- ===================================================== -->
  <!-- DIÁLOGO GRUPO -->
  <!-- ===================================================== -->

  <dialog id="group-dialog" class="voley-dialog">
    <form id="group-form" method="dialog">
      <div class="voley-dialog-head">
        <h3 id="group-dialog-title">Nuevo grupo</h3>

        <button
          id="group-dialog-close"
          class="voley-icon-btn"
          type="button"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <input type="hidden" id="group-id">

      <label class="voley-field">
        <span>Nombre del grupo</span>

        <input
          id="group-name"
          type="text"
          maxlength="80"
          autocomplete="off"
          placeholder="Ej. Pichanga Colegio"
          required
        >
      </label>

      <label class="voley-field">
        <span>Lugar</span>

        <input
          id="group-place-input"
          type="text"
          maxlength="120"
          autocomplete="off"
          placeholder="Ej. Colegio San José"
        >
      </label>

      <label class="voley-field">
        <span>Días</span>

        <input
          id="group-days-input"
          type="text"
          maxlength="100"
          autocomplete="off"
          placeholder="Ej. Martes y jueves"
        >
      </label>

      <div class="voley-time-grid">
        <label class="voley-field">
          <span>Hora de inicio</span>

          <input
            id="group-start-time-input"
            type="time"
          >
        </label>

        <label class="voley-field">
          <span>Hora de fin</span>

          <input
            id="group-end-time-input"
            type="time"
          >
        </label>
      </div>

      <div class="voley-dialog-actions">
        <button
          id="delete-group-btn"
          class="voley-btn"
          type="button"
          hidden
        >
          🗑️ Eliminar grupo
        </button>

        <div class="voley-actions">
          <button
            id="cancel-group-btn"
            class="voley-btn"
            type="button"
          >
            Cancelar
          </button>

          <button
            class="voley-btn voley-btn-primary"
            type="submit"
          >
            Guardar grupo
          </button>
        </div>
      </div>
    </form>
  </dialog>

</div>

<script src="{{ '/assets/js/voley.js' | relative_url }}" defer></script>