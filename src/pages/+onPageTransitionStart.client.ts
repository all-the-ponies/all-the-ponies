import type { PageContext } from "vike/types";

export function onPageTransitionStart(pageContext: PageContext) {
    const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLInputElement
    if (sidebarToggle) {
        sidebarToggle.checked = false
    }
}
