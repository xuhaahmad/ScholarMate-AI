// Curated official scholarship sources for the supported study destinations.
//
// This is NOT a scholarship database. Each entry only records:
// - the official page (checked to load and to describe the scholarship),
// - who runs it and in which country,
// - facts copied from that page, each with the exact quote ("evidence"),
// - the date the page was checked.
// Deadlines, funding and eligibility are read from the live page at search
// time. `knownDates` and `cycle` are only used when the live page cannot be
// read or does not state dates, and are always shown with their source.
//
// kind: "programme" = a named scholarship shown as a result;
//       "directory" = an official funding page searched for named scholarships.
// fetch: "direct" = the page can be read with a normal request;
//        "extract" = the site blocks automated requests, so Tavily Extract is used.

const CHECKED = "2026-11-13";

export const OFFICIAL_SOURCES = [
    // ------------------------------------------------------------ Germany
    {
        id: "daad-scholarships", kind: "programme", country: "DE", fetch: "extract",
        name: "DAAD Scholarships for Graduates and Doctoral Students",
        provider: "DAAD (German Academic Exchange Service)",
        url: "https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "DAAD scholarships are aimed primarily at graduates, doctoral students and postdocs"
    },
    {
        id: "deutschlandstipendium", kind: "programme", country: "DE", fetch: "direct",
        name: "Deutschlandstipendium",
        provider: "German Federal Government and private sponsors",
        url: "https://www.deutschlandstipendium.de/deutschlandstipendium/de/services/english/english_node.html",
        degreeLevels: ["bachelor", "master"],
        degreeEvidence: "The Deutschlandstipendium programme supports talented and high-achieving students at public and state-recognised universities in Germany.",
        nationality: { type: "any", evidence: "First- and higher-semester students of all nationalities can apply directly to their university." },
        funding: { text: "300 euros per month", evidence: "300 euros per month for international top-class talent" }
    },
    {
        id: "boell-foundation", kind: "programme", country: "DE", fetch: "direct",
        name: "Heinrich Böll Foundation Scholarships", provider: "Heinrich Böll Foundation",
        url: "https://www.boell.de/en/applying-scholarship",
        degreeLevels: ["bachelor", "master", "phd"],
        degreeEvidence: "The Heinrich Böll Foundation's Scholarship Program awards undergraduate and doctoral scholarships to German and international students and doctoral candidates.",
        howToApply: { text: "Two application rounds a year, with deadlines on 1 March and 1 September. From 1 March 2027 Master's applications are limited (see the official page).", evidence: "Each year, we run two application procedures. The deadlines are 1 March and 1 September" }
    },
    {
        id: "kas-international", kind: "programme", country: "DE", fetch: "direct",
        name: "Konrad-Adenauer-Stiftung Scholarships for International Students", provider: "Konrad-Adenauer-Stiftung",
        url: "https://www.kas.de/en/web/jordanien/static-contents-detail/-/content/scholarships-for-study-and-research-in-germany-6",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "The standard funding periods are two years (Master) respectively three years (PhD).",
        funding: { text: "850 euros per month (Master's), 1,200 euros per month (PhD)", evidence: "for Master students 850 Euro per month, for PhD students 1.200 Euro per month" }
    },
    {
        id: "tum-scholarships", kind: "directory", country: "DE", fetch: "direct",
        name: "Technical University of Munich scholarships", institution: "Technical University of Munich",
        url: "https://www.tum.de/en/studies/fees-and-financial-aid/scholarships"
    },

    // ----------------------------------------------------- United Kingdom
    {
        id: "chevening", kind: "programme", country: "GB", fetch: "direct",
        name: "Chevening Scholarships", provider: "UK Government (FCDO)",
        url: "https://www.chevening.org/scholarships/",
        degreeLevels: ["master"],
        degreeEvidence: "Chevening Scholarships enable outstanding emerging leaders from all over the world to pursue one-year master’s degrees in the UK."
    },
    {
        id: "gates-cambridge", kind: "programme", country: "GB", fetch: "direct",
        name: "Gates Cambridge Scholarships", provider: "Gates Cambridge Trust", institution: "University of Cambridge",
        url: "https://www.gatescambridge.org/",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "Gates Cambridge is an international scholarship programme at the University of Cambridge for outstanding postgraduate students"
    },
    {
        id: "commonwealth-scholarships", kind: "programme", country: "GB", fetch: "direct",
        name: "Commonwealth Master’s and PhD Scholarships", provider: "Commonwealth Scholarship Commission in the UK",
        url: "https://cscuk.fcdo.gov.uk/scholarships/",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "Commonwealth PhD Scholarships"
    },
    {
        id: "imperial-scholarships", kind: "directory", country: "GB", fetch: "direct",
        name: "Imperial College London scholarships", institution: "Imperial College London",
        url: "https://www.imperial.ac.uk/study/fees-and-funding/scholarships-search/"
    },
    {
        id: "edinburgh-funding", kind: "directory", country: "GB", fetch: "direct",
        name: "University of Edinburgh scholarships and student funding", institution: "University of Edinburgh",
        url: "https://registryservices.ed.ac.uk/student-funding"
    },

    // ------------------------------------------------------ United States
    {
        id: "fulbright-foreign-student", kind: "programme", country: "US", fetch: "direct",
        name: "Fulbright Foreign Student Program", provider: "U.S. Department of State",
        url: "https://foreign.fulbrightonline.org/about/foreign-student-program",
        howToApply: { text: "Apply through the Fulbright Commission/Foundation or U.S. Embassy in your home country.", evidence: "you will apply to the Fulbright Commissions/Foundations or U.S. Embassy in your home country" }
    },
    {
        id: "knight-hennessy", kind: "programme", country: "US", fetch: "direct",
        name: "Knight-Hennessy Scholars", provider: "Stanford University", institution: "Stanford University",
        url: "https://knight-hennessy.stanford.edu/",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "enrolling in a graduate degree program at any of Stanford's seven schools"
    },
    {
        id: "harvard-college-aid", kind: "programme", country: "US", fetch: "direct",
        name: "Harvard College need-based financial aid", provider: "Harvard College", institution: "Harvard University",
        url: "https://college.harvard.edu/financial-aid",
        degreeLevels: ["bachelor"], degreeEvidence: "Financial Aid | Harvard College",
        nationality: { type: "any", evidence: "which apply to all students, regardless of country of residence or citizenship status" }
    },
    {
        id: "mit-scholarships", kind: "programme", country: "US", fetch: "direct",
        name: "MIT Scholarships (need-based)", provider: "MIT Student Financial Services", institution: "Massachusetts Institute of Technology",
        url: "https://sfs.mit.edu/undergraduate-students/types-of-aid/mit-scholarships-grants/",
        degreeLevels: ["bachelor"],
        degreeEvidence: "About 58% of our undergraduates receive MIT Scholarships."
    },
    {
        id: "yale-aid", kind: "directory", country: "US", fetch: "direct",
        name: "Yale undergraduate financial aid", institution: "Yale University",
        url: "https://finaid.yale.edu/"
    },

    // ---------------------------------------------------------- Australia
    {
        id: "australia-awards", kind: "programme", country: "AU", fetch: "direct",
        name: "Australia Awards Scholarships", provider: "Australian Government (DFAT)",
        url: "https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships",
        degreeLevels: ["bachelor", "master"],
        degreeEvidence: "to undertake full time undergraduate or postgraduate study at participating Australian universities"
    },
    {
        id: "melbourne-research", kind: "programme", country: "AU", fetch: "extract",
        name: "Melbourne Research Scholarship", provider: "University of Melbourne", institution: "University of Melbourne",
        url: "https://scholarships.unimelb.edu.au/awards/graduate-research-scholarships",
        degreeLevels: ["phd"],
        degreeEvidence: "who are enrolling in a graduate research degree at the University of Melbourne"
    },
    {
        id: "anu-chancellors", kind: "programme", country: "AU", fetch: "direct",
        name: "ANU Chancellor’s International Scholarship", provider: "Australian National University", institution: "Australian National University",
        url: "https://study.anu.edu.au/scholarships/find-scholarship/anu-chancellors-international-scholarship",
        degreeLevels: ["bachelor", "master"], degreeEvidence: "International undergraduate & postgraduate"
    },
    {
        id: "sydney-scholarships", kind: "directory", country: "AU", fetch: "direct",
        name: "University of Sydney scholarships", institution: "University of Sydney",
        url: "https://www.sydney.edu.au/scholarships/"
    },

    // ------------------------------------------------------------- Canada
    {
        id: "uoft-pearson", kind: "programme", country: "CA", fetch: "direct", timezone: "America/Toronto",
        name: "Lester B. Pearson International Student Scholarships", provider: "University of Toronto", institution: "University of Toronto",
        url: "https://future.utoronto.ca/pearson-scholarships",
        degreeLevels: ["bachelor"],
        degreeEvidence: "The scholarship is tenable only at the University of Toronto for first-entry, undergraduate programs.",
        funding: { text: "Tuition, books, incidental fees and full residence support for four years", evidence: "cover tuition, books, incidental fees and full residence support for four years" },
        knownDates: [{ deadlineDate: "2026-11-06", evidence: "The deadline to complete the Pearson International Scholarship application and submit all required documentation is November 6, 2026" }],
        cycle: { opensMonth: 7, cycleYear: 2026, evidence: "Schools that have previously participated will receive access to the nomination form beginning July 6, 2026" }
    },
    {
        id: "mcgill-entrance", kind: "programme", country: "CA", fetch: "direct",
        name: "McGill Major Entrance Scholarships", provider: "McGill University", institution: "McGill University",
        url: "https://www.mcgill.ca/studentaid/scholarships-aid/future-undergrads/entrance-scholarships",
        degreeLevels: ["bachelor"],
        degreeEvidence: "first-time university students entering a full-time undergraduate degree program",
        funding: { text: "$12,000–$48,000 ($3,000–$12,000 per year, renewable up to 4 years)", evidence: "Major Entrance Scholarships , valued between $12,000 and $48,000" },
        cycle: { opensMonth: 10, evidence: "Applications for Major Entrance Scholarships open October 1st on the Undergraduate Admissions Applicant Portal" }
    },
    {
        id: "waterloo-entrance", kind: "directory", country: "CA", fetch: "direct",
        name: "University of Waterloo entrance scholarships", institution: "University of Waterloo",
        url: "https://uwaterloo.ca/future-students/financing/scholarships"
    },
    {
        id: "ubc-international", kind: "directory", country: "CA", fetch: "direct",
        name: "UBC scholarships and awards for international students", institution: "University of British Columbia",
        url: "https://you.ubc.ca/financial-planning/scholarships-awards-international-students/"
    },
    {
        id: "educanada", kind: "directory", country: "CA", fetch: "direct",
        name: "Government of Canada scholarships for international students",
        url: "https://www.educanada.ca/scholarships-bourses/non_can/index.aspx?lang=eng"
    },

    // -------------------------------------------------------- South Korea
    {
        id: "gks-graduate", kind: "programme", country: "KR", fetch: "direct", timezone: "Asia/Seoul",
        name: "Global Korea Scholarship (GKS) for Graduate Degrees", provider: "Korean Government (NIIED)",
        url: "https://www.studyinkorea.go.kr/en/plan/scholarship.do",
        degreeLevels: ["master", "phd"], degreeEvidence: "Graduate Degrees (Master's and Doctoral Degrees)",
        cycle: { opensMonth: 2, evidence: "Application Period : February - March" }
    },
    {
        id: "gks-undergraduate", kind: "programme", country: "KR", fetch: "direct", timezone: "Asia/Seoul",
        name: "Global Korea Scholarship (GKS) for Undergraduate Degrees", provider: "Korean Government (NIIED)",
        url: "https://www.studyinkorea.go.kr/en/plan/scholarship.do",
        degreeLevels: ["bachelor"], degreeEvidence: "Undergraduate Degrees (including Associate Degree)"
    },
    {
        id: "korea-university-graduate", kind: "directory", country: "KR", fetch: "direct",
        name: "Korea University Graduate School scholarships", institution: "Korea University",
        url: "https://graduate2.korea.ac.kr/scholarship/gkscholarships.html"
    },

    // -------------------------------------------------------------- Japan
    {
        id: "mext", kind: "programme", country: "JP", fetch: "direct", timezone: "Asia/Tokyo",
        name: "Japanese Government (MEXT) Scholarship", provider: "Japanese Government (MEXT)",
        url: "https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm",
        howToApply: { text: "Selected on the recommendation of a Japanese Embassy/Consulate, a university or an authority.", evidence: "selected on the recommendation of Japanese Embassy/Consulate General, University, or Authority" }
    },
    {
        id: "jasso-honors", kind: "programme", country: "JP", fetch: "direct", timezone: "Asia/Tokyo",
        name: "Monbukagakusho Honors Scholarship for Privately-Financed International Students", provider: "JASSO (Japan Student Services Organization)",
        url: "https://www.jasso.go.jp/en/ryugaku/scholarship_j/shoreihi/about.html",
        degreeLevels: ["bachelor", "master"],
        degreeEvidence: "Graduate/undergraduate level : 48,000 yen per month",
        funding: { text: "48,000 yen per month", evidence: "Graduate/undergraduate level : 48,000 yen per month" },
        howToApply: { text: "Apply through your school in Japan; not every school can recommend students.", evidence: "Please note that depending on your educational institution, you may not be able to apply." }
    },
    {
        id: "kyoto-mext", kind: "directory", country: "JP", fetch: "direct",
        name: "Kyoto University: MEXT scholarship information", institution: "Kyoto University",
        url: "https://www.kyoto-u.ac.jp/en/education-campus/procedures/scholarships/mext"
    },
    {
        id: "utokyo-scholarships", kind: "directory", country: "JP", fetch: "direct",
        name: "University of Tokyo scholarships", institution: "University of Tokyo",
        url: "https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html"
    },
    {
        id: "study-in-japan", kind: "directory", country: "JP", fetch: "direct",
        name: "Study in Japan (JASSO) scholarships",
        url: "https://www.studyinjapan.go.jp/en/planning/scholarships/"
    },

    // ------------------------------------------------------------- France
    {
        id: "eiffel", kind: "programme", country: "FR", fetch: "direct", timezone: "Europe/Paris",
        name: "France Excellence Eiffel Scholarship Program", provider: "French Ministry for Europe and Foreign Affairs (Campus France)",
        url: "https://www.campusfrance.org/en/france-excellence-eiffel-scholarship-program",
        degreeLevels: ["master", "phd"],
        degreeEvidence: "to attract top foreign students to enroll in their masters and PhD programs",
        knownDates: [{ deadlineDate: "2027-01-06", evidence: "Deadline for the reception of applications by Campus France: January 6, 2027 included" }],
        cycle: { opensMonth: 10, cycleYear: 2026, evidence: "Opening of the call for applications: October 2026" }
    },
    {
        id: "sciencespo-boutmy", kind: "programme", country: "FR", fetch: "direct", timezone: "Europe/Paris",
        name: "Émile Boutmy Scholarship", provider: "Sciences Po", institution: "Sciences Po",
        url: "https://www.sciencespo.fr/students/en/fees-funding/bursaries-financial-aid/emile-boutmy-scholarship/",
        degreeLevels: ["bachelor", "master"], degreeEvidence: "Deadline for master programme",
        knownDates: [{ degree: "bachelor", deadlineDate: "2027-01-13", evidence: "Deadline for undergraduate programme (applicants from foreign secondary schools) : January 13, 2027" }]
    },
    {
        id: "paris-saclay-masters", kind: "programme", country: "FR", fetch: "direct", timezone: "Europe/Paris",
        name: "Université Paris-Saclay International Master’s Scholarships", provider: "Université Paris-Saclay", institution: "Université Paris-Saclay",
        url: "https://www.universite-paris-saclay.fr/en/admission/bourses-et-aides-financieres/international-masters-scholarships-program",
        degreeLevels: ["master"], degreeEvidence: "International Master's Scholarships Program",
        knownDates: [{ deadlineDate: "2026-03-31", evidence: "deadline to apply for the scholarship and for the reception of the recommendation form from the references (if applicable): Tuesday 31 March 2026" }],
        cycle: { closesMonth: 3, cycleYear: 2026, evidence: "deadline to apply for the scholarship and for the reception of the recommendation form from the references (if applicable): Tuesday 31 March 2026" }
    },

    // -------------------------------------------------------------- Italy
    {
        id: "invest-your-talent", kind: "programme", country: "IT", fetch: "direct",
        name: "Invest Your Talent in Italy", provider: "Italian Ministry of Foreign Affairs (MAECI)",
        url: "https://investyourtalentapplication.esteri.it/SitoIYT/EN/current-call",
        degreeLevels: ["master"],
        degreeEvidence: "the qualification valid for enrolment in the Master's Degree/University Master's program",
        funding: { text: "€10,800 per year", evidence: "The winner of an IYT scholarship will receive an annual scholarship of €10,800" }
    },
    {
        id: "padua-excellence", kind: "programme", country: "IT", fetch: "direct",
        name: "Padua International Excellence Scholarship", provider: "University of Padua", institution: "University of Padua",
        url: "https://www.unipd.it/en/borse-studio-agevolazioni-studenti-internazionali",
        degreeLevels: ["bachelor", "master"],
        degreeEvidence: "wishing to pursue a Bachelor's or Master's degree completely held in English"
    },
    {
        id: "polimi-scholarships", kind: "directory", country: "IT", fetch: "direct",
        name: "Politecnico di Milano scholarships", institution: "Politecnico di Milano",
        url: "https://www.polimi.it/en/prospective-students/how-much-does-it-cost/scholarships"
    },
    {
        id: "unibo-grants", kind: "directory", country: "IT", fetch: "direct",
        name: "University of Bologna study grants", institution: "University of Bologna",
        url: "https://www.unibo.it/en/study/study-grants-and-subsidies"
    },

    // ------------------------------------------------------------- Turkey
    {
        id: "turkiye-burslari", kind: "programme", country: "TR", fetch: "direct", timezone: "Europe/Istanbul",
        name: "Türkiye Scholarships (Türkiye Bursları)", provider: "Government of Türkiye (YTB)",
        url: "https://www.turkiyeburslari.gov.tr/",
        degreeLevels: ["bachelor", "master", "phd"],
        degreeEvidence: "Türkiye Scholarships are available for associate, bachelor's, master’s, PhD and research degrees in a range of subjects."
    },
    {
        id: "koc-scholarships", kind: "directory", country: "TR", fetch: "direct",
        name: "Koç University scholarships for international students", institution: "Koç University",
        url: "https://international.ku.edu.tr/scholarships/overview/"
    },
    {
        id: "sabanci-scholarships", kind: "directory", country: "TR", fetch: "direct",
        name: "Sabancı University scholarships for international students", institution: "Sabancı University",
        url: "https://iro.sabanciuniv.edu/en/scholarships"
    }
].map((entry) => ({ checkedOn: CHECKED, ...entry }));

export const SUPPORTED_COUNTRIES = ["DE", "GB", "US", "AU", "CA", "KR", "JP", "FR", "IT", "TR"];

// Domain -> source type for official sites that do not follow the
// government/academic domain patterns in sources.js.
export const REGISTRY_DOMAINS = {
    "boell.de": "official_program",
    "kas.de": "official_program",
    "tum.de": "university",
    "deutschlandstipendium.de": "government",
    "utoronto.ca": "university",
    "mcgill.ca": "university",
    "uwaterloo.ca": "university",
    "ubc.ca": "university",
    "educanada.ca": "government",
    "sciencespo.fr": "university",
    "universite-paris-saclay.fr": "university",
    "unipd.it": "university",
    "polimi.it": "university",
    "unibo.it": "university"
};

function matchesDegree(entry, degree) {
    return !degree || !entry.degreeLevels?.length || entry.degreeLevels.includes(degree);
}

// Official sources worth reading for a destination and degree. Programmes
// first, then university funding directories.
export function officialSourcesFor({ countryCodes, degree }) {
    const pool = countryCodes?.length
        ? OFFICIAL_SOURCES.filter((entry) => countryCodes.includes(entry.country))
        : OFFICIAL_SOURCES.filter((entry) => entry.kind === "programme");

    return pool
        .filter((entry) => matchesDegree(entry, degree))
        .sort((a, b) => Number(b.kind === "programme") - Number(a.kind === "programme"));
}
