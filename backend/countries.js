// Country, nationality and study-destination helpers.
//
// Country names come from the runtime's built-in ICU data (Intl.DisplayNames),
// so no country list has to be maintained by hand. The destination table below
// only describes *where to look* (search hints and official programme domains);
// it never contains scholarship records.

// Regions that are not countries, plus deprecated codes (East Germany, USSR,
// Yugoslavia, ...) that share a display name with a current country.
const NOT_COUNTRIES = new Set([
    "EU", "EZ", "UN", "QO", "XA", "XB", "ZZ", "AC", "CP", "DG", "EA", "IC", "TA",
    "AN", "BU", "CS", "DD", "DY", "FX", "HV", "NH", "RH", "SU", "TP", "UK", "VD", "YD", "YU", "ZR"
]);

// Extra names people commonly type, keyed by ISO code.
const EXTRA_ALIASES = {
    US: ["usa", "us", "u.s.", "u.s.a.", "america", "united states of america"],
    GB: ["uk", "u.k.", "britain", "great britain", "england", "scotland", "wales", "northern ireland"],
    KR: ["korea", "republic of korea", "s. korea"],
    TR: ["turkey", "turkiye"],
    CN: ["prc", "people's republic of china", "mainland china"],
    NL: ["holland", "the netherlands"],
    CZ: ["czech republic"],
    AE: ["uae"],
    RU: ["russian federation"],
    VN: ["viet nam"],
    IR: ["iran (islamic republic of)"],
    CD: ["drc", "dr congo", "democratic republic of congo"],
    CI: ["ivory coast", "cote d'ivoire"]
};

// Demonyms that cannot be derived from the country name by trimming a suffix.
const DEMONYMS = {
    american: "US", british: "GB", english: "GB", scottish: "GB", welsh: "GB",
    dutch: "NL", french: "FR", swiss: "CH", danish: "DK", swedish: "SE",
    finnish: "FI", norwegian: "NO", polish: "PL", spanish: "ES", irish: "IE",
    turkish: "TR", chinese: "CN", japanese: "JP", korean: "KR", "south korean": "KR",
    filipino: "PH", vietnamese: "VN", thai: "TH", bangladeshi: "BD", nepali: "NP",
    nepalese: "NP", lebanese: "LB", sudanese: "SD", senegalese: "SN", congolese: "CD",
    portuguese: "PT", greek: "GR", czech: "CZ", slovak: "SK", hungarian: "HU",
    emirati: "AE", saudi: "SA", kuwaiti: "KW", omani: "OM", qatari: "QA",
    yemeni: "YE", iraqi: "IQ", israeli: "IL", pakistani: "PK", afghan: "AF",
    malagasy: "MG", maltese: "MT", icelandic: "IS", cypriot: "CY", ivorian: "CI",
    malaysian: "MY", singaporean: "SG", indonesian: "ID", indian: "IN", sri_lankan: "LK",
    "sri lankan": "LK", kenyan: "KE", nigerian: "NG", ghanaian: "GH", ethiopian: "ET",
    egyptian: "EG", moroccan: "MA", algerian: "DZ", tunisian: "TN", ugandan: "UG",
    tanzanian: "TZ", rwandan: "RW", zimbabwean: "ZW", zambian: "ZM", cameroonian: "CM",
    mexican: "MX", brazilian: "BR", argentine: "AR", argentinian: "AR", chilean: "CL",
    colombian: "CO", peruvian: "PE", canadian: "CA", australian: "AU", "new zealander": "NZ",
    kiwi: "NZ", german: "DE", italian: "IT", austrian: "AT", belgian: "BE", russian: "RU",
    ukrainian: "UA", iranian: "IR", jordanian: "JO", syrian: "SY", palestinian: "PS",
    uzbek: "UZ", kazakh: "KZ", azerbaijani: "AZ", georgian: "GE", armenian: "AM",
    mongolian: "MN", burmese: "MM", cambodian: "KH", laotian: "LA", taiwanese: "TW"
};

function normalizeKey(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9.' ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

// code -> canonical English name, and lookup key -> code
const COUNTRY_NAMES = new Map();
const LOOKUP = new Map();

for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);

        if (NOT_COUNTRIES.has(code)) {
            continue;
        }

        let name;

        try {
            name = displayNames.of(code);
        } catch {
            continue;
        }

        if (!name || name === code || /unknown/i.test(name)) {
            continue;
        }

        COUNTRY_NAMES.set(code, name);

        for (const key of [normalizeKey(name), normalizeKey(name.replace(/&/g, "and"))]) {
            if (!LOOKUP.has(key)) {
                LOOKUP.set(key, code);
            }
        }
    }
}

for (const [code, aliases] of Object.entries(EXTRA_ALIASES)) {
    for (const alias of aliases) {
        LOOKUP.set(normalizeKey(alias), code);
    }
}

// Display names that differ from what people (and search engines) usually use.
const PREFERRED_NAMES = { TR: "Turkey" };

export function countryName(code) {
    return PREFERRED_NAMES[code] ?? COUNTRY_NAMES.get(code) ?? null;
}

// Returns the ISO code for a country name, alias or nationality (demonym), or null.
export function resolveCountry(value) {
    const key = normalizeKey(value).replace(/\.$/, "");

    if (!key) {
        return null;
    }

    if (LOOKUP.has(key)) {
        return LOOKUP.get(key);
    }

    if (DEMONYMS[key]) {
        return DEMONYMS[key];
    }

    // "the gambia" / "republic of x"
    const trimmed = key.replace(/^(the|republic of)\s+/, "");

    if (LOOKUP.has(trimmed)) {
        return LOOKUP.get(trimmed);
    }

    // Demonyms formed with a suffix: Kenyan -> Kenya, Brazilian -> Brazil.
    const stem = key.replace(/(ians|ian|ans|an|ese|ish|is|i|s)$/, "");

    if (stem.length >= 4) {
        for (const [code, name] of COUNTRY_NAMES) {
            const nameKey = normalizeKey(name);

            if (nameKey.startsWith(stem) && nameKey.length - stem.length <= 3 && !nameKey.includes(" ")) {
                return code;
            }
        }
    }

    return null;
}

export const EU_EEA = new Set([
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
    "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "IS", "LI", "NO"
]);

// Study destinations with search hints. `tavilyCountry` boosts results from that
// country in Tavily; `officialDomains` are official programme / government
// portals used for one targeted query and for source classification.
export const DESTINATIONS = {
    US: { region: "North America", tavilyCountry: "united states", officialDomains: ["educationusa.state.gov", "fulbrightonline.org", "studentaid.gov"] },
    CA: { region: "North America", tavilyCountry: "canada", officialDomains: ["educanada.ca", "scholarships.gc.ca", "canada.ca", "vanier.gc.ca"] },
    GB: { region: "Europe", tavilyCountry: "united kingdom", officialDomains: ["chevening.org", "cscuk.fcdo.gov.uk", "marshallscholarship.org", "gatescambridge.org", "study-uk.britishcouncil.org"] },
    DE: { region: "Europe", tavilyCountry: "germany", officialDomains: ["daad.de", "study-in-germany.de", "uni-assist.de"] },
    FR: { region: "Europe", tavilyCountry: "france", officialDomains: ["campusfrance.org", "france-education-international.fr"] },
    IT: { region: "Europe", tavilyCountry: "italy", officialDomains: ["studyinitaly.esteri.it", "esteri.it", "universitaly.it"] },
    AT: { region: "Europe", tavilyCountry: "austria", officialDomains: ["oead.at", "studyinaustria.at", "grants.at"] },
    CH: { region: "Europe", tavilyCountry: "switzerland", officialDomains: ["sbfi.admin.ch", "studyinswitzerland.plus", "swissuniversities.ch"] },
    DK: { region: "Europe", tavilyCountry: "denmark", officialDomains: ["studyindenmark.dk", "ufm.dk"] },
    NO: { region: "Europe", tavilyCountry: "norway", officialDomains: ["studyinnorway.no", "hkdir.no"] },
    SE: { region: "Europe", tavilyCountry: "sweden", officialDomains: ["si.se", "studyinsweden.se", "universityadmissions.se"] },
    FI: { region: "Europe", tavilyCountry: "finland", officialDomains: ["studyinfinland.fi", "oph.fi"] },
    NL: { region: "Europe", tavilyCountry: "netherlands", officialDomains: ["studyinnl.org", "nuffic.nl"] },
    BE: { region: "Europe", tavilyCountry: "belgium", officialDomains: ["studyinflanders.be", "wbi.be"] },
    IE: { region: "Europe", tavilyCountry: "ireland", officialDomains: ["educationinireland.com", "research.ie", "hea.ie"] },
    ES: { region: "Europe", tavilyCountry: "spain", officialDomains: ["exteriores.gob.es", "aecid.es"] },
    PT: { region: "Europe", tavilyCountry: "portugal", officialDomains: ["dges.gov.pt", "fct.pt"] },
    PL: { region: "Europe", tavilyCountry: "poland", officialDomains: ["nawa.gov.pl", "study.gov.pl"] },
    CZ: { region: "Europe", tavilyCountry: "czech republic", officialDomains: ["studyin.cz", "msmt.cz"] },
    HU: { region: "Europe", tavilyCountry: "hungary", officialDomains: ["stipendiumhungaricum.hu", "tempus.hu"] },
    TR: { region: "Europe and Asia", tavilyCountry: "turkey", officialDomains: ["turkiyeburslari.gov.tr", "yok.gov.tr"] },
    KR: { region: "Asia", tavilyCountry: "south korea", officialDomains: ["studyinkorea.go.kr", "niied.go.kr"] },
    JP: { region: "Asia", tavilyCountry: "japan", officialDomains: ["studyinjapan.go.jp", "jasso.go.jp", "mext.go.jp", "jasso.or.jp"] },
    CN: { region: "Asia", tavilyCountry: "china", officialDomains: ["campuschina.org", "csc.edu.cn"] },
    TW: { region: "Asia", tavilyCountry: "taiwan", officialDomains: ["studyintaiwan.org", "taiwanscholarship.moe.gov.tw"] },
    SG: { region: "Asia", tavilyCountry: "singapore", officialDomains: ["moe.gov.sg"] },
    MY: { region: "Asia", tavilyCountry: "malaysia", officialDomains: ["educationmalaysia.gov.my", "mohe.gov.my"] },
    AU: { region: "Oceania", tavilyCountry: "australia", officialDomains: ["studyaustralia.gov.au", "dfat.gov.au", "education.gov.au"] },
    NZ: { region: "Oceania", tavilyCountry: "new zealand", officialDomains: ["studywithnewzealand.govt.nz", "mfat.govt.nz", "education.govt.nz"] }
};

// Region keywords a student might type instead of a single country.
const REGIONS = {
    europe: { name: "Europe", codes: Object.keys(DESTINATIONS).filter((code) => DESTINATIONS[code].region === "Europe") },
    asia: { name: "Asia", codes: ["KR", "JP", "CN", "TW", "SG", "MY", "TR"] },
    "north america": { name: "North America", codes: ["US", "CA"] },
    oceania: { name: "Australia and New Zealand", codes: ["AU", "NZ"] },
    "australia and new zealand": { name: "Australia and New Zealand", codes: ["AU", "NZ"] },
    scandinavia: { name: "Scandinavia", codes: ["DK", "NO", "SE", "FI"] },
    nordic: { name: "the Nordic countries", codes: ["DK", "NO", "SE", "FI"] },
    "nordic countries": { name: "the Nordic countries", codes: ["DK", "NO", "SE", "FI"] }
};

// Interprets the student's destination text.
// Returns { kind: "country", code, name, ... } | { kind: "region", name, codes }
//       | { kind: "text", name } | null (no preference).
export function resolveDestination(value) {
    const key = normalizeKey(value);

    if (!key || ["any", "anywhere", "any country", "all", "none", "no preference", "abroad"].includes(key)) {
        return null;
    }

    if (REGIONS[key]) {
        return { kind: "region", ...REGIONS[key] };
    }

    const code = resolveCountry(value);

    if (code) {
        return {
            kind: "country",
            code,
            name: countryName(code),
            ...(DESTINATIONS[code] ?? { region: null, tavilyCountry: null, officialDomains: [] })
        };
    }

    return { kind: "text", name: String(value).trim().slice(0, 60) };
}

export function allOfficialProgrammeDomains() {
    return Object.values(DESTINATIONS).flatMap((destination) => destination.officialDomains);
}
