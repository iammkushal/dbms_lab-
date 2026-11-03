"use strict";

/* =====================================================
   SETTINGS  -  CHANGE THE UPI ID BELOW TO YOUR OWN
   ===================================================== */
const UPI_ID = "chinmaypc1@oksbi";     // <-- put YOUR UPI ID here (e.g. kushal@okhdfcbank)
const UPI_NAME = "CineBook";       // name shown in the UPI app
const PAY_SECONDS = 300;           // payment popup time: 5 minutes

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;
const MAX_SEATS = 10;
const NO_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="350">' +
    '<rect width="100%" height="100%" fill="#2a2a33"/>' +
    '<text x="50%" y="50%" fill="#888" font-size="20" ' +
    'text-anchor="middle" font-family="Arial">No poster</text></svg>');

const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- server address ---------- */
// Works for /cinemabookAPI, /cinemabookAPI/ and /cinemabookAPI/index.html
function getBase() {
    let p = window.location.pathname;
    if (!p.endsWith("/")) {
        const last = p.substring(p.lastIndexOf("/") + 1);
        p = last.includes(".")
            ? p.substring(0, p.lastIndexOf("/") + 1)
            : p + "/";
    }
    return p;
}
const API = getBase();

/* ---------- page elements ---------- */
const movieContainer = document.getElementById("movieContainer");
const form = document.getElementById("booking-form");
const nameInput = document.getElementById("customerName");
const emailInput = document.getElementById("customerEmail");
const phoneInput = document.getElementById("customerPhone");
const movieSelect = document.getElementById("movieName");
const dateStrip = document.getElementById("dateStrip");
const timeStrip = document.getElementById("timeStrip");
const showIdInput = document.getElementById("showId");
const seatContainer = document.getElementById("seatContainer");
const selectedSeatsEl = document.getElementById("selectedSeats");
const totalPriceEl = document.getElementById("totalPrice");
const confirmButton = document.getElementById("confirmButton");
const messageEl = document.getElementById("message");
const bookingList = document.getElementById("bookingList");

/* ---------- data ---------- */
let movies = [];
let shows = [];
let occupied = new Set();
let selected = [];
let seatButtons = {};
let bookingsData = [];
let activeDate = "";

/* ---------- small helpers ---------- */
function esc(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function money(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
}

function fmtDate(s) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const p = String(s).split("-");
    if (p.length !== 3) return s;
    return p[2] + " " + months[Number(p[1]) - 1] + " " + p[0];
}

function fmtTime(s) {
    const p = String(s).split(":");
    if (p.length < 2) return s;
    const h = Number(p[0]);
    const suffix = h >= 12 ? "PM" : "AM";
    return (h % 12 || 12) + ":" + p[1] + " " + suffix;
}

function seatSort(a, b) {
    if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
    return Number(a.slice(1)) - Number(b.slice(1));
}

function setMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.className = isError ? "msg-err shake" : "msg-ok";
}

function clearMessage() {
    messageEl.textContent = "";
    messageEl.className = "";
}

async function fetchJson(path, options) {
    const url = API + path;
    const res = await fetch(url, options);
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    return { ok: res.ok, status: res.status, data: data, url: url };
}

function currentMovie() {
    return movies.find(m => String(m.id) === movieSelect.value) || null;
}

/* =====================================================
   ANIMATION HELPERS
   ===================================================== */

/* ---- small message pop-up (toast) ---- */
function toast(text, type) {
    let root = document.getElementById("toastRoot");
    if (!root) {
        root = document.createElement("div");
        root.id = "toastRoot";
        document.body.appendChild(root);
    }
    const t = document.createElement("div");
    t.className = "toast " + (type || "info");
    t.textContent = text;
    root.appendChild(t);
    setTimeout(() => {
        t.classList.add("out");
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

/* ---- fade-up when scrolled into view ---- */
const revealObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const el = en.target;
            revealObserver.unobserve(el);
            el.classList.add("in-view");
            el.addEventListener("animationend", function done(e) {
                if (e.target !== el) return;
                el.removeEventListener("animationend", done);
                el.classList.remove("reveal", "in-view");
            });
        });
    }, { threshold: 0.12 })
    : null;

function reveal(el, delayMs) {
    if (!revealObserver || reduceMotion) return;
    el.style.setProperty("--d", (delayMs || 0) + "ms");
    el.classList.add("reveal");
    revealObserver.observe(el);
}

/* ---- price counts up/down smoothly ---- */
let shownTotal = 0;
let totalAnimId = 0;

function animateTotal(to) {
    const from = shownTotal;
    shownTotal = to;
    const id = ++totalAnimId;

    if (reduceMotion || from === to) {
        totalPriceEl.textContent = money(to);
        return;
    }
    const start = performance.now();
    const dur = 350;

    function step(now) {
        if (id !== totalAnimId) return;
        const p = Math.min(1, (now - start) / dur);
        totalPriceEl.textContent = money(Math.round(from + (to - from) * p));
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ---- confetti ---- */
function confetti(parent) {
    if (reduceMotion) return;
    const colors = ["#ff354f", "#ffd166", "#3ddc84", "#4cc9f0", "#ffffff"];
    for (let i = 0; i < 50; i++) {
        const c = document.createElement("span");
        c.className = "confetti-piece";
        c.style.left = Math.random() * 100 + "vw";
        c.style.background = colors[i % colors.length];
        c.style.setProperty("--dur", (2.2 + Math.random() * 1.8) + "s");
        c.style.setProperty("--delay", (Math.random() * 0.6) + "s");
        c.style.setProperty("--rot", (360 + Math.random() * 720) + "deg");
        c.style.width = (6 + Math.random() * 6) + "px";
        c.style.height = (8 + Math.random() * 8) + "px";
        parent.appendChild(c);
        setTimeout(() => c.remove(), 4500);
    }
}

/* ---- button ripple ---- */
document.addEventListener("click", (e) => {
    if (reduceMotion) return;
    const b = e.target.closest(
        ".movie-card button, .btn, #confirmButton, .modal-btn, .dl-btn, #pdfBtn");
    if (!b) return;
    const rect = b.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = size + "px";
    s.style.left = (e.clientX - rect.left - size / 2) + "px";
    s.style.top = (e.clientY - rect.top - size / 2) + "px";
    b.appendChild(s);
    setTimeout(() => s.remove(), 600);
});

/* ---- scroll progress bar + header shadow ---- */
const scrollBar = document.createElement("div");
scrollBar.id = "scrollBar";
document.body.appendChild(scrollBar);
const headerEl = document.querySelector("header");

function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    scrollBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    if (headerEl) headerEl.classList.toggle("scrolled", h.scrollTop > 20);
}
window.addEventListener("scroll", onScroll, { passive: true });

/* =====================================================
   POP-UP WINDOWS (modals)
   ===================================================== */
let modalEl = null;
let modalTimer = null;
let modalKeyHandler = null;

function openModal(inner, opts) {
    closeModal(true);
    opts = opts || {};

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
        '<div class="modal-box ' + (opts.cls || "") +
        '" role="dialog" aria-modal="true">' + inner + "</div>";
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay && !opts.persistent) closeModal();
    });
    modalKeyHandler = (e) => {
        if (e.key === "Escape" && !opts.persistent) closeModal();
    };
    document.addEventListener("keydown", modalKeyHandler);

    modalEl = overlay;
    requestAnimationFrame(() => overlay.classList.add("show"));
    return overlay;
}

function closeModal(instant) {
    if (modalTimer) {
        clearInterval(modalTimer);
        modalTimer = null;
    }
    if (modalKeyHandler) {
        document.removeEventListener("keydown", modalKeyHandler);
        modalKeyHandler = null;
    }
    const el = modalEl;
    modalEl = null;
    document.body.classList.remove("modal-open");
    if (!el) return;

    if (instant === true || reduceMotion) {
        el.remove();
        return;
    }
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => el.remove(), 250);
}

/* ---- movie details pop-up (click on a poster) ---- */
function selectMovie(id) {
    movieSelect.value = String(id);
    onMovieChange();
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

function openMovieModal(m) {
    const el = openModal(
        '<button type="button" class="modal-x" data-close ' +
        'aria-label="Close">&times;</button>' +
        '<img class="modal-poster" src="' + esc(m.image) + '" alt="' +
        esc(m.title) + '">' +
        '<div class="modal-info"><h3>' + esc(m.title) + "</h3>" +
        "<p>" + esc(m.genre) + " • " + esc(m.language) + "</p>" +
        '<p class="modal-price">' + money(m.price) + " per ticket</p>" +
        '<button type="button" class="modal-btn" data-book>Book Now</button>' +
        "</div>", { cls: "movie-modal" });

    el.querySelector(".modal-poster").addEventListener("error", function () {
        this.onerror = null;
        this.src = NO_POSTER;
    });
    el.querySelector("[data-close]").addEventListener("click",
        () => closeModal());
    el.querySelector("[data-book]").addEventListener("click", () => {
        closeModal();
        selectMovie(m.id);
    });
}

/* =====================================================
   QR CODE + PDF TICKET
   ===================================================== */
function makeQr(el, text, size) {
    el.innerHTML = "";
    if (typeof QRCode === "undefined") {
        el.innerHTML = "<small>QR library not loaded (check internet)</small>";
        return false;
    }
    new QRCode(el, {
        text: text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
    return true;
}

// returns a PNG data-url of a QR code (used for the PDF)
function qrDataUrl(text) {
    if (typeof QRCode === "undefined") return null;
    const holder = document.createElement("div");
    new QRCode(holder, {
        text: text, width: 200, height: 200,
        colorDark: "#000000", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
    const canvas = holder.querySelector("canvas");
    return canvas ? canvas.toDataURL("image/png") : null;
}

function seatList(t) {
    return Array.isArray(t.seats) ? t.seats.join(", ") : String(t.seats || "");
}

function qrText(t) {
    return "CINEBOOK|#" + t.bookingId + "|" + t.movieTitle + "|" +
           t.showDate + " " + t.showTime + "|" + seatList(t);
}

function downloadPdf(t) {
    if (!window.jspdf) {
        toast("PDF library not loaded. Check your internet.", "err");
        return;
    }
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: [90, 150] });

    doc.setFillColor(16, 16, 20);
    doc.rect(0, 0, 90, 150, "F");
    doc.setFillColor(255, 53, 79);
    doc.rect(0, 0, 90, 18, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CINEBOOK", 45, 12, { align: "center" });
    doc.setFontSize(11);
    doc.text("BOOKING CONFIRMED", 45, 27, { align: "center" });

    let y = 38;
    const rows = [
        ["Booking ID", "#" + t.bookingId],
        ["Name", t.customerName],
        ["Movie", t.movieTitle],
        ["Date", fmtDate(t.showDate)],
        ["Time", fmtTime(t.showTime)],
        ["Screen", t.screenName],
        ["Seats", seatList(t)],
        ["Total", "Rs. " + Number(t.totalAmount)]
    ];
    rows.forEach(r => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(170, 170, 170);
        doc.text(r[0], 8, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const lines = doc.splitTextToSize(String(r[1]), 50);
        doc.text(lines, 82, y, { align: "right" });
        y += 6 + (lines.length - 1) * 4.5;
    });

    const qr = qrDataUrl(qrText(t));
    if (qr) {
        doc.setFillColor(255, 255, 255);
        doc.rect(25, y + 2, 40, 40, "F");
        doc.addImage(qr, "PNG", 27, y + 4, 36, 36);
    }
    doc.save("CineBook-Ticket-" + t.bookingId + ".pdf");
}

/* ---------- movies ---------- */
function renderMovieCards() {
    if (movies.length === 0) {
        movieContainer.innerHTML = "<p>No movies found in the database.</p>";
        return;
    }

    movieContainer.innerHTML = movies.map(m =>
        '<div class="movie-card">' +
        '<div class="poster-wrap">' +
        '<img src="' + esc(m.image) + '" alt="' + esc(m.title) + '">' +
        '<span class="poster-hint">View details</span></div>' +
        "<h3>" + esc(m.title) + "</h3>" +
        "<p>" + esc(m.genre) + " • " + esc(m.language) + "</p>" +
        "<p>" + money(m.price) + " per ticket</p>" +
        '<button type="button" data-movie="' + esc(m.id) + '">Book Now</button>' +
        "</div>"
    ).join("");

    movieContainer.querySelectorAll(".movie-card").forEach((card, i) => {
        reveal(card, i * 90);
        const m = movies[i];
        const img = card.querySelector("img");

        img.addEventListener("error", () => {
            img.onerror = null;
            img.src = NO_POSTER;
        });
        card.querySelector(".poster-wrap").addEventListener("click",
            () => openMovieModal(m));
        card.querySelector("button[data-movie]").addEventListener("click",
            () => selectMovie(m.id));
    });
}

function fillMovieSelect() {
    movieSelect.innerHTML = '<option value="">Choose Movie</option>' +
        movies.map(m => '<option value="' + esc(m.id) + '">' +
                        esc(m.title) + "</option>").join("");
}

function onMovieChange() {
    const movie = currentMovie();
    activeDate = "";
    showIdInput.value = "";
    renderDates(movie);
    renderTimes();

    selected = [];
    occupied = new Set();
    renderSeats(false);
    updateSummary();
}

/* ---------- date + time chips ---------- */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function movieShows(movie) {
    return movie ? shows.filter(s => s.movie_id === movie.id) : [];
}

function renderDates(movie) {
    if (!movie) {
        dateStrip.innerHTML = '<p class="chip-hint">Choose a movie first</p>';
        return;
    }
    const dates = [...new Set(movieShows(movie).map(s => s.show_date))].sort();
    if (dates.length === 0) {
        dateStrip.innerHTML = '<p class="chip-hint">No shows for this movie</p>';
        return;
    }
    dateStrip.innerHTML = dates.map(d => {
        const p = d.split("-").map(Number);
        const dt = new Date(p[0], p[1] - 1, p[2]);
        return '<button type="button" class="chip date-chip" data-date="' +
            esc(d) + '"><small>' + DAY_NAMES[dt.getDay()] + "</small>" +
            "<b>" + p[2] + "</b><small>" +
            fmtDate(d).split(" ")[1] + "</small></button>";
    }).join("");
}

function renderTimes() {
    const movie = currentMovie();
    if (!activeDate) {
        timeStrip.innerHTML = movie && movieShows(movie).length
            ? '<p class="chip-hint">Choose a date first</p>'
            : '<p class="chip-hint">No showtimes yet</p>';
        return;
    }
    const list = movieShows(movie)
        .filter(s => s.show_date === activeDate)
        .sort((a, b) => String(a.show_time).localeCompare(String(b.show_time)));
    timeStrip.innerHTML = list.map(s =>
        '<button type="button" class="chip time-chip" data-show="' +
        esc(s.show_id) + '">' + esc(fmtTime(s.show_time)) +
        "<small>" + esc(s.screen_name) + "</small></button>").join("");
}

function markActive(strip, attr, value) {
    strip.querySelectorAll(".chip").forEach(c =>
        c.classList.toggle("active", c.getAttribute(attr) === String(value)));
}

async function onDateChange(date) {
    activeDate = date;
    markActive(dateStrip, "data-date", date);
    showIdInput.value = "";
    renderTimes();
    await loadOccupied(false);          // clears seats until a time is picked
}

async function onShowChange(showId) {
    showIdInput.value = String(showId);
    markActive(timeStrip, "data-show", showId);
    await loadOccupied(false);
}

dateStrip.addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]");
    if (b) onDateChange(b.getAttribute("data-date"));
});
timeStrip.addEventListener("click", (e) => {
    const b = e.target.closest("[data-show]");
    if (b) onShowChange(b.getAttribute("data-show"));
});

/* ---------- seats ---------- */
async function loadOccupied(keepSelection) {
    const id = showIdInput.value;
    occupied = new Set();
    if (!keepSelection) selected = [];

    if (!id) {
        renderSeats(false);
        updateSummary();
        return;
    }

    try {
        const r = await fetchJson("bookings/occupied?showId=" +
                                  encodeURIComponent(id));
        if (id !== showIdInput.value) return;   // user changed show meanwhile

        if (r.ok && r.data && Array.isArray(r.data.seats)) {
            occupied = new Set(r.data.seats);
        } else {
            setMessage("Could not load seat availability (status " +
                       r.status + ").", true);
        }
    } catch (e) {
        setMessage("Could not reach the server.", true);
    }

    selected = selected.filter(s => !occupied.has(s));
    renderSeats(!keepSelection);
    updateSummary();
}

function renderSeats(animate) {
    seatContainer.innerHTML = "";
    seatButtons = {};

    if (!showIdInput.value) {
        seatContainer.innerHTML =
            '<p class="seat-hint">Choose a movie and a showtime to see the seats.</p>';
        return;
    }

    ROWS.forEach((r, ri) => {
        const row = document.createElement("div");
        row.className = "seat-row";

        const label = document.createElement("span");
        label.className = "row-label";
        label.textContent = r;
        row.appendChild(label);

        for (let c = 1; c <= COLS; c++) {
            const code = r + c;
            const b = document.createElement("button");
            b.type = "button";          // IMPORTANT: stops the form submitting
            b.className = "seat";
            b.textContent = c;
            b.title = code;

            if (occupied.has(code)) {
                b.classList.add("booked");
                b.disabled = true;
            } else if (selected.includes(code)) {
                b.classList.add("selected");
            }

            if (animate && !reduceMotion) {
                b.classList.add("enter");
                b.style.animationDelay = (ri * 45 + c * 18) + "ms";
            }
            b.addEventListener("animationend", () => {
                b.classList.remove("enter", "pop");
                b.style.animationDelay = "";
            });

            b.addEventListener("click", () => toggleSeat(code));
            seatButtons[code] = b;
            row.appendChild(b);
        }
        seatContainer.appendChild(row);
    });
}

function toggleSeat(code) {
    clearMessage();
    if (selected.includes(code)) {
        selected = selected.filter(s => s !== code);
    } else {
        if (selected.length >= MAX_SEATS) {
            setMessage("You can select at most " + MAX_SEATS + " seats.", true);
            return;
        }
        selected.push(code);
        selected.sort(seatSort);
    }

    const b = seatButtons[code];
    if (b) {
        b.classList.toggle("selected", selected.includes(code));
        if (!reduceMotion) {
            b.classList.remove("enter", "pop");
            b.style.animationDelay = "";
            void b.offsetWidth;          // restart the animation
            b.classList.add("pop");
        }
    }
    updateSummary();
}

function updateSummary() {
    const movie = currentMovie();
    const price = movie ? Number(movie.price) : 0;

    selectedSeatsEl.textContent = selected.length ? selected.join(", ") : "None";
    animateTotal(price * selected.length);
}

/* =====================================================
   PAYMENT POP-UP  (your own UPI QR)
   ===================================================== */
function openPayment(info) {
    // info = { total, movieTitle, seats, onSubmit(utr) }
    const amount = Number(info.total).toFixed(2);
    const link = "upi://pay?pa=" + UPI_ID +
                 "&pn=" + encodeURIComponent(UPI_NAME) +
                 "&am=" + amount +
                 "&cu=INR&tn=" + encodeURIComponent("CineBook Ticket");

    const el = openModal(
        '<div class="pay-head">Scan &amp; Pay</div>' +
        '<p class="pay-sub">' + esc(info.movieTitle) + " • " +
        esc(info.seats) + "</p>" +
        '<div class="pay-amount">' + esc(money(info.total)) + "</div>" +

        '<div class="pay-qr-wrap"><div id="payQr" class="pay-qr"></div>' +
        '<div class="scan-line"></div></div>' +

        '<p class="pay-upi">UPI ID: <strong>' + esc(UPI_ID) + "</strong> " +
        '<button type="button" class="link-btn" id="copyUpi">Copy</button></p>' +
        '<a class="pay-open" href="' + esc(link) + '">Pay using UPI app</a>' +

        '<div class="pay-timer"><div class="pay-bar"><i id="payBar"></i></div>' +
        '<span id="payTime">05:00</span></div>' +

        "<label>After paying, enter the 12-digit UTR / Ref No. " +
        "from your UPI app</label>" +
        '<input id="utrInput" inputmode="numeric" maxlength="12" ' +
        'placeholder="e.g. 412345678901" autocomplete="off">' +
        '<p class="pay-err" id="payErr"></p>' +
        '<button type="button" class="modal-btn" id="payDone" disabled>' +
        "I have paid</button>" +
        '<button type="button" class="modal-link" id="payCancel">Cancel</button>',
        { cls: "pay-modal", persistent: true });

    if (!makeQr(el.querySelector("#payQr"), link, 190)) {
        el.querySelector("#payQr").innerHTML +=
            "<small>" + esc(link) + "</small>";
    }

    const utrInput = el.querySelector("#utrInput");
    const doneBtn = el.querySelector("#payDone");
    const errEl = el.querySelector("#payErr");

    utrInput.addEventListener("input", () => {
        utrInput.value = utrInput.value.replace(/\D/g, "");
        doneBtn.disabled = !/^\d{12}$/.test(utrInput.value);
        errEl.textContent = "";
    });

    el.querySelector("#copyUpi").addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(UPI_ID).then(
                () => toast("UPI ID copied", "ok"),
                () => toast("Could not copy", "err"));
        } else {
            toast("Could not copy", "err");
        }
    });

    el.querySelector("#payCancel").addEventListener("click", () => {
        closeModal();
        loadOccupied(true);
    });

    doneBtn.addEventListener("click", async () => {
        doneBtn.disabled = true;
        utrInput.disabled = true;
        doneBtn.classList.add("loading");
        doneBtn.textContent = "Saving booking...";

        const problem = await info.onSubmit(utrInput.value);

        if (problem && document.body.contains(el)) {
            errEl.textContent = problem;
            errEl.classList.remove("shake");
            void errEl.offsetWidth;
            errEl.classList.add("shake");
            utrInput.disabled = false;
            doneBtn.classList.remove("loading");
            doneBtn.textContent = "I have paid";
            doneBtn.disabled = !/^\d{12}$/.test(utrInput.value);
        }
    });

    // countdown
    let left = PAY_SECONDS;
    const timeEl = el.querySelector("#payTime");
    const barEl = el.querySelector("#payBar");

    modalTimer = setInterval(() => {
        left--;
        const mm = String(Math.floor(left / 60)).padStart(2, "0");
        const ss = String(left % 60).padStart(2, "0");
        timeEl.textContent = mm + ":" + ss;
        barEl.style.width = Math.max(0, (left / PAY_SECONDS) * 100) + "%";
        barEl.parentElement.classList.toggle("warn", left <= 60);

        if (left <= 0) {
            closeModal();
            toast("Payment time is over. Please try again.", "err");
            loadOccupied(true);
        }
    }, 1000);
}

/* ---- success pop-up ---- */
function showSuccess(t) {
    const el = openModal(
        '<div class="success-wrap">' +
        '<svg class="check" viewBox="0 0 52 52">' +
        '<circle class="check-circle" cx="26" cy="26" r="24" fill="none"/>' +
        '<path class="check-mark" fill="none" d="M14 27l8 8 16-17"/></svg>' +
        "<h3>Booking Confirmed!</h3>" +
        "<p>" + esc(t.movieTitle) + "</p>" +
        '<p class="sub">Seats: ' + esc(seatList(t)) + "</p>" +
        '<button type="button" class="modal-btn" data-view>View Ticket</button>' +
        "</div>", { cls: "success-modal" });

    confetti(el);
    el.querySelector("[data-view]").addEventListener("click", () => {
        closeModal();
        const box = document.getElementById("ticket");
        if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
}

/* ---------- booking ---------- */
form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const customerName = nameInput.value.trim();
    const customerEmail = emailInput.value.trim();
    const customerPhone = phoneInput.value.replace(/[\s-]/g, "");
    const movie = currentMovie();

    if (!showIdInput.value || !movie) {
        setMessage("Please choose a movie and a showtime.", true);
        return;
    }
    if (selected.length === 0) {
        setMessage("Please select at least one seat.", true);
        return;
    }
    if (customerName.length < 2) {
        setMessage("Please enter your name.", true);
        return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) {
        setMessage("Please enter a valid email.", true);
        return;
    }
    if (!/^\+?[0-9]{10,14}$/.test(customerPhone)) {
        setMessage("Phone number must have 10 to 14 digits.", true);
        return;
    }

    const seatsNow = selected.slice();
    const showIdNow = showIdInput.value;

    openPayment({
        total: Number(movie.price) * seatsNow.length,
        movieTitle: movie.title,
        seats: seatsNow.join(", "),

        // returns null when done, or a text message if something is wrong
        onSubmit: async (utr) => {
            const body = new URLSearchParams({
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                showId: showIdNow,
                seatNumbers: seatsNow.join(","),
                utr: utr
            });

            try {
                const r = await fetchJson("bookings",
                                          { method: "POST", body: body });

                if (r.ok && r.data && r.data.success) {
                    closeModal();
                    showTicket(r.data, false);
                    showSuccess(r.data);
                    nameInput.value = "";
                    emailInput.value = "";
                    phoneInput.value = "";
                    await loadOccupied(false);
                    loadBookings();
                    return null;
                }

                const text = (r.data && r.data.error) ||
                             "Booking failed (status " + r.status + ").";

                // seats taken by someone else -> close and refresh seats
                if (r.status === 409 && !/UTR/i.test(text)) {
                    closeModal();
                    setMessage(text, true);
                    await loadOccupied(true);
                    return null;
                }
                return text;
            } catch (e) {
                return "Could not reach the server. Is Tomcat running?";
            }
        }
    });
});

function showTicket(t, scroll) {
    let box = document.getElementById("ticket");
    if (!box) {
        box = document.createElement("div");
        box.id = "ticket";
        form.insertAdjacentElement("afterend", box);
    }

    function row(label, value) {
        return '<div class="ticket-row"><span>' + esc(label) +
               "</span><strong>" + esc(value) + "</strong></div>";
    }

    box.innerHTML =
        "<h3>🎟 BOOKING CONFIRMED</h3>" +
        '<div class="ticket-body"><div class="ticket-details">' +
        row("Booking ID", "#" + t.bookingId) +
        row("Name", t.customerName) +
        row("Movie", t.movieTitle) +
        row("Date", fmtDate(t.showDate)) +
        row("Showtime", fmtTime(t.showTime)) +
        row("Screen", t.screenName) +
        row("Seats", seatList(t)) +
        row("UTR", t.utr || "-") +
        '<div class="ticket-total"><span>Total Paid</span><strong>' +
        esc(money(t.totalAmount)) + "</strong></div></div>" +
        '<div class="ticket-qr"><div id="ticketQr"></div>' +
        "<small>Show this at the entrance</small></div></div>" +
        '<div class="ticket-actions">' +
        '<button type="button" id="pdfBtn">Download PDF</button></div>';

    makeQr(document.getElementById("ticketQr"), qrText(t), 144);
    document.getElementById("pdfBtn").addEventListener("click",
        () => downloadPdf(t));

    box.classList.remove("ticket-in");
    void box.offsetWidth;
    box.classList.add("ticket-in");

    if (scroll !== false) {
        box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

/* ---------- my bookings ---------- */
async function loadBookings() {
    try {
        const r = await fetchJson("bookings");

        if (!r.ok || !Array.isArray(r.data)) {
            bookingList.innerHTML =
                "<p>Could not load your bookings from the database (status " +
                esc(r.status) + ").</p>";
            return;
        }
        if (r.data.length === 0) {
            bookingList.innerHTML = "<p>No bookings yet.</p>";
            return;
        }

        bookingsData = r.data;

        bookingList.innerHTML = r.data.map((b, i) =>
            '<div class="booking-item">' +
            '<div class="bi-head"><h3>' + esc(b.movieTitle) + "</h3>" +
            '<span class="bi-status">' + esc(b.status) + "</span></div>" +
            '<p class="bi-meta">Booking #' + esc(b.bookingId) + " • " +
            esc(fmtDate(b.showDate)) + " • " + esc(fmtTime(b.showTime)) +
            " • " + esc(b.screenName) + "</p>" +
            "<p>Seats: <strong>" + esc(b.seats) + "</strong></p>" +
            "<p>Name: " + esc(b.customerName) + "</p>" +
            "<p>Total: <strong>" + esc(money(b.totalAmount)) + "</strong></p>" +
            (b.utr ? '<p class="bi-meta">UTR: ' + esc(b.utr) + "</p>" : "") +
            '<p class="bi-meta">Booked on ' + esc(b.bookingTime) + "</p>" +
            '<button type="button" class="dl-btn" data-pdf="' + i + '">' +
            "Download PDF</button>" +
            "</div>"
        ).join("");

        bookingList.querySelectorAll(".booking-item").forEach((item, i) => {
            reveal(item, Math.min(i, 6) * 70);
        });
        bookingList.querySelectorAll("button[data-pdf]").forEach(btn => {
            btn.addEventListener("click", () => {
                downloadPdf(bookingsData[Number(btn.dataset.pdf)]);
            });
        });
    } catch (e) {
        bookingList.innerHTML = "<p>Could not reach the server.</p>";
    }
}

/* ---------- start ---------- */
movieSelect.addEventListener("change", onMovieChange);

async function init() {
    confirmButton.textContent = "Proceed to Pay";
    onScroll();

    document.querySelectorAll(
        ".subtitle, .movies h2, .booking h2, .my-bookings h2, .booking form"
    ).forEach(el => reveal(el, 0));

    renderSeats(false);

    // loading placeholders (shimmer)
    movieContainer.innerHTML = '<div class="skeleton-card"></div>'.repeat(3);

    try {
        const m = await fetchJson("movies");
        const s = await fetchJson("shows");

        if (!m.ok || !Array.isArray(m.data)) {
            throw new Error("Movies request failed. Status " + m.status +
                            " from " + m.url);
        }
        if (!s.ok || !Array.isArray(s.data)) {
            throw new Error("Shows request failed. Status " + s.status +
                            " from " + s.url);
        }

        movies = m.data;
        shows = s.data;
        renderMovieCards();
        fillMovieSelect();
    } catch (e) {
        console.error(e);
        movieContainer.innerHTML =
            "<p>Could not load movies. Reason: " + esc(e.message) + "</p>";
    }
    loadBookings();
}

init();