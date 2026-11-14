import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import ScholarshipDetails from "./ScholarshipDetails";
import ScholarshipCard from "../components/ScholarshipCard";
import { renderRoute } from "../test/renderRoute";
import { scholarship } from "../test/fixtures";
import { nextCycleInfo } from "../utils/scholarshipDisplay";

// A curated official programme whose round has closed (as returned by the backend).
const closedProgramme = scholarship({
    id: "uoft-pearson",
    registryId: "uoft-pearson",
    name: "Lester B. Pearson International Student Scholarships",
    provider: "University of Toronto",
    university: "University of Toronto",
    country: "Canada",
    deadline: "6 November 2026",
    deadlineDate: "2026-11-06",
    applicationStatus: "closed",
    applicationLink: "https://future.utoronto.ca/pearson-scholarships",
    applicationLinkStatus: "official",
    officialUrl: "https://future.utoronto.ca/pearson-scholarships",
    sourceUrl: "https://future.utoronto.ca/pearson-scholarships",
    sourceType: "university",
    sourceLabel: "University source",
    datesCheckedOn: "2026-11-13",
    officialPage: { url: "https://future.utoronto.ca/pearson-scholarships", checkedOn: "2026-11-13", readLive: false },
    nextCycle: {
        type: "tentative",
        month: "July 2027",
        text: "Tentatively expected to open in July 2027.",
        basis: "Estimated from the 2026 application cycle on the official page: “nomination form beginning July 6, 2026”"
    }
});

const unknownDates = scholarship({
    deadline: "Not specified",
    deadlineDate: null,
    applicationStatus: "unknown",
    nextCycle: { type: "unknown", text: "Next application opening date has not yet been announced." }
});

describe("application status on the details page", () => {
    const renderDetails = (state) => renderRoute(<ScholarshipDetails />, { path: "/scholarship-details", state });

    it("explains a closed round and the tentative next cycle with its basis", () => {
        renderDetails(closedProgramme);

        expect(screen.getByText("Applications: CLOSED")).toBeInTheDocument();
        expect(screen.getByText(/Applications for this scholarship are currently closed\. You can still visit the official website to review eligibility and prepare for the next application cycle\./)).toBeInTheDocument();
        expect(screen.getByText("Next application cycle (Tentative): Tentatively expected to open in July 2027.")).toBeInTheDocument();
        expect(screen.getByText(/Estimated from the 2026 application cycle/)).toBeInTheDocument();
        expect(screen.getByText(/as checked on 13 November 2026/)).toBeInTheDocument();
    });

    it("never offers to apply to a closed round, but links to the official page", () => {
        renderDetails(closedProgramme);

        expect(screen.queryByRole("link", { name: /apply on official website/i })).toBeNull();
        expect(screen.getByRole("link", { name: /visit official scholarship page/i }))
            .toHaveAttribute("href", "https://future.utoronto.ca/pearson-scholarships");
    });

    it("says dates are not announced instead of inventing them", () => {
        renderDetails(unknownDates);

        expect(screen.getByText("Applications: UNKNOWN")).toBeInTheDocument();
        expect(screen.getByText("Deadline: Not announced. Check the official website.")).toBeInTheDocument();
        expect(screen.getByText("Opening date: Not announced")).toBeInTheDocument();
        expect(screen.getByText("Next application cycle (Not announced): Next application opening date has not yet been announced.")).toBeInTheDocument();
    });

    it("shows a confirmed opening date for an upcoming round", () => {
        renderDetails(scholarship({
            applicationStatus: "upcoming",
            openingDate: "2027-02-01",
            nextCycle: { type: "confirmed", openingDate: "2027-02-01", text: "Applications open on 1 February 2027." }
        }));

        expect(screen.getByText("Applications: UPCOMING")).toBeInTheDocument();
        expect(screen.getByText("Opening date: 1 February 2027")).toBeInTheDocument();
        expect(screen.getByText("Next application cycle (Confirmed): Applications open on 1 February 2027.")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /apply on official website/i })).toBeNull();
    });
});

describe("application status on result cards", () => {
    it("keeps closed programmes visible with the next cycle", () => {
        renderRoute(<ScholarshipCard scholarship={closedProgramme} />);

        expect(screen.getByText("Applications: CLOSED")).toBeInTheDocument();
        expect(screen.getByText(/Applications are currently closed\. Next application cycle: Tentatively expected to open in July 2027\./)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /apply on official website/i })).toBeNull();
        expect(screen.getByRole("link", { name: /visit official scholarship page/i })).toBeInTheDocument();
    });

    it("shows 'Not announced' for a missing deadline", () => {
        renderRoute(<ScholarshipCard scholarship={unknownDates} />);

        expect(screen.getByText("Deadline: Not announced")).toBeInTheDocument();
        expect(screen.getByText("Applications: UNKNOWN")).toBeInTheDocument();
    });
});

describe("nextCycleInfo", () => {
    it("labels confirmed, tentative and unknown information", () => {
        expect(nextCycleInfo(closedProgramme)).toMatchObject({ label: "Tentative", text: "Tentatively expected to open in July 2027." });
        expect(nextCycleInfo(unknownDates).label).toBe("Not announced");
        expect(nextCycleInfo(scholarship({ nextCycle: null }))).toBeNull();
    });
});
