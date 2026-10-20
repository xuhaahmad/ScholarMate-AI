import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    cleanup();
});

// framer-motion's whileInView needs IntersectionObserver, which jsdom lacks.
class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
}

globalThis.IntersectionObserver ??= IntersectionObserverStub;
window.IntersectionObserver ??= IntersectionObserverStub;

window.matchMedia ??= () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
        return false;
    }
});
