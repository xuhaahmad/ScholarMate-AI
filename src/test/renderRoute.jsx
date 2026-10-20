import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// Shows where the app navigated to and with which state, so tests can check it.
function Probe() {
    const location = useLocation();

    return (
        <pre data-testid="probe">
            {JSON.stringify({ path: location.pathname, state: location.state ?? null })}
        </pre>
    );
}

export function renderRoute(element, { path = "/", state } = {}) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: path, state }]}>
            <Routes>
                <Route path={path} element={element} />
                <Route path="*" element={<Probe />} />
            </Routes>
        </MemoryRouter>
    );
}

export function probeData(screen) {
    return JSON.parse(screen.getByTestId("probe").textContent);
}
