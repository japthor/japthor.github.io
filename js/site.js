/* site.js: navigation, project dialogs and scroll reveal. No dependencies. */
(function () {
	"use strict";

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* header: solid once the page scrolls */
	var header = document.querySelector(".site-header");
	var root = document.documentElement;
	var jobLists = document.querySelectorAll(".jobs");
	var ticking = false;
	function update() {
		ticking = false;
		header.classList.toggle("is-scrolled", window.scrollY > 24);
		var max = root.scrollHeight - window.innerHeight;
		root.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : 0);  // top progress bar
		jobLists.forEach(function (list) {  // timeline lines fill as you read down
			var r = list.getBoundingClientRect();
			list.style.setProperty("--tp", Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height)).toFixed(4));
		});
	}
	function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll);
	update();

	/* hero: red glow follows the pointer (mouse only) */
	var hero = document.querySelector(".hero");
	if (hero && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
		hero.addEventListener("pointermove", function (e) {
			var r = hero.getBoundingClientRect();
			var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
			hero.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
			hero.style.setProperty("--my", (y * 100).toFixed(1) + "%");
		});
	}

	/* mobile menu */
	var toggle = document.querySelector(".nav-toggle");
	var nav = document.getElementById("site-nav");
	function setMenu(open) {
		toggle.setAttribute("aria-expanded", String(open));
		nav.classList.toggle("is-open", open);
		header.classList.toggle("menu-open", open);
	}
	toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
	nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
	document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); } });

	/* highlight the section in view */
	var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
	if ("IntersectionObserver" in window) {
		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id); });
			});
		}, { rootMargin: "-45% 0px -50% 0px" });
		links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });
	}

	/* reveal cards and jobs once as they enter; stagger within a row */
	if ("IntersectionObserver" in window && !reduceMotion) {
		document.documentElement.classList.add("js-reveal");
		document.querySelectorAll(".cards [data-reveal]").forEach(function (el, i) { el.style.transitionDelay = ((i % 4) * 60) + "ms"; });
		var revealer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-visible");
				revealer.unobserve(entry.target);
			});
		}, { rootMargin: "0px 0px -8% 0px" });
		document.querySelectorAll("[data-reveal]").forEach(function (el) { revealer.observe(el); });
	}

	// Phone stays out of the HTML source: decoded on click, then dials on touch devices.
	document.querySelectorAll(".phone-btn").forEach(function (btn) {
		btn.addEventListener("click", function () {
			var num = atob(btn.getAttribute("data-p"));
			btn.querySelector("span").textContent = num;
			if (window.matchMedia("(pointer: coarse)").matches) window.location.href = "tel:" + num.replace(/\s/g, "");
		});
	});

	/* box grids (technologies, skills): the last box stretches to close the final row, so none sits alone */
	var boxLists = document.querySelectorAll(".tech:not(.tech--wide), .cells");
	function fitBoxes() {
		boxLists.forEach(function (ul) {
			var items = ul.children;
			Array.prototype.forEach.call(items, function (li) { li.style.gridColumn = ""; });
			// on phones the technology boxes already pair up through .is-wide
			if (ul.classList.contains("tech") && window.innerWidth <= 560) return;
			var cols = getComputedStyle(ul).gridTemplateColumns.split(" ").length, rest = items.length % cols;
			if (rest && items.length > cols) items[items.length - 1].style.gridColumn = "span " + (cols - rest + 1);
		});
	}
	fitBoxes();
	window.addEventListener("resize", function () { window.requestAnimationFrame(fitBoxes); });

	/* references: reveal on click */
	document.querySelectorAll(".ref-btn").forEach(function (btn) {
		btn.addEventListener("click", function () {
			btn.querySelector("span").textContent = "On request";
			window.location.href = "mailto:" + btn.getAttribute("data-mail") + "?subject=" + encodeURIComponent("References request");
		});
	});

	/* project dialogs */
	var lastTrigger = null;
	function openDialog(id, trigger) {
		var dlg = document.getElementById(id);
		if (!dlg || typeof dlg.showModal !== "function") return;
		lastTrigger = trigger || document.querySelector('[data-open="' + id + '"]');
		dlg.showModal();
		document.body.style.overflow = "hidden";
	}
	function closeDialog(dlg) {
		if (!dlg.open || dlg.classList.contains("is-closing")) return;
		if (reduceMotion) { dlg.close(); return; }
		dlg.classList.add("is-closing");
		window.setTimeout(function () { dlg.classList.remove("is-closing"); dlg.close(); }, 150);
	}
	document.querySelectorAll("[data-open]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			openDialog(btn.getAttribute("data-open"), btn);
		});
	});
	document.querySelectorAll("[data-step]").forEach(function (btn) {  // previous / next project
		btn.addEventListener("click", function () {
			btn.closest("dialog").close();
			openDialog(btn.getAttribute("data-step"));
		});
	});
	document.querySelectorAll("dialog.dlg").forEach(function (dlg) {
		dlg.addEventListener("click", function (e) {
			if (e.target === dlg || e.target.closest("[data-close]")) closeDialog(dlg);  // backdrop click or close button
		});
		dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDialog(dlg); });  // Esc, animated
		dlg.addEventListener("close", function () {
			if (document.querySelector("dialog.dlg[open]")) return;  // stepping to another project
			document.body.style.overflow = "";
			if (lastTrigger) lastTrigger.focus({ preventScroll: true });
		});
	});
})();
