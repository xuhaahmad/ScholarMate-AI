import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScholarshipDetails from "./ScholarshipDetails";
import Results from "./Results";
import Profile from "./Profile";
import Loading from "./Loading";
import ScholarshipCard from "../components/ScholarshipCard";
import { renderRoute, probeData } from "../test/renderRoute";
import { scholarship, thirdPartyScholarship, legacyScholarship } from "../test/fixtures";

const PROFILE = {
    name: "Test Student",
    field: "Computer Science",
    degree: "Master",
    nationality: "Pakistani",
    cgpa: "3.7",
    cgpaScale: "4",
    country: "Germany",
    funding: "Fully Funded"
};

afterEach(() => {
    vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Scholarship details
// ---------------------------------------------------------------------------

describe("ScholarshipDetails", () => {
    const renderDetails = (state) => renderRoute(<ScholarshipDetails />, { path: "/scholarship-details", state });

    it("opens the verified official website in a new tab", () => {
        renderDetails(scholarship());

        const link = screen.getByRole("link", { name: /visit official website/i });
        expect(link).toHaveAttribute("href", "https://www.daad.de/en/apply");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(screen.getByText(/application page on daad\.de/i)).toBeInTheDocument();
    });

    it("uses the official information page when there is no official application link", () => {
        renderDetails(scholarship({
            applicationLink: "Not specified",
            applicationLinkStatus: "unavailable",
            officialUrl: "https://www.daad.de/en/scholarship"
        }));

        expect(screen.getByRole("link", { name: /visit official website/i }))
            .toHaveAttribute("href", "https://www.daad.de/en/scholarship");
        expect(screen.getByText(/official information page on daad\.de/i)).toBeInTheDocument();
    });

    it("shows an unavailable state instead of presenting a third-party page as official", () => {
        renderDetails(thirdPartyScholarship());

        expect(screen.queryByRole("link", { name: /visit official website/i })).toBeNull();
        expect(screen.getByRole("button", { name: /official website not verified/i })).toBeDisabled();

        const source = screen.getByRole("link", { name: /view the source page/i });
        expect(source).toHaveAttribute("href", "https://www.scholars4dev.com/germany");
        expect(source.textContent).toMatch(/third-party website/i);
    });

    it("never links to unsafe URLs", () => {
        const { container } = renderDetails(scholarship({ officialUrl: "javascript:alert(1)", sourceUrl: "javascript:alert(2)" }));

        expect(screen.getByRole("button", { name: /official website not verified/i })).toBeDisabled();
        expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    });

    it("shows an honest match label, eligibility checks, evidence and summary note instead of a percentage", () => {
        const { container } = renderDetails(scholarship());

        expect(screen.getAllByText("Meets Verified Requirements").length).toBeGreaterThan(0);
        expect(container.textContent).not.toMatch(/\d+%/);
        expect(container.textContent).not.toMatch(/AI Recommended/);
        expect(screen.getByText(/Degree level: Open to master students\./)).toBeInTheDocument();
        expect(screen.getByText(/Destination: In your preferred destination\. \(based on AI reading, not confirmed\)/)).toBeInTheDocument();
        expect(screen.getByText(/“Application deadline: 15 November 2026”/)).toBeInTheDocument();
        expect(screen.getByText(/AI-generated summary of the source page/)).toBeInTheDocument();
        expect(screen.getByText("15 November 2026 · Closing soon")).toBeInTheDocument();
        expect(screen.getByText("Official scholarship programme")).toBeInTheDocument();
    });

    it("explains why requirements from a third-party page are not verified", () => {
        renderDetails(thirdPartyScholarship({
            match: { level: "preliminary", note: "The requirements were read from a third-party or unverified website, so they are not treated as verified. Check them on the official website.", checks: [] }
        }));

        expect(screen.getByText(/read from a third-party or unverified website/)).toBeInTheDocument();
    });

    it("works with results in the older format", () => {
        renderDetails(legacyScholarship({ reasons: ["Looks relevant."] }));

        expect(screen.getByRole("heading", { name: "Legacy Scholarship" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /official website not verified/i })).toBeDisabled();
        expect(screen.getByText(/Looks relevant\./)).toBeInTheDocument();
        expect(screen.getByText("No summary available.")).toBeInTheDocument();
    });

    it("handles direct visits without scholarship data", () => {
        renderDetails(undefined);

        expect(screen.getByText("Scholarship Not Found")).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Scholarship card
// ---------------------------------------------------------------------------

describe("ScholarshipCard", () => {
    const renderCard = (item) => renderRoute(<ScholarshipCard scholarship={item} />);

    it("labels match levels honestly", () => {
        renderCard(scholarship());
        expect(screen.getByText("Meets Verified Requirements")).toBeInTheDocument();
        expect(screen.getByText("Verified")).toBeInTheDocument();
        expect(screen.getByText("Eligibility Check")).toBeInTheDocument();
    });

    it("marks preliminary and not-eligible results", () => {
        renderCard(thirdPartyScholarship());
        expect(screen.getByText("Preliminary Match")).toBeInTheDocument();

        renderCard(scholarship({ id: "x", match: { level: "not_eligible", checks: [] }, eligibilityStatus: "not_a_match" }));
        expect(screen.getByText("Not Eligible")).toBeInTheDocument();
    });

    it("links official pages as official and other pages as labelled sources", () => {
        renderCard(scholarship());
        expect(screen.getByRole("link", { name: /apply on official website/i })).toHaveAttribute("href", "https://www.daad.de/en/apply");

        renderCard(thirdPartyScholarship());
        expect(screen.getByRole("link", { name: /view source \(third-party website\)/i }))
            .toHaveAttribute("href", "https://www.scholars4dev.com/germany");
    });

    it("explains when no requirements were confirmed and shows the source type", () => {
        renderCard(thirdPartyScholarship());

        expect(screen.getByText(/No requirements could be confirmed/)).toBeInTheDocument();
        expect(screen.getByText("Third-party website")).toBeInTheDocument();
        expect(screen.getByText("AI's preliminary view")).toBeInTheDocument();
    });

    it("opens the details page with the scholarship", async () => {
        renderCard(scholarship());

        await userEvent.click(screen.getByRole("button", { name: /view full details/i }));

        const probe = probeData(screen);
        expect(probe.path).toBe("/scholarship-details");
        expect(probe.state.name).toBe("DAAD Study Scholarships");
    });
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

describe("Results", () => {
    const many = Array.from({ length: 23 }, (_, index) => scholarship({
        id: `s${index}`,
        name: `Scholarship ${String(index + 1).padStart(2, "0")}`,
        country: index % 2 === 0 ? "Germany" : "France"
    }));

    const renderResults = (state) => renderRoute(<Results />, { path: "/results", state });

    it("keeps the backend order and paginates 10 per page", async () => {
        renderResults({ profile: PROFILE, scholarships: many });

        expect(screen.getAllByRole("heading", { level: 2, name: /^Scholarship \d+$/ }).map((item) => item.textContent))
            .toEqual(many.slice(0, 10).map((item) => item.name));
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

        await userEvent.click(screen.getByRole("button", { name: /next/i }));
        await userEvent.click(screen.getByRole("button", { name: /next/i }));

        expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
        expect(screen.getAllByRole("heading", { level: 2, name: /^Scholarship \d+$/ })).toHaveLength(3);
        expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("filters by country and resets to the first page", async () => {
        renderResults({ profile: PROFILE, scholarships: many });

        await userEvent.click(screen.getByRole("button", { name: /next/i }));
        await userEvent.selectOptions(screen.getByLabelText(/filter by country/i), "France");

        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
        expect(screen.getAllByRole("heading", { level: 2, name: /^Scholarship \d+$/ }).every((item) =>
            Number(item.textContent.slice(-2)) % 2 === 0)).toBe(true);
    });

    it("searches without crashing on older results that lack fields", async () => {
        renderResults({ profile: PROFILE, scholarships: [legacyScholarship({ country: undefined, university: undefined })] });

        await userEvent.type(screen.getByLabelText(/search scholarships/i), "nothing matches this");

        expect(screen.getByText("No Scholarships Found")).toBeInTheDocument();
        expect(screen.getByText("Try another search or country.")).toBeInTheDocument();
    });

    it("shows honest coverage information", () => {
        renderResults({
            profile: PROFILE,
            scholarships: [scholarship()],
            coverage: { sourcesAnalyzed: 8, officialSourcesAnalyzed: 3, notes: ["This list is not exhaustive. Always confirm details on the official website before applying."] }
        });

        expect(screen.getByText(/Found 1 scholarship from 8 analyzed sources \(3 official\)/)).toBeInTheDocument();
        expect(screen.getByText(/This list is not exhaustive/)).toBeInTheDocument();
    });

    it("explains an empty result set", () => {
        renderResults({ profile: PROFILE, scholarships: [], coverage: { sourcesAnalyzed: 0, notes: [] } });

        expect(screen.getByText(/could not find scholarships for this profile in the sources we searched/)).toBeInTheDocument();
    });

    it("summarizes the profile with degree and CGPA scale", () => {
        renderResults({ profile: PROFILE, scholarships: [] });

        expect(screen.getByText("Computer Science (Master)")).toBeInTheDocument();
        expect(screen.getByText("3.7 / 4")).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

describe("Profile", () => {
    it("collects degree level, nationality and CGPA scale and passes them on", async () => {
        renderRoute(<Profile />, { path: "/profile" });
        const user = userEvent.setup();

        await user.type(screen.getByLabelText("Full Name"), "Test Student");
        await user.type(screen.getByLabelText("Academic Field"), "Computer Science");
        await user.selectOptions(screen.getByLabelText("Degree Level"), "Master");
        await user.type(screen.getByLabelText("Nationality"), "Pakistani");
        await user.type(screen.getByLabelText("CGPA"), "3.7");
        await user.selectOptions(screen.getByLabelText("CGPA Scale"), "4");
        await user.type(screen.getByLabelText("Preferred Country"), "Germany");
        await user.click(screen.getByRole("button", { name: /find my scholarships/i }));

        const probe = probeData(screen);
        expect(probe.path).toBe("/loading");
        expect(probe.state).toMatchObject({ field: "Computer Science", degree: "Master", nationality: "Pakistani", cgpa: "3.7", cgpaScale: "4", country: "Germany" });
    });

    it("requires the academic field and degree level", () => {
        renderRoute(<Profile />, { path: "/profile" });

        expect(screen.getByLabelText("Academic Field")).toBeRequired();
        expect(screen.getByLabelText("Degree Level")).toBeRequired();
        expect(screen.getByLabelText("Nationality")).not.toBeRequired();
    });

    it("is prefilled when coming back to edit the profile", () => {
        renderRoute(<Profile />, { path: "/profile", state: { profile: PROFILE } });

        expect(screen.getByLabelText("Academic Field")).toHaveValue("Computer Science");
        expect(screen.getByLabelText("Degree Level")).toHaveValue("Master");
        expect(screen.getByLabelText("Nationality")).toHaveValue("Pakistani");
        expect(screen.getByLabelText("CGPA Scale")).toHaveValue("4");
    });
});

// ---------------------------------------------------------------------------
// Loading (frontend/backend integration)
// ---------------------------------------------------------------------------

describe("Loading", () => {
    const jsonResponse = (status, body) => Promise.resolve(new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    }));

    it("posts the profile to /api/search-scholarships and opens the results", async () => {
        const fetchMock = vi.fn(() => jsonResponse(200, { query: "q", scholarships: [scholarship()], coverage: { sourcesAnalyzed: 1, notes: [] } }));
        vi.stubGlobal("fetch", fetchMock);

        renderRoute(<Loading />, { path: "/loading", state: PROFILE });

        await waitFor(() => expect(screen.getByTestId("probe")).toBeInTheDocument());

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/search-scholarships");
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toMatchObject({ field: "Computer Science", degree: "Master", nationality: "Pakistani", cgpaScale: "4", destination: "Germany" });

        const probe = probeData(screen);
        expect(probe.path).toBe("/results");
        expect(probe.state.scholarships).toHaveLength(1);
        expect(probe.state.coverage.sourcesAnalyzed).toBe(1);
    });

    it("defaults the degree for profiles saved before the degree field existed", async () => {
        const fetchMock = vi.fn(() => jsonResponse(200, { scholarships: [] }));
        vi.stubGlobal("fetch", fetchMock);

        renderRoute(<Loading />, { path: "/loading", state: { field: "Law", country: "Japan" } });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).degree).toBe("Bachelor");
    });

    it("shows the server's safe error message with retry and edit options", async () => {
        const fetchMock = vi.fn(() => jsonResponse(503, { error: "ScholarMate AI is busy right now. Please try again in a minute.", code: "AI_BUSY" }));
        vi.stubGlobal("fetch", fetchMock);

        renderRoute(<Loading />, { path: "/loading", state: PROFILE });

        expect(await screen.findByText("Search Didn't Finish")).toBeInTheDocument();
        expect(screen.getByText(/busy right now/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

        await userEvent.click(await screen.findByRole("button", { name: /edit profile/i }));
        const probe = probeData(screen);
        expect(probe.path).toBe("/profile");
        expect(probe.state.profile.field).toBe("Computer Science");
    });

    it("explains network failures", async () => {
        vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

        renderRoute(<Loading />, { path: "/loading", state: PROFILE });

        expect(await screen.findByText(/couldn't reach ScholarMate AI/)).toBeInTheDocument();
    });

    it("does not call the API without a profile or academic field", () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        renderRoute(<Loading />, { path: "/loading" });
        expect(screen.getByText("No Profile Found")).toBeInTheDocument();

        renderRoute(<Loading />, { path: "/loading", state: { ...PROFILE, field: "  " } });
        expect(screen.getByText("Academic Field Required")).toBeInTheDocument();

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
