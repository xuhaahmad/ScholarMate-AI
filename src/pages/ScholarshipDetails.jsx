import { useLocation, useNavigate } from "react-router-dom";
import {
    MapPin,
    Wallet,
    Calendar,
    GraduationCap,
    Sparkles,
    ArrowLeft,
    ExternalLink,
    ShieldCheck,
    Clock
} from "lucide-react";
import {
    MATCH_TEXT,
    matchLevel,
    deadlineText,
    sourceText,
    officialLink,
    referenceLink,
    isSpecified,
    domainOf
} from "../utils/scholarshipDisplay";

const CHECK_ICONS = { met: "✓", not_met: "✗", unknown: "?" };

const CHECK_NAMES = {
    degree: "Degree level",
    nationality: "Nationality",
    grade: "Minimum grade",
    deadline: "Deadline",
    field: "Field of study",
    destination: "Destination",
    funding: "Funding preference"
};

const EVIDENCE_NAMES = {
    degree: "Degree level",
    fields: "Fields",
    nationality: "Nationality",
    grade: "Minimum grade",
    funding: "Funding",
    deadline: "Deadline",
    openingDate: "Opening date"
};

import { motion } from "framer-motion";


function ScholarshipDetails() {


    const location = useLocation();

    const navigate = useNavigate();

    const scholarship = location.state;



    if (!scholarship) {

        return (

            <div className="
            min-h-screen
            bg-background
            flex
            items-center
            justify-center
            px-6
            ">


                <div className="
                bg-white
                rounded-3xl
                p-10
                text-center
                shadow-xl
                ">


                    <h2 className="
                    text-2xl
                    font-bold
                    text-text
                    ">

                        Scholarship Not Found

                    </h2>


                    <button

                        onClick={() => navigate("/")}

                        className="
                        mt-6
                        bg-primary
                        text-white
                        px-6
                        py-3
                        rounded-xl
                        "

                    >

                        Go Home

                    </button>


                </div>


            </div>

        );

    }



    const level = matchLevel(scholarship);

    const official = officialLink(scholarship);

    const reference = referenceLink(scholarship);

    const checks = Array.isArray(scholarship.match?.checks) ? scholarship.match.checks : [];

    const evidence = Array.isArray(scholarship.evidence) ? scholarship.evidence : [];

    const institution = isSpecified(scholarship.university)
        ? scholarship.university
        : isSpecified(scholarship.provider) ? scholarship.provider : "Institution not specified";

    const retrieved = Date.parse(scholarship.retrievedAt)
        ? new Date(scholarship.retrievedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null;



    return (


        <div className="
        min-h-screen
        bg-background
        px-4
        sm:px-6
        py-10
        ">



            <button

                onClick={() => navigate(-1)}

                className="
                flex
                items-center
                gap-2
                text-muted
                hover:text-primary
                transition
                "

            >

                <ArrowLeft size={18}/>

                Back to Results

            </button>







            {/* Hero */}


            <motion.section

            initial={{
                opacity:0,
                y:-30
            }}

            animate={{
                opacity:1,
                y:0
            }}

            transition={{
                duration:0.6
            }}

            className="
            max-w-5xl
            mx-auto
            mt-8
            bg-primary
            text-white
            rounded-3xl
            p-6
            sm:p-10
            shadow-xl
            "

            >


                <div className="
                flex
                flex-col
                md:flex-row
                justify-between
                gap-8
                ">



                    <div>


                        <div className="
                        inline-flex
                        items-center
                        gap-2
                        bg-white/20
                        px-4
                        py-2
                        rounded-full
                        text-sm
                        ">


                            <Sparkles size={16}/>

                            {MATCH_TEXT[level].badge}


                        </div>





                        <h1 className="
                        text-3xl
                        sm:text-5xl
                        font-bold
                        mt-6
                        ">

                            {scholarship.name}

                        </h1>





                        <p className="
                        mt-4
                        text-white/80
                        flex
                        items-center
                        gap-2
                        ">


                            <GraduationCap size={18}/>

                            {institution}


                        </p>



                    </div>






                    <div className="
                    bg-white
                    text-primary
                    rounded-3xl
                    px-8
                    py-6
                    text-center
                    self-start
                    ">


                        <p className="
                        text-3xl
                        font-bold
                        ">

                            {MATCH_TEXT[level].short}

                        </p>


                        <p className="
                        text-sm
                        ">

                            Eligibility Check

                        </p>


                    </div>




                </div>


            </motion.section>









            <div className="
            max-w-5xl
            mx-auto
            grid
            md:grid-cols-3
            gap-8
            mt-10
            ">





                <div className="
                md:col-span-2
                space-y-8
                ">




                    <Section title="About Scholarship">


                        <p className="
                        text-muted
                        leading-relaxed
                        ">

                            {isSpecified(scholarship.description) ? scholarship.description : "No summary available."}

                        </p>


                        <p className="
                        text-muted
                        text-sm
                        mt-3
                        ">

                            AI-generated summary of the source page. Confirm all details on the official website.

                        </p>


                    </Section>








                    <Section title="Eligibility Check">


                        <p className="
                        text-muted
                        text-sm
                        mb-4
                        ">

                            {MATCH_TEXT[level].detail}

                        </p>


                        <ul className="
                        space-y-3
                        text-muted
                        ">


                            {checks.length > 0 ? (

                                checks.map(

                                    (item)=>(

                                        <li key={item.criterion}>

                                            {CHECK_ICONS[item.status] ?? "?"} {CHECK_NAMES[item.criterion] ?? item.criterion}: {item.detail}
                                            {item.status !== "unknown" && item.basis === "ai" ? " (based on AI reading, not confirmed)" : ""}

                                        </li>

                                    )

                                )

                            ) : (

                                (scholarship.reasons ?? []).map(

                                    (reason,index)=>(

                                        <li key={index}>

                                            ✓ {reason}

                                        </li>

                                    )

                                )

                            )}


                        </ul>


                    </Section>




                    {evidence.length > 0 && (

                        <Section title="Evidence From the Source">


                            <ul className="
                            space-y-3
                            text-muted
                            ">


                                {evidence.map(

                                    (item,index)=>(

                                        <li key={index}>

                                            <span className="font-semibold text-text">
                                                {EVIDENCE_NAMES[item.field] ?? item.field}:
                                            </span>
                                            {" "}“{item.quote}”

                                        </li>

                                    )

                                )}


                            </ul>


                        </Section>

                    )}



                </div>









                <motion.div

                initial={{
                    opacity:0,
                    x:30
                }}

                animate={{
                    opacity:1,
                    x:0
                }}

                transition={{
                    duration:0.6
                }}

                >


                    <div className="
                    bg-white
                    rounded-3xl
                    border
                    border-border
                    p-6
                    space-y-6
                    shadow-sm
                    ">


                        <Info
                        icon={<MapPin/>}
                        label="Country"
                        value={isSpecified(scholarship.country) ? scholarship.country : "Not specified"}
                        />


                        <Info
                        icon={<Wallet/>}
                        label="Funding"
                        value={isSpecified(scholarship.funding) ? scholarship.funding : "Not specified"}
                        />


                        <Info
                        icon={<Calendar/>}
                        label="Deadline"
                        value={deadlineText(scholarship)}
                        />


                        <Info
                        icon={<ShieldCheck/>}
                        label="Source"
                        value={sourceText(scholarship)}
                        />


                        {retrieved && (

                            <Info
                            icon={<Clock/>}
                            label="Information retrieved"
                            value={retrieved}
                            />

                        )}


                    </div>





                    {/* Only a verified official URL is opened; otherwise the button explains why it is unavailable. */}

                    {official ? (

                        <a

                        href={official.url}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="
                        w-full
                        mt-6
                        bg-primary
                        hover:bg-primaryDark
                        text-white
                        py-4
                        rounded-2xl
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition
                        hover:scale-[1.02]
                        "

                        >

                            Visit Official Website

                            <ExternalLink size={18}/>

                        </a>

                    ) : (

                        <button

                        type="button"

                        disabled

                        className="
                        w-full
                        mt-6
                        bg-primary
                        text-white
                        py-4
                        rounded-2xl
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition
                        opacity-60
                        cursor-not-allowed
                        "

                        >

                            Official Website Not Verified

                        </button>

                    )}




                    {official && (

                        <p className="
                        text-muted
                        text-sm
                        mt-3
                        text-center
                        ">

                            {official.isApplication ? "Application page" : "Official information page"} on {domainOf(official.url)}

                        </p>

                    )}




                    {reference && (

                        <p className="
                        text-muted
                        text-sm
                        mt-3
                        text-center
                        ">

                            We could not confirm an official link.{" "}

                            <a
                            href={reference.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                            >
                                View the source page ({reference.label}, {domainOf(reference.url)})
                            </a>

                        </p>

                    )}



                </motion.div>




            </div>


        </div>

    );

}








function Section({title,children}) {


    return (

        <div className="
        bg-white
        rounded-3xl
        border
        border-border
        p-6
        sm:p-8
        ">


            <h2 className="
            text-2xl
            font-bold
            text-text
            mb-4
            ">

                {title}

            </h2>


            {children}


        </div>

    );

}








function Info({icon,label,value}) {


    return (

        <div className="
        flex
        gap-4
        items-center
        ">


            <div className="
            text-primary
            ">

                {icon}

            </div>



            <div>

                <p className="
                text-sm
                text-muted
                ">

                    {label}

                </p>


                <p className="
                font-semibold
                text-text
                ">

                    {value}

                </p>


            </div>


        </div>

    );

}



export default ScholarshipDetails;