(function () {
    'use strict';

    var storageKey = 'wdsfaDoneForYouTheme';

    function remember(card, link) {
        if (!card || !link) {
            return;
        }

        var name = String(card.getAttribute('data-name') || '').trim();
        var id = String(card.getAttribute('data-id') || '').trim();
        if (!name && !id) {
            return;
        }

        var payload = { name: name, id: id, savedAt: Date.now() };
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (error) {}

        // Cookie fallback also works when checkout is opened in a new tab.
        if (name) {
            document.cookie = 'wdsfa_dfu_theme_name=' + encodeURIComponent(name) + '; path=/; max-age=86400; SameSite=Lax';
        }
        if (id) {
            document.cookie = 'wdsfa_dfu_theme_id=' + encodeURIComponent(id) + '; path=/; max-age=86400; SameSite=Lax';
        }

        try {
            var url = new URL(link.href, window.location.href);
            var host = String(url.hostname || '').toLowerCase();
            if (host.indexOf('whatsapp.com') !== -1 || host === 'wa.me') {
                return;
            }
            if (name) {
                url.searchParams.set('wdsfa_theme', name);
            }
            if (id) {
                url.searchParams.set('wdsfa_theme_id', id);
            }
            link.href = url.toString();
        } catch (error) {}
    }

    document.addEventListener('click', function (event) {
        var link = event.target && event.target.closest ? event.target.closest('.wds-catalog-card .wds-btn-checkout') : null;
        if (!link) {
            return;
        }
        remember(link.closest('.wds-catalog-card'), link);
    }, true);
})();
