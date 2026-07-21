/* =========================================================
 * Middle-click support for link buttons
 * Lets middle-click / auxiliary-click open a link in a new tab.
 * ========================================================= */

function handleButtonClick(url, event) {
    if (event.button === 1 || event.button === 4) {
        window.open(url, "_blank");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".button, .buttonsmall");

    buttons.forEach(function (button) {
        button.addEventListener("mouseup", function (event) {
            const url = this.getAttribute("href");
            if (url != null) {
                handleButtonClick(url, event);
            }
        });
    });
});


/* =========================================================
 * Business email
 * Built from character codes at runtime as a light deterrent
 * against basic email-harvesting bots scraping the page source.
 * ========================================================= */

function renderBusinessEmail() {
    const userCodes = [116, 97, 104, 118, 111, 98, 105, 122];
    const domainCodes = [112, 109, 46, 109, 101];
    const user = String.fromCharCode.apply(null, userCodes);
    const domain = String.fromCharCode.apply(null, domainCodes);
    const address = user + "@" + domain;

    const el = document.getElementById("business-email");
    if (!el) return;

    const link = document.createElement("a");
    link.href = "mailto:" + address;
    link.textContent = address;
    link.rel = "nofollow";

    el.textContent = "";
    el.appendChild(link);
}

document.addEventListener("DOMContentLoaded", renderBusinessEmail);


/* =========================================================
 * Twitch live status
 * Uses decapi.me (a free, unauthenticated status proxy) since a
 * static GitHub Pages site can't safely call Twitch's own API
 * without exposing a client secret. Checked once on page load.
 * ========================================================= */

const TWITCH_CHANNEL = "tahvolive";

// --- Visual test mode ---
// 1) URL param: add ?forcelive=true or ?forcelive=false to the page URL
//    to preview that state. While this param is present, the real
//    Twitch check is skipped entirely so it won't get overwritten.
// 2) Console helper: open dev tools console on the live page and run
//    previewLiveState(true) or previewLiveState(false) to preview
//    instantly. (Gets overwritten by the next real check unless the
//    URL param above is also set.)
const urlParams = new URLSearchParams(window.location.search);
const forcedLive = urlParams.has("forcelive")
? urlParams.get("forcelive") !== "false"
: null;

function applyLiveState(isLive) {
    const profileEl = document.getElementById("profile");
    const twitchStatusEl = document.getElementById("twitch-status-text");
    if (!profileEl || !twitchStatusEl) return;

    profileEl.classList.toggle("is-live", isLive);
    twitchStatusEl.textContent = isLive ? "LIVE" : "";
    twitchStatusEl.classList.toggle("is-live", isLive);
}

window.previewLiveState = function (isLive) {
    applyLiveState(!!isLive);
    console.log(
        "[Twitch live check] Previewing live =",
        !!isLive,
        "(visual only, will be overwritten by the next real check unless ?forcelive= is set in the URL)"
    );
};

function checkTwitchLive() {
    if (forcedLive !== null) {
        applyLiveState(forcedLive);
        return;
    }

    const requestUrl = `https://decapi.me/twitch/uptime/${TWITCH_CHANNEL}?offline_msg=offline`;

    fetch(requestUrl)
    .then(function (res) {
        if (!res.ok) {
            throw new Error(`decapi responded with HTTP ${res.status} ${res.statusText}`);
        }
        return res.text();
    })
    .then(function (text) {
        const isLive = text.trim().toLowerCase() !== "offline";
        applyLiveState(isLive);
    })
    .catch(function (err) {
        console.error("Twitch live check failed:", err);
        console.info(
            "[Twitch live check] Debug info — request URL:", requestUrl,
            "\nerror name:", err && err.name,
            "\nerror message:", err && err.message,
            '\n\nA generic "TypeError: Failed to fetch" (no HTTP status, no response body) almost always means the request never completed at the network/browser level, not that decapi returned bad data. Common causes:',
                     "\n1) Opening this file directly as file:// instead of via http(s) (e.g. a local server or the live GitHub Pages URL) — some browsers block fetch() from file:// origins entirely.",
                     "\n2) An ad blocker, privacy extension, or browser DNS blocklist blocking requests to decapi.me (uBlock/Brave Shields sometimes flag third-party API domains).",
                     "\n3) No internet connection at the moment of the check.",
                     "\n4) decapi.me being temporarily down or rate-limiting.",
                     '\nOpen the Network tab in dev tools, reload, and look for the request to decapi.me — if it shows "(blocked:other)" or "(failed) net::ERR_BLOCKED_BY_CLIENT" that confirms an extension/blocklist; if it shows nothing at all, it never left the browser (file:// or offline); if it shows a red status code, decapi itself returned an error.'
        );
    });
}

document.addEventListener("DOMContentLoaded", function () {
    checkTwitchLive();
});
