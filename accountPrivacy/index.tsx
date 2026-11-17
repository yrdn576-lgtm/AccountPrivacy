/*
 * Vencord userplugin: AccountPrivacy
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

const STYLE_ID = "vc-account-privacy-style";
const MASK = "••••••••••••••••";

const FIELDS = [
    {
        id: "email",
        reveal: "Reveal email address",
        hide: "Hide email address"
    },
    {
        id: "phone",
        reveal: "Reveal phone number",
        hide: "Hide phone number"
    }
] as const;

const MASK_CLASS = "vc-account-privacy-masked";

let observer: MutationObserver | null = null;
let running = false;
let scheduled = false;

function getValueElement(
    field: typeof FIELDS[number]
): HTMLElement | null {
    const button = document.querySelector<HTMLButtonElement>(
        `button[aria-label="${field.reveal}"], button[aria-label="${field.hide}"]`
    );

    if (!button) return null;

    const container = button.parentElement;
    if (!container) return null;

    const value = Array.from(container.children).find(
        child => child !== button && child instanceof HTMLElement
    );

    return value instanceof HTMLElement ? value : null;
}

function updateVisibility() {
    if (!running) return;

    for (const field of FIELDS) {
        const value = getValueElement(field);
        if (!value) continue;

        const button = value.parentElement?.querySelector<HTMLButtonElement>(
            "button[aria-label]"
        );

        if (!button) continue;

        const revealed =
            button.getAttribute("aria-label") === field.hide;

        value.classList.toggle(MASK_CLASS, !revealed);
    }
}

function scheduleUpdate() {
    if (!running || scheduled) return;

    scheduled = true;

    queueMicrotask(() => {
        scheduled = false;
        updateVisibility();
    });
}

function buildCss() {
    return `
        .${MASK_CLASS} {
            font-size: 0 !important;
            line-height: 1.5rem !important;
            user-select: none !important;
        }

        .${MASK_CLASS}::after {
            content: "${MASK}";
            font-size: 14px !important;
            line-height: 1.5rem !important;
            color: var(--text-normal) !important;
            user-select: none !important;
        }
    `;
}

export default definePlugin({
    name: "AccountPrivacy",
    description: "Fully masks email and phone number in Discord My Account.",
    authors: [{ name: "you", id: 0n }],

    start() {
        running = true;

        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement("style");
            style.id = STYLE_ID;
            style.textContent = buildCss();
            document.head.appendChild(style);
        }

        observer = new MutationObserver(scheduleUpdate);

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["aria-label"]
        });

        updateVisibility();
    },

    stop() {
        running = false;

        observer?.disconnect();
        observer = null;

        document.getElementById(STYLE_ID)?.remove();

        document.querySelectorAll(`.${MASK_CLASS}`).forEach(
            element => element.classList.remove(MASK_CLASS)
        );
    }
});
