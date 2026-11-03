/* ExposureIQ looping website preview.
   Uses the ASCII art supplied from the real TUI source.
   All scan results below are fictional. No fetches or scans. */

(function () {
  const screen = document.getElementById("tui-screen");
  const headerBrand = document.getElementById("tui-header-brand");
  const headerLocation = document.getElementById("tui-header-location");
  const bottom = document.getElementById("tui-bottom");

  if (!screen || !headerBrand || !headerLocation || !bottom) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /*
   * The following lines reproduce the Static(...) string you supplied.
   * Keep the leading spaces: they are part of the ASCII art.
   */
  const ASCII_LOGO = [
    "  ▄████████ ▀████    ▐████▀    ▄███████▄  ▄██████▄     ▄████████ ███    █▄     ▄████████    ▄████████  ▄█  ████████▄  ",
    "  ███    ███   ███▌   ████▀    ███    ███ ███    ███   ███    ███ ███    ███   ███    ███   ███    ███ ███  ███    ███ ",
    "  ███    █▀     ███  ▐███      ███    ███ ███    ███   ███    █▀  ███    ███   ███    ███   ███    █▀  ███▌ ███    ███ ",
    " ▄███▄▄▄        ▀███▄███▀      ███    ███ ███    ███   ███        ███    ███  ▄███▄▄▄▄██▀  ▄███▄▄▄     ███▌ ███    ███ ",
    "▀▀███▀▀▀        ████▀██▄     ▀█████████▀  ███    ███ ▀███████████ ███    ███ ▀▀███▀▀▀▀▀   ▀▀███▀▀▀     ███▌ ███    ███ ",
    "  ███    █▄    ▐███  ▀███      ███        ███    ███          ███ ███    ███ ▀███████████   ███    █▄  ███  ███    ███ ",
    "  ███    ███  ▄███     ███▄    ███        ███    ███    ▄█    ███ ███    ███   ███    ███   ███    ███ ███  ███  ▀ ███ ",
    "  ██████████ ████       ███▄  ▄████▀       ▀██████▀   ▄████████▀  ████████▀    ███    ███   ██████████ █▀    ▀██████▀▄█",
    "                                                                               ███    ███ "
  ].join("\n");

  const tabs = [
    "Summary",
    "Subdomains",
    "Hosts",
    "Technologies",
    "Findings",
    "Ports",
    "Diff"
  ];

  const demo = {
    subdomains: [
      ["api.example.com", "192.0.2.20", "API endpoint"],
      ["blog.example.com", "192.0.2.10", "Blog"],
      ["staging.example.com", "192.0.2.20", "New since previous scan"],
      ["www.example.com", "192.0.2.10", "Website"]
    ],

    hosts: [
      [
        "192.0.2.10",
        "3",
        "example.com, www.example.com, blog.example.com"
      ],
      [
        "192.0.2.20",
        "2",
        "api.example.com, staging.example.com"
      ]
    ],

    technologies: [
      ["api.example.com", "nginx", "HTTP Server header"],
      ["www.example.com", "nginx", "HTTP Server header"],
      ["blog.example.com", "WordPress", "Demo HTML metadata"],
      ["staging.example.com", "Node.js", "Demo response header"]
    ],

    ports: [
      ["192.0.2.10", "80", "tcp", "http", "example.com"],
      ["192.0.2.10", "443", "tcp", "https", "www.example.com"],
      ["192.0.2.20", "22", "tcp", "ssh", "api.example.com"],
      ["192.0.2.20", "443", "tcp", "https", "api.example.com"],
      ["192.0.2.20", "8080", "tcp", "http-alt", "staging.example.com"],
      ["192.0.2.20", "3306", "tcp", "mysql", "api.example.com"]
    ],

    findings: [
      ["HIGH", "api.example.com", "Database port publicly reachable"],
      ["HIGH", "staging.example.com", "Expired TLS certificate"],
      ["HIGH", "staging.example.com", "Admin interface on port 8080"],
      ["MEDIUM", "www.example.com", "Missing Content-Security-Policy"],
      ["MEDIUM", "blog.example.com", "Directory listing enabled"],
      ["LOW", "api.example.com", "Server version disclosed"]
    ]
  };

  const phases = [
    "Scope",
    "Subdomains",
    "IP lookup",
    "Web checks",
    "Ports",
    "Save"
  ];

  let timer = null;
  let generation = 0;
  let visible = true;
  let started = false;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function table(headers, rows, severityColumn = -1) {
    const heading = headers.map(function (value) {
      return `<th scope="col">${escapeHTML(value)}</th>`;
    }).join("");

    const body = rows.map(function (row) {
      const cells = row.map(function (value, index) {
        const className = index === severityColumn
          ? {
              HIGH: "tui-red",
              MEDIUM: "tui-amber",
              LOW: "tui-blue"
            }[value] || ""
          : "";

        return `<td class="${className}">${escapeHTML(value)}</td>`;
      }).join("");

      return `<tr>${cells}</tr>`;
    }).join("");

    return `
      <div class="tui-table-scroll">
        <table class="tui-table">
          <thead><tr>${heading}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function tabBar(active) {
    return `
      <div class="tui-tabs">
        ${tabs.map(function (name) {
          return `
            <span class="tui-tab ${
              name === active ? "tui-tab--active" : ""
            }">${escapeHTML(name)}</span>
          `;
        }).join("")}
      </div>
    `;
  }

  function resultPage(title, active, contents) {
    return `
      <h3 class="tui-screen-title">${escapeHTML(title)}</h3>
      ${tabBar(active)}
      ${contents}
    `;
  }

  function setHeader(mode) {
    if (mode === "home") {
      headerBrand.textContent = "ExposureIQ · v0.1.0";
      headerLocation.textContent = "home";
      bottom.textContent =
        "Type a domain   Tab move   Enter scan   Ctrl+C quit";
      return;
    }

    headerBrand.textContent = "← ExposureIQ";
    headerLocation.textContent = "example.com";

    bottom.textContent = mode === "scanning"
      ? "q / Ctrl+C quit/cancel   Tab panels   ↑↓←→ move"
      : "← saved results   Tab panels   ↑↓←→ move   Enter detail   q quit";
  }

  function fitAscii() {
  const art = screen.querySelector(".tui-ascii");
  if (!art) return;

  // Measure at a known size, then scale the whole character grid.
  art.style.fontSize = "10px";

  const naturalWidth = art.getBoundingClientRect().width;
  if (!naturalWidth) return;

  // Leave breathing room on both sides. Cap at 7px so the
  // logo stays smaller even when the preview is wide.
  const availableWidth = screen.clientWidth * 0.88;
  const size = Math.min(7, 10 * availableWidth / naturalWidth);

  art.style.fontSize = `${size}px`;
}

  function show(markup, mode) {
    setHeader(mode);
    screen.innerHTML = markup;
    screen.scrollTop = 0;
    screen.scrollLeft = 0;

    if (mode === "home") fitAscii();
  }

  function homePage() {
    return `
      <div class="tui-home">
        <pre class="tui-ascii"></pre>

        <div class="tui-home-form">
          <span class="tui-input tui-input--typing" id="tui-domain"></span>
          <span class="tui-scan-button" id="tui-scan">Scan</span>
        </div>

        <p class="tui-home-links">
          View saved results &nbsp; Add domain to my scope
        </p>

        <p class="tui-home-hint">
          Listed in scope: web checks + ports.
          Unlisted: passive discovery only.
        </p>

        <p class="tui-home-hint">
          Only test domains you own or have permission to test.
        </p>
      </div>
    `;
  }

  function showHome() {
  show(homePage(), "home");

  const art = screen.querySelector(".tui-ascii");
  if (!art) return;

  const fragment = document.createDocumentFragment();

  ASCII_LOGO.split("\n").forEach(function (line) {
    const row = document.createElement("span");
    row.className = "tui-ascii-line";

    // Each character gets exactly one cell. This prevents
    // Unicode block characters from pushing the top row sideways.
    Array.from(line).forEach(function (character) {
      const cell = document.createElement("span");
      cell.className = "tui-ascii-cell";
      cell.textContent = character === " " ? "\u00a0" : character;
      row.appendChild(cell);
    });

    fragment.appendChild(row);
  });

  art.replaceChildren(fragment);
  fitAscii();
}

  function scanningPage(completed) {
    const rows = phases.map(function (phase, index) {
      if (index < completed) {
        return `
          <div class="tui-phase">
            <span class="tui-mint">✓</span>
            <span>${escapeHTML(phase)}</span>
            <span class="tui-mint">done</span>
          </div>
        `;
      }

      if (index === completed) {
        return `
          <div class="tui-phase">
            <span class="tui-violet">⋮</span>
            <span>${escapeHTML(phase)}</span>
            <span class="tui-violet">running</span>
          </div>
        `;
      }

      return `
        <div class="tui-phase">
          <span class="tui-muted">○</span>
          <span class="tui-muted">${escapeHTML(phase)}</span>
          <span class="tui-muted">waiting</span>
        </div>
      `;
    }).join("");

    const percentage = Math.round(
      completed / phases.length * 100
    );

    return `
      <h3 class="tui-screen-title">
        Scanning · simulated walkthrough
      </h3>

      <div class="tui-scanning-grid">
        <div class="tui-box">
          <span class="tui-box-label">Phases</span>
          ${rows}
        </div>

        <div class="tui-box tui-box--violet">
          <span class="tui-box-label">Demo totals</span>
          <p>Subdomains &nbsp; ${completed >= 2 ? "4" : "—"}</p>
          <p>Hosts &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${completed >= 3 ? "5" : "—"}</p>
          <p>Unique IPs &nbsp; ${completed >= 3 ? "2" : "—"}</p>
          <p>Ports &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${completed >= 5 ? "6" : "—"}</p>
          <p>Findings &nbsp;&nbsp; ${completed >= 4 ? "6" : "—"}</p>

          <div class="tui-progress" aria-hidden="true">
            <span class="tui-progress-fill"
                  style="width:${percentage}%"></span>
          </div>
        </div>
      </div>

      <p class="tui-muted" style="margin-top:14px">
        Website animation only. No probes are sent.
      </p>
    `;
  }

  const resultPages = [
    function summary() {
      return resultPage(
        "Scan finished · illustrative results",
        "Summary",
        `
          <div class="tui-counts">
            <strong>Findings</strong>
            <span class="tui-red">HIGH 3</span>
            <span class="tui-amber">MEDIUM 2</span>
            <span class="tui-blue">LOW 1</span>
          </div>

          <div class="tui-summary-grid">
            <div class="tui-box">
              <span class="tui-box-label">Scan phases</span>

              ${table(
                ["Phase", "State", "Count"],
                [
                  ["Scope", "done", "5"],
                  ["Subdomains", "done", "4"],
                  ["IP lookup", "done", "2"],
                  ["Web checks", "done", "5"],
                  ["Ports", "done", "6"],
                  ["Save", "done", "1"]
                ]
              )}
            </div>

            <div class="tui-box tui-box--violet">
              <p class="tui-detail-title">
                DEMO — fictional saved results
              </p>

              <dl class="tui-detail-list">
                <dt>Target</dt><dd>example.com</dd>
                <dt>Subdomains</dt><dd>4</dd>
                <dt>Hosts</dt><dd>5</dd>
                <dt>Unique IPs</dt><dd>2</dd>
                <dt>Open ports</dt><dd>6</dd>
                <dt>Findings</dt><dd>6</dd>
              </dl>
            </div>
          </div>
        `
      );
    },

    function subdomains() {
      return resultPage(
        "Scan finished",
        "Subdomains",
        table(
          ["Subdomain", "IP", "Note"],
          demo.subdomains
        )
      );
    },

    function hosts() {
      return resultPage(
        "Scan finished",
        "Hosts",
        table(
          ["IP", "Host count", "Hosts"],
          demo.hosts
        )
      );
    },

    function technologies() {
      return resultPage(
        "Scan finished",
        "Technologies",
        table(
          ["Host", "Product", "Source"],
          demo.technologies
        )
      );
    },

    function findings() {
      return resultPage(
        "Scan finished",
        "Findings",
        `
          <div class="tui-finding-layout">
            ${table(
              ["Severity", "Host", "Finding"],
              demo.findings,
              0
            )}

            <div class="tui-box tui-box--violet">
              <p class="tui-detail-title">
                HIGH · Database port publicly reachable
              </p>

              <dl class="tui-detail-list">
                <dt>Host</dt><dd>api.example.com</dd>
                <dt>IP</dt><dd>192.0.2.20</dd>
                <dt>Port</dt><dd>3306/tcp</dd>
                <dt>Service</dt><dd>mysql</dd>
              </dl>

              <p class="tui-muted" style="margin-top:12px">
                Fictional finding. Restrict database access
                to approved hosts on a private network.
              </p>
            </div>
          </div>
        `
      );
    },

    function ports() {
      return resultPage(
        "Scan finished",
        "Ports",
        table(
          ["IP", "Port", "Protocol", "Service", "Associated host"],
          demo.ports
        )
      );
    },

    function diff() {
      return resultPage(
        "Compared with previous saved demo scan",
        "Diff",
        `
          <div class="tui-box">
            <span class="tui-box-label">
              Changes in this fictional example
            </span>

            <div class="tui-change">
              <span class="tui-mint">+ NEW</span>
              <span>staging.example.com discovered</span>
            </div>

            <div class="tui-change">
              <span class="tui-amber">+ PORT</span>
              <span>192.0.2.20:8080/tcp appeared</span>
            </div>

            <div class="tui-change">
              <span class="tui-amber">+ PORT</span>
              <span>192.0.2.20:3306/tcp appeared</span>
            </div>

            <div class="tui-change">
              <span class="tui-violet">~ CHANGE</span>
              <span>
                staging.example.com TLS certificate now expired
              </span>
            </div>
          </div>

          <p class="tui-muted" style="margin-top:13px">
            Previous: 3 subdomains · 4 hosts · 4 ports
            &nbsp;→&nbsp;
            Current: 4 subdomains · 5 hosts · 6 ports
          </p>
        `
      );
    }
  ];

  function cancelPlayback() {
    generation++;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function wait(callback, milliseconds, run) {
    timer = window.setTimeout(function () {
      timer = null;

      if (
        run !== generation ||
        document.hidden ||
        !visible ||
        reducedMotion.matches
      ) {
        return;
      }

      callback();
    }, milliseconds);
  }

  function typeDomain(run, count) {
    if (run !== generation) return;

    const domain = "example.com";
    const field = document.getElementById("tui-domain");

    if (!field) return;

    field.textContent = domain.slice(0, count);

    if (count < domain.length) {
      wait(function () {
        typeDomain(run, count + 1);
      }, 115, run);

      return;
    }

    wait(function () {
      const scan = document.getElementById("tui-scan");

      if (scan) {
        scan.textContent = "Scanning…";
        scan.classList.add("tui-scan-button--active");
      }

      wait(function () {
        playScanning(run, 0);
      }, 700, run);
    }, 650, run);
  }

  function playScanning(run, completed) {
    if (run !== generation) return;

    show(scanningPage(completed), "scanning");

    if (completed < phases.length) {
      wait(function () {
        playScanning(run, completed + 1);
      }, 630, run);

      return;
    }

    wait(function () {
      playResult(run, 0);
    }, 650, run);
  }

  function playResult(run, index) {
    if (run !== generation) return;

    show(resultPages[index](), "results");

    const delay = index === resultPages.length - 1
      ? 3500
      : 2700;

    wait(function () {
      if (index === resultPages.length - 1) {
        startLoop();
      } else {
        playResult(run, index + 1);
      }
    }, delay, run);
  }

  function startLoop() {
    cancelPlayback();

    if (reducedMotion.matches) {
      // A useful static view for visitors requesting reduced motion.
      show(resultPages[0](), "results");
      return;
    }

    showHome();

    if (document.hidden || !visible) return;

    const run = generation;

    wait(function () {
      typeDomain(run, 0);
    }, 850, run);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      cancelPlayback();
    } else {
      startLoop();
    }
  });

  function onMotionChange() {
    startLoop();
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", onMotionChange);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(onMotionChange);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      const nowVisible = entries[0].isIntersecting;

      if (!started) {
        started = true;
        visible = nowVisible;
        startLoop();
        return;
      }

      if (visible === nowVisible) return;

      visible = nowVisible;

      if (visible) {
        startLoop();
      } else {
        cancelPlayback();
      }
    }, { threshold: 0.05 });

    observer.observe(document.getElementById("preview"));
  } else {
    startLoop();
  }

  window.addEventListener("resize", fitAscii);
})();