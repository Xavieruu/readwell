/* =========================================================
   ReadWell — shared layout and UI helpers
   - Renders the header (brand + role-appropriate navigation) and footer
   - Hash-based section switching for the two dashboards
   - Small form helpers (errors, show/hide password)
   User-entered text is only ever inserted with textContent.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW;
    var doc = global.document;
    var auth = RW.auth;

    /* Links are written relative to the site root and made absolute-safe
       with RW.url() so they work from index.html, parent/ and student/. */
    var NAV = {
        parent: [
            ['dashboard', 'Dashboard', 'parent/parent-dashboard.html#dashboard', 'home'],
            ['children', 'Children', 'parent/child-management.html', 'users'],
            ['activity', 'Activity', 'parent/parent-dashboard.html#activity', 'pulse'],
            ['progress', 'Progress', 'parent/parent-dashboard.html#progress', 'chart'],
            ['settings', 'Settings', 'parent/parent-settings.html', 'settings']
        ],
        student: [
            ['home', 'Home', 'student/student-dashboard.html#home', 'home'],
            ['reading', 'Reading', 'student/reading.html', 'book'],
            ['progress', 'Progress', 'student/progress.html', 'chart'],
            ['bookmarks', 'Bookmarks', 'student/bookmarks.html', 'bookmark'],
            ['history', 'History', 'student/activity-history.html', 'history'],
            ['settings', 'Settings', 'student/profile.html', 'user']
        ],
        // Signed-out visitors. Keys match each page's data-page value.
        visitor: [
            ['parent-login', 'Log In', 'parent/parent-login.html', 'login'],
            ['parent-register', 'Sign Up', 'parent/parent-register.html', 'plus']
        ]
    };

    var BOOK_ICON =
        '<svg class="brand-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M2.5 5.5C4.5 4.5 8 4.3 12 6.5c4-2.2 7.5-2 9.5-1v13c-2-1-5.5-1.2-9.5 1-4-2.2-7.5-2-9.5-1z"/>' +
        '<path d="M12 6.5v13"/></svg>';

    var toggleButton = null;
    var navElement = null;

    /* ---------- tiny DOM helpers ---------- */

    function byId(id) { return doc.getElementById(id); }

    function el(tag, props, children) {
        var node = doc.createElement(tag);
        var p = props || {};
        Object.keys(p).forEach(function (key) {
            if (key === 'text') { node.textContent = p[key]; }
            else if (key === 'class') { node.className = p[key]; }
            else { node.setAttribute(key, p[key]); }
        });
        (children || []).forEach(function (child) {
            if (child === null || child === undefined) { return; }
            node.appendChild(typeof child === 'string' ? doc.createTextNode(child) : child);
        });
        return node;
    }

    function clear(node) {
        while (node.firstChild) { node.removeChild(node.firstChild); }
    }

    /* ---------- form helpers ---------- */

    function setFieldError(id, message) {
        var input = byId(id);
        var error = byId(id + '-error');
        if (!input || !error) { return; }
        error.textContent = message;
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
    }

    function clearErrors(form) {
        var errors = form.querySelectorAll('.field-error');
        var invalid = form.querySelectorAll('[aria-invalid]');
        var alerts = form.querySelectorAll('.alert');
        var i;
        for (i = 0; i < errors.length; i++) { errors[i].hidden = true; errors[i].textContent = ''; }
        for (i = 0; i < invalid.length; i++) { invalid[i].removeAttribute('aria-invalid'); }
        for (i = 0; i < alerts.length; i++) { alerts[i].hidden = true; }
    }

    function showAlert(message) {
        var box = byId('form-alert');
        var text = byId('form-alert-text');
        if (!box || !text) { return; }
        text.textContent = message;
        box.hidden = false;
        box.setAttribute('tabindex', '-1');
        box.focus();
    }

    function focusFirstInvalid(form) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) { first.focus(); }
    }

    function bindShowToggle(checkboxId, inputIds) {
        var box = byId(checkboxId);
        if (!box) { return; }
        box.addEventListener('change', function () {
            inputIds.forEach(function (id) {
                var input = byId(id);
                if (input) { input.type = box.checked ? 'text' : 'password'; }
            });
        });
    }

    /* ---------- header / footer ---------- */

    function closeMenu() {
        if (navElement) { navElement.classList.remove('is-open'); }
        if (toggleButton) { toggleButton.setAttribute('aria-expanded', 'false'); }
    }

    function navItem(item, current) {
        var a = el('a', { href: RW.url(item[2]), 'data-key': item[0] });
        if (item[3] && RW.icons) { a.innerHTML = RW.icons.svg(item[3]); }
        a.appendChild(doc.createTextNode(item[1]));
        if (item[0] === current) { a.setAttribute('aria-current', 'page'); }
        return el('li', {}, [a]);
    }

    function renderHeader() {
        var header = byId('site-header');
        if (!header) { return; }

        var body = doc.body;
        var area = body.getAttribute('data-area') || 'public';
        var current = body.getAttribute('data-nav') || body.getAttribute('data-page') || '';
        var session = auth.getSession();

        // Signed-out/public pages have only two links, so they never collapse.
        var compact = area === 'public';

        var homeHref = RW.url('index.html');
        if (area === 'parent') { homeHref = RW.url('parent/parent-dashboard.html#dashboard'); }
        if (area === 'student') { homeHref = RW.url('student/student-dashboard.html#home'); }

        var areaLabel = '';
        if (area === 'parent') { areaLabel = '<span class="area-label">Parent</span>'; }
        if (area === 'student') { areaLabel = '<span class="area-label">Student</span>'; }

        var toggle = compact ? '' :
            '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>';

        header.innerHTML =
            '<div class="header-inner">' +
                '<a class="brand" href="' + homeHref + '">' + BOOK_ICON + '<span>ReadWell</span></a>' +
                areaLabel +
                toggle +
                '<nav class="primary-nav' + (compact ? ' is-compact' : '') + '" id="primary-nav" aria-label="Main">' +
                    '<ul class="nav-list"></ul>' +
                '</nav>' +
            '</div>';

        var list = header.querySelector('.nav-list');
        var needsLogout = false;

        if (area === 'parent' || area === 'student') {
            NAV[area].forEach(function (item) { list.appendChild(navItem(item, current)); });
            needsLogout = true;
        } else if (session) {
            var dash = el('a', { href: auth.dashboardUrl(session), 'data-key': 'dashboard' });
            if (RW.icons) { dash.innerHTML = RW.icons.svg('home'); }
            dash.appendChild(doc.createTextNode('My dashboard'));
            list.appendChild(el('li', {}, [dash]));
            needsLogout = true;
        } else {
            NAV.visitor.forEach(function (item) { list.appendChild(navItem(item, current)); });
        }

        if (needsLogout) {
            var logout = el('button', { type: 'button', class: 'nav-button' });
            if (RW.icons) { logout.innerHTML = RW.icons.svg('logout'); }
            logout.appendChild(doc.createTextNode('Logout'));
            logout.addEventListener('click', auth.logout);
            list.appendChild(el('li', {}, [logout]));
        }

        toggleButton = header.querySelector('.menu-toggle');
        navElement = header.querySelector('.primary-nav');

        if (toggleButton) {
            toggleButton.addEventListener('click', function () {
                var open = navElement.classList.toggle('is-open');
                toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }

        header.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && toggleButton && navElement.classList.contains('is-open')) {
                closeMenu();
                toggleButton.focus();
            }
        });
    }

    function renderFooter() {
        var footer = byId('site-footer');
        if (!footer) { return; }
        footer.innerHTML =
            '<p>Prototype: sign-in is simulated and everything is saved only in this browser. ' +
            'Please do not use a password you use anywhere else.</p>';
    }

    function warnIfStorageOff() {
        var main = byId('main-content');
        if (!main || RW.store.available()) { return; }
        var box = el('div', { class: 'alert alert-error', role: 'alert' }, [
            el('strong', { class: 'alert-label', text: 'Storage is turned off.' }),
            ' ReadWell saves its data in your browser. Allow site data or leave private browsing, then reload this page.'
        ]);
        var wrap = el('div', { class: 'container' }, [box]);
        wrap.style.paddingTop = '16px';
        main.insertBefore(wrap, main.firstChild);
    }

    /* ---------- dashboard sections (hash routing) ---------- */

    function initSections(defaultKey) {
        var sections = doc.querySelectorAll('[data-section]');
        if (!sections.length) { return; }

        function keyFromHash() {
            var key = global.location.hash.replace('#', '');
            for (var i = 0; i < sections.length; i++) {
                if (sections[i].getAttribute('data-section') === key) { return key; }
            }
            return defaultKey;
        }

        function show(moveFocus) {
            var key = keyFromHash();
            var active = null;
            var i;
            for (i = 0; i < sections.length; i++) {
                var isMatch = sections[i].getAttribute('data-section') === key;
                sections[i].hidden = !isMatch;
                if (isMatch) { active = sections[i]; }
            }

            var navKey = active.getAttribute('data-nav') || key;
            var links = doc.querySelectorAll('.nav-list a[data-key]');
            for (i = 0; i < links.length; i++) {
                if (links[i].getAttribute('data-key') === navKey) {
                    links[i].setAttribute('aria-current', 'page');
                } else {
                    links[i].removeAttribute('aria-current');
                }
            }

            var title = active.getAttribute('data-title');
            if (title) { doc.title = title + ' | ReadWell'; }
            closeMenu();

            if (moveFocus) {
                var heading = active.querySelector('h1');
                if (heading) {
                    heading.setAttribute('tabindex', '-1');
                    heading.focus();
                }
                global.scrollTo(0, 0);
            }
        }

        global.addEventListener('hashchange', function () { show(true); });
        show(false);
    }


    /* ---------- scroll progress bar ----------
       A thin bar fixed to the top of the window that fills as the page
       is scrolled. It is decoration only (aria-hidden) and has no
       animation of its own, so it is safe with Reduced motion. */
    function initScrollBar() {
        if (byId('scroll-bar')) { return; }
        var bar = el('div', { id: 'scroll-bar', class: 'scroll-bar', 'aria-hidden': 'true' }, [
            el('div', { class: 'scroll-bar-fill' })
        ]);
        doc.body.appendChild(bar);
        var fill = bar.firstChild;
        var waiting = false;

        function update() {
            waiting = false;
            var room = doc.documentElement.scrollHeight - global.innerHeight;
            var pct = room > 0 ? Math.min(100, Math.max(0, (global.pageYOffset / room) * 100)) : 0;
            fill.style.width = pct + '%';
            bar.hidden = room <= 0;
        }
        function onScroll() {
            if (!waiting) { waiting = true; global.requestAnimationFrame(update); }
        }
        global.addEventListener('scroll', onScroll, { passive: true });
        global.addEventListener('resize', onScroll);
        global.addEventListener('hashchange', onScroll);
        update();
    }

    RW.ui = {
        byId: byId,
        el: el,
        clear: clear,
        setFieldError: setFieldError,
        clearErrors: clearErrors,
        showAlert: showAlert,
        focusFirstInvalid: focusFirstInvalid,
        bindShowToggle: bindShowToggle,
        initSections: initSections
    };

    renderHeader();
    renderFooter();
    warnIfStorageOff();
    initScrollBar();
})(window);
