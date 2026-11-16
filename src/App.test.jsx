import { afterEach, describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import App from "./App";

describe("App routes", () => {
    afterEach(() => window.history.replaceState(null, "", "/"));

    it("sends unknown addresses to the home page instead of a blank page", async () => {
        window.history.replaceState(null, "", "/does-not-exist");

        render(<App />);

        await waitFor(() => expect(window.location.pathname).toBe("/"));
    });
});
