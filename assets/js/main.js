const CONFIG = {
  whatsappNumber: "",

  rsvpMessage:
    "Hello! Thank you for inviting me to celebrate the wedding of Vijaya Bhaskar Reddy and Lakshmi Prasanna on 21 November 2026.",

  shareText:
    "You are invited to celebrate the wedding of Vijaya Bhaskar Reddy & Lakshmi Prasanna on 21 November 2026 at 8:52 PM.",

  // Wedding muhurtham: 21 November 2026, 8:52 PM IST
  countdownTarget: "2026-11-21T20:52:00+05:30",

  events: {
    wedding: {
      title: "Vijaya Bhaskar Reddy and Lakshmi Prasanna wedding",
      start: [2026, 11, 21, 20, 52],
      durationMinutes: 60,
      location:
        "Ramireddypalle, Donakonda Mandal, Prakasam District, Andhra Pradesh",
      mapUrl:
        "https://www.google.com/maps/place/15%C2%B052'28.5%22N+79%C2%B026'04.2%22E/@15.874587,79.4319191,17z/data=!3m1!4b1!4m4!3m3!8m2!3d15.874587!4d79.434494?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D"
    }
  }
};


(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const intro = $("#intro");
  const hero = $("#hero");
  const heroNames = $("#heroNames");
  const petalLayer = $("#petalLayer");
  let introOpening = false;
  let introComplete = false;
  let petalTimer = null;
  let scrollTicking = false;

  function startHeroEntrance() {
    if (hero.classList.contains("ready")) return;

    hero.classList.add("ready");
    $$(".hero-reveal", hero).forEach((item, index) => {
      item.style.animationDelay = reducedMotion.matches ? "0ms" : `${index * 0.28}s`;
      item.classList.add("in");
    });
  }

  function finishIntro(immediate = false) {
    if (introComplete) return;

    introComplete = true;
    introOpening = true;
    if (immediate) intro.classList.add("skip-transition");
    intro.classList.add("closed");
    document.body.classList.remove("intro-locked");
    window.setTimeout(() => {
      intro.hidden = true;
      startHeroEntrance();
      heroNames.focus({ preventScroll: true });
      startPetals();
    }, immediate || reducedMotion.matches ? 20 : 660);
  }

  function openIntro() {
    if (introOpening || introComplete) return;

    introOpening = true;
    intro.classList.add("opening");
    const duration = reducedMotion.matches ? 300 : 2350;
    window.setTimeout(() => finishIntro(false), duration);
  }

  $("#openIntro").addEventListener("click", openIntro);
  $("#envelope").addEventListener("click", openIntro);
  $("#skipIntro").addEventListener("click", () => finishIntro(true));

  function setupEnvelopeTilt() {
    const envelope = $("#envelope");
    if (!window.matchMedia("(pointer: fine)").matches || reducedMotion.matches) return;

    envelope.addEventListener("pointermove", (event) => {
      if (introOpening) return;
      const rect = envelope.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      envelope.style.transform = `rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
    });
    envelope.addEventListener("pointerleave", () => {
      envelope.style.transform = "";
    });
  }

  function setupSectionReveals() {
    const items = $$(".section-reveal");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7%" });

    items.forEach((item) => observer.observe(item));
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const target = new Date(CONFIG.countdownTarget).getTime();
    const remaining = Math.max(0, target - Date.now());
    const complete = remaining === 0;
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining % 86400000) / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000)
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = $(`#${id}`);
      const nextValue = id === "days" ? String(value).padStart(2, "0") : pad(value);
      if (element.textContent === nextValue) return;
      element.textContent = nextValue;
      element.classList.remove("tick");
      void element.offsetWidth;
      element.classList.add("tick");
    });

    $("#countdownGrid").hidden = complete;
    $("#countdownComplete").hidden = !complete;
    return !complete;
  }

  function startCountdown() {
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }

  function istPartsToUtcDate(parts) {
    const [year, month, day, hour, minute] = parts;
    const istOffsetMinutes = 330;
    return new Date(Date.UTC(year, month - 1, day, hour, minute) - istOffsetMinutes * 60000);
  }

  function googleDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function formatEventDetails(event) {
    const eventDateTime = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Kolkata"
    }).format(istPartsToUtcDate(event.start));
    return `${event.title}\n${eventDateTime} IST\n${event.location}\nDirections: ${event.mapUrl}`;
  }

  function buildCalendarUrl(event) {
    const start = istPartsToUtcDate(event.start);
    const end = new Date(start.getTime() + event.durationMinutes * 60000);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${googleDate(start)}/${googleDate(end)}`,
      ctz: "Asia/Kolkata",
      location: event.location,
      details: formatEventDetails(event)
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function setupEventLinks() {
    $$(".event-card").forEach((card) => {
      const event = CONFIG.events[card.dataset.event];
      if (!event) return;
      const mapLink = $(".map-link", card);
      const calendarLink = $(".calendar-link", card);
      mapLink.href = event.mapUrl;
      calendarLink.href = buildCalendarUrl(event);
      calendarLink.target = "_blank";
      calendarLink.rel = "noopener";
    });
  }

  function announce(message) {
    const toast = $("#toast");
    toast.textContent = "";
    window.setTimeout(() => { toast.textContent = message; }, 20);
  }

  async function copyShareContent(successMessage) {
    const linkField = $("#shareLink");
    const link = linkField.value;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        linkField.focus();
        linkField.select();
        const copied = document.execCommand("copy");
        if (!copied) throw new Error("Copy command was unavailable.");
      }
      announce(successMessage);
    } catch (error) {
      linkField.focus();
      linkField.select();
      announce("Automatic copying is unavailable. Copy the selected invitation.");
    }
  }

  function setupSharing() {
    const shareButton = $("#shareButton");
    const fallbackActions = $("#fallbackActions");
    const whatsappShare = $("#whatsappShare");
    const copyLink = $("#copyLink");
    const shareLink = $("#shareLink");
    const rsvpButton = $("#rsvpButton");
    const pageUrl = window.location.href;
    const isWebPage = ["https:", "http:"].includes(window.location.protocol);
    const invitationText = [
      document.title,
      "With the blessings of our families, we invite you to our wedding.",
      ...Object.values(CONFIG.events).map(formatEventDetails),
      "We would love to have you with us on our special day."
    ].join("\n\n");
    const shareData = {
      title: document.title,
      text: isWebPage ? CONFIG.shareText : invitationText
    };
    const copyAction = isWebPage ? "Copy Link" : "Copy Invitation";

    if (isWebPage) shareData.url = pageUrl;
    shareLink.value = isWebPage ? pageUrl : invitationText;
    shareLink.rows = isWebPage ? 2 : 10;
    shareLink.setAttribute("aria-label", isWebPage ? "Invitation link" : "Invitation details");
    copyLink.textContent = copyAction;
    whatsappShare.href = `https://wa.me/?text=${encodeURIComponent(isWebPage ? `${CONFIG.shareText} ${pageUrl}` : invitationText)}`;
    copyLink.addEventListener("click", () => copyShareContent(isWebPage ? "Link copied." : "Invitation copied."));
    shareLink.addEventListener("click", () => shareLink.select());

    function showSharingOptions(message) {
      fallbackActions.hidden = false;
      shareButton.setAttribute("aria-expanded", "true");
      announce(message);
      whatsappShare.focus();
    }

    shareButton.addEventListener("click", async () => {
      try {
        if (!window.isSecureContext || typeof navigator.share !== "function" ||
            (typeof navigator.canShare === "function" && !navigator.canShare(shareData))) {
          showSharingOptions(isWebPage
            ? "Choose WhatsApp or copy the invitation link below."
            : "Share the invitation details via WhatsApp or copy the text below.");
          return;
        }
        await navigator.share(shareData);
      } catch (error) {
        showSharingOptions(error.name === "AbortError"
          ? `Sharing was cancelled or unavailable. You can still use WhatsApp or ${copyAction}.`
          : `Native sharing is unavailable. Use WhatsApp or ${copyAction} instead.`);
      }
    });

    const number = String(CONFIG.whatsappNumber || "").replace(/\D/g, "");
    if (number) {
      rsvpButton.href = `https://wa.me/${number}?text=${encodeURIComponent(CONFIG.rsvpMessage)}`;
      rsvpButton.hidden = false;
    }
  }

  function setupMusic() {
    const button = $("#musicButton");
    const audio = $("#backgroundMusic");
    const source = $("source", audio);

    function stopAutoplayRetries() {
      document.removeEventListener("click", retryAutoplay);
      document.removeEventListener("keydown", retryAutoplay);
    }

    function updateMusicButton() {
      const playing = !audio.paused && !audio.ended;
      button.classList.toggle("playing", playing);
      button.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
    }

    async function playMusic() {
      try {
        await audio.play();
        button.hidden = false;
        updateMusicButton();
        stopAutoplayRetries();
      } catch (error) {
        if (error.name === "NotAllowedError") return;
        stopAutoplayRetries();
        announce("Music could not be played.");
      }
    }

    function retryAutoplay(event) {
      if (button.contains(event.target)) return;
      playMusic();
    }

    button.addEventListener("click", async () => {
      stopAutoplayRetries();
      if (audio.paused) {
        await playMusic();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      button.hidden = false;
    });
    audio.addEventListener("play", () => {
      button.hidden = false;
      stopAutoplayRetries();
      updateMusicButton();
    });
    audio.addEventListener("pause", updateMusicButton);
    audio.addEventListener("ended", updateMusicButton);
    source.addEventListener("error", () => {
      stopAutoplayRetries();
      button.hidden = true;
      announce("Music could not be loaded.");
    });

    document.addEventListener("click", retryAutoplay);
    document.addEventListener("keydown", retryAutoplay);
    playMusic();
  }

  function createPetal() {
    if (!introComplete || reducedMotion.matches || petalLayer.childElementCount >= 16) return;

    const petal = document.createElement("i");
    const colors = ["#F2C6D2", "#FFFFFF", "#C2A265"];
    const duration = 14 + Math.random() * 8;
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    petal.style.setProperty("--fall-duration", `${duration}s`);
    petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    petal.style.animationDelay = `${Math.random() * -2}s`;
    petalLayer.appendChild(petal);
    window.setTimeout(() => petal.remove(), (duration + 1) * 1000);
  }

  function startPetals() {
    if (petalTimer || reducedMotion.matches) return;
    createPetal();
    petalTimer = window.setInterval(createPetal, 1800);
  }

  function updateScrollEffects() {
    const documentElement = document.documentElement;
    const scrollable = documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
    $("#progressBar").style.width = `${progress * 100}%`;

    if (!reducedMotion.matches && introComplete) {
      const heroRect = hero.getBoundingClientRect();
      if (heroRect.bottom > 0) {
        const offset = Math.max(-24, Math.min(24, window.scrollY * 0.045));
        $(".portrait-stage", hero).style.transform = `translate3d(0, ${offset}px, 0)`;
        $(".gopuram", hero).style.transform = `translate3d(-50%, ${offset * 0.5}px, 0)`;
      }
    }
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  function initialize() {
    setupEnvelopeTilt();
    setupSectionReveals();
    setupEventLinks();
    setupSharing();
    setupMusic();
    startCountdown();
    updateScrollEffects();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
  }

  initialize();
})();
