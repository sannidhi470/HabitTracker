"use strict";

(function () {
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const themeKey = "habit-theme";

  function setTheme(theme) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem(themeKey, theme); } catch (_) {}
    } else {
      document.documentElement.removeAttribute("data-theme");
      try { localStorage.removeItem(themeKey); } catch (_) {}
    }
    const btn = qs("#theme-toggle");
    if (btn) btn.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(themeKey); } catch (_) {}
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else {
      // Follow system; no explicit data-theme attribute
      setTheme(null);
    }
    const toggle = qs("#theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        setTheme(next);
      });
    }
  }

  function showToast({ title = "Notice", body = "", type = "default", timeout = 3000 } = {}) {
    const container = qs("#toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-title">${escapeHtml(title)}</div>
      ${body ? `<div class="toast-body">${escapeHtml(body)}</div>` : ""}
    `;
    container.appendChild(toast);
    const remove = () => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    };
    setTimeout(remove, timeout);
    return remove;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function serializeForm(form) {
    const data = {};
    const fd = new FormData(form);
    for (const [key, value] of fd.entries()) {
      if (data[key] !== undefined) {
        if (Array.isArray(data[key])) data[key].push(value);
        else data[key] = [data[key], value];
      } else {
        data[key] = value;
      }
    }
    // capture unchecked checkboxes explicitly if needed
    qsa('input[type="checkbox"]', form).forEach((cb) => {
      data[cb.name] = cb.checked;
    });
    return data;
  }

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-zA-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    const label = score >= 4 ? "Strong" : score >= 3 ? "Medium" : value ? "Weak" : "—";
    return { score, label };
  }

  function validateEmail(value) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).toLowerCase());
  }

  function setInvalid(input, messageEl, message) {
    if (!input) return;
    input.setAttribute("aria-invalid", "true");
    if (messageEl) messageEl.textContent = message || "";
  }
  function clearInvalid(input, messageEl) {
    if (!input) return;
    input.setAttribute("aria-invalid", "false");
    if (messageEl) messageEl.textContent = "";
  }

  function setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn.classList.add("is-loading");
      btn.setAttribute("disabled", "true");
    } else {
      btn.classList.remove("is-loading");
      btn.removeAttribute("disabled");
    }
  }

  function wireTabs() {
    const tabs = qsa(".tab");
    const panels = qsa(".panel");
    const byKey = (key) => qs(`.panel[data-panel="${key}"]`);

    function activate(key, { updateHash = true } = {}) {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.tab === key;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });
      panels.forEach((p) => {
        const match = p.dataset.panel === key;
        if (match) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "true");
      });
      if (updateHash) {
        try {
          history.replaceState(null, "", `#${key}`);
        } catch (_) {
          location.hash = `#${key}`;
        }
      }
      // focus first input of active panel
      const panel = byKey(key);
      const firstInput = panel ? qs("input", panel) : null;
      if (firstInput) firstInput.focus();
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.dataset.tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const idx = tabs.indexOf(tab);
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const next = tabs[(idx + dir + tabs.length) % tabs.length];
          if (next) next.click();
        }
      });
    });

    const initialHash = (location.hash || "").replace("#", "");
    const initial = initialHash === "signup" ? "signup" : "login";
    activate(initial, { updateHash: true });

    window.addEventListener("hashchange", () => {
      const key = (location.hash || "").replace("#", "");
      if (key === "login" || key === "signup") activate(key, { updateHash: false });
    });
  }

  function wireProviders() {
    qsa("[data-provider]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const provider = btn.getAttribute("data-provider");
        try {
          await window.auth.startOAuth(provider);
        } catch (err) {
          showToast({ title: "OAuth error", body: String(err || "Unknown error"), type: "error" });
        }
      });
    });
  }

  function wirePasswordToggles() {
    qsa(".toggle-password").forEach((btn) => {
      const targetId = btn.getAttribute("data-target");
      const input = qs(`#${CSS.escape(targetId)}`);
      if (!input) return;
      btn.addEventListener("click", () => {
        const isPwd = input.getAttribute("type") === "password";
        input.setAttribute("type", isPwd ? "text" : "password");
        btn.textContent = isPwd ? "Hide" : "Show";
        btn.setAttribute("aria-label", isPwd ? "Hide password" : "Show password");
      });
    });
  }

  function setupLoginForm() {
    const form = qs("#login-form");
    if (!form) return;
    const email = qs("#login-email");
    const emailErr = qs("#login-email-error");
    const pass = qs("#login-password");
    const passErr = qs("#login-password-error");
    const remember = qs("#login-remember");
    const submit = qs("#login-submit");
    const msg = qs("#login-form-msg");

    function validate() {
      let ok = true;
      if (!validateEmail(email.value)) {
        ok = false; setInvalid(email, emailErr, "Enter a valid email address.");
      } else {
        clearInvalid(email, emailErr);
      }
      if (!pass.value || pass.value.length < 8) {
        ok = false; setInvalid(pass, passErr, "Password must be at least 8 characters.");
      } else {
        clearInvalid(pass, passErr);
      }
      submit.toggleAttribute("disabled", !ok);
      return ok;
    }

    form.addEventListener("input", validate);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;
      setLoading(submit, true);
      if (msg) msg.textContent = "";
      try {
        const payload = {
          email: email.value.trim(),
          password: pass.value,
          rememberMe: !!(remember && remember.checked),
        };
        const doRequest = (url) => fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let response;
        try {
          response = await doRequest("http://localhost:8081/api/user/login");
        } catch (err1) {
          try {
            response = await doRequest("http://127.0.0.1:8081/api/user/login");
          } catch (err2) {
            console.error("Login request failed", err1, err2);
            throw err2;
          }
        }
        if (response.status === 200) {
          if (msg) msg.textContent = "Logged in successfully";
        } else if (response.status === 400) {
          if (msg) msg.textContent = "Incorrect email or password";
        } else {
          if (msg) msg.textContent = "Something went wrong. Please try again.";
        }
      } catch (err) {
        console.error("Network or CORS error during login", err);
        if (msg) msg.textContent = "Network error. Please try again.";
      } finally {
        setLoading(submit, false);
      }
    });

    const forgot = qs("#forgot-link");
    if (forgot) {
      forgot.addEventListener("click", (e) => {
        e.preventDefault();
        showToast({
          title: "Reset password",
          body: "Wire this to your backend or email provider.",
          type: "default",
        });
      });
    }

    validate();
  }

  function setupSignupForm() {
    const form = qs("#signup-form");
    if (!form) return;
    const name = qs("#signup-name");
    const nameErr = qs("#signup-name-error");
    const email = qs("#signup-email");
    const emailErr = qs("#signup-email-error");
    const pass = qs("#signup-password");
    const passErr = qs("#signup-password-error");
    const terms = qs("#signup-terms");
    const termsErr = qs("#signup-terms-error");
    const submit = qs("#signup-submit");
    const pwStrengthEl = qs("#pw-strength");
    const msg = qs("#signup-form-msg");

    function validate() {
      let ok = true;
      if (!name.value || !name.value.trim()) {
        ok = false; setInvalid(name, nameErr, "Please enter your full name.");
      } else {
        clearInvalid(name, nameErr);
      }
      if (!validateEmail(email.value)) {
        ok = false; setInvalid(email, emailErr, "Enter a valid email address.");
      } else {
        clearInvalid(email, emailErr);
      }
      if (!pass.value || pass.value.length < 8) {
        ok = false; setInvalid(pass, passErr, "Password must be at least 8 characters.");
      } else if (!/[A-Za-z]/.test(pass.value) || !/\d/.test(pass.value)) {
        ok = false; setInvalid(pass, passErr, "Use letters and numbers for a stronger password.");
      } else {
        clearInvalid(pass, passErr);
      }
      const { label } = passwordStrength(pass.value);
      if (pwStrengthEl) pwStrengthEl.textContent = label;
      if (!terms.checked) {
        ok = false; if (termsErr) termsErr.textContent = "You must accept the terms to continue.";
      } else {
        if (termsErr) termsErr.textContent = "";
      }
      submit.toggleAttribute("disabled", !ok);
      return ok;
    }

    form.addEventListener("input", validate);
    form.addEventListener("change", validate);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;
      setLoading(submit, true);
      if (msg) msg.textContent = "";
      try {
        const payload = {
          fullName: name.value.trim(),
          email: email.value.trim(),
          password: pass.value,
        };
        const doRequest = (url) => fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let response;
        try {
          response = await doRequest("http://localhost:8081/api/signup");
        } catch (err1) {
          try {
            response = await doRequest("http://127.0.0.1:8081/api/signup");
          } catch (err2) {
            console.error("Signup request failed", err1, err2);
            throw err2;
          }
        }
        if (response.status === 200 || response.status === 201) {
          if (msg) msg.textContent = "User registered successfully";
        } else if (response.status === 400) {
          if (msg) msg.textContent = "Please log in";
        } else {
          if (msg) msg.textContent = "Something went wrong. Please try again.";
        }
      } catch (err) {
        console.error("Network or CORS error during signup", err);
        if (msg) msg.textContent = "Network error. Please try again.";
      } finally {
        setLoading(submit, false);
      }
    });

    validate();
  }

  // Public hooks you can replace later with real backend calls
  window.auth = {
    startOAuth: async (provider) => {
      showToast({
        title: `OAuth: ${provider}`,
        body: "Redirect to provider — replace with your backend route.",
      });
      // Example for later:
      // location.href = `/auth/${provider}`;
    },
    setTheme,
  };

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    wireTabs();
    wireProviders();
    wirePasswordToggles();
    setupLoginForm();
    setupSignupForm();
  });
})();


