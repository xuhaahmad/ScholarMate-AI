import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    Wallet,
    Calendar,
    Sparkles,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    XCircle,
    ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import {
    MATCH_TEXT,
    matchLevel,
    deadlineText,
    sourceText,
    officialLink,
    referenceLink,
    isSpecified
} from "../utils/scholarshipDisplay";


function ScholarshipCard({ scholarship }) {

    const navigate = useNavigate();

    const level = matchLevel(scholarship);
    const isMatch = level === "verified";
    const isUnclear = level === "preliminary";
    const isNotEligible = level === "not_eligible";

    const official = officialLink(scholarship);
    const reference = referenceLink(scholarship);


    return (

        <motion.div

            initial={{
                opacity: 0,
                y: 40
            }}

            whileInView={{
                opacity: 1,
                y: 0
            }}

            viewport={{
                once: true
            }}

            transition={{
                duration: 0.5
            }}

            whileHover={{
                y: -6
            }}

            className="
            bg-white
            rounded-3xl
            border
            border-border
            p-5
            sm:p-8
            shadow-sm
            hover:shadow-xl
            transition-all
            duration-300
            "

        >


            {/* Header */}

            <div className="
            flex
            flex-col
            sm:flex-row
            justify-between
            gap-5
            ">


                <div className="flex-1">


                    {isMatch && (

                        <span className="
                        inline-flex
                        items-center
                        gap-2
                        bg-secondary
                        text-primary
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        sm:text-sm
                        font-medium
                        ">

                            <CheckCircle size={15} />

                            {MATCH_TEXT.verified.badge}

                        </span>

                    )}


                    {isUnclear && (

                        <span className="
                        inline-flex
                        items-center
                        gap-2
                        bg-yellow-100
                        text-yellow-700
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        sm:text-sm
                        font-medium
                        ">

                            <AlertCircle size={15} />

                            {MATCH_TEXT.preliminary.badge}

                        </span>

                    )}


                    {isNotEligible && (

                        <span className="
                        inline-flex
                        items-center
                        gap-2
                        bg-gray-100
                        text-gray-600
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        sm:text-sm
                        font-medium
                        ">

                            <XCircle size={15} />

                            {MATCH_TEXT.not_eligible.badge}

                        </span>

                    )}


                    <h2 className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-text
                    mt-4
                    break-words
                    ">

                        {scholarship.name}

                    </h2>


                    <p className="
                    flex
                    items-center
                    gap-2
                    text-muted
                    mt-2
                    text-sm
                    sm:text-base
                    ">

                        <GraduationCap size={18} />

                        {isSpecified(scholarship.degreeLevel) ? scholarship.degreeLevel : "Degree not specified"}

                    </p>


                </div>


                {/* Match Status */}

                <div className="
                bg-secondary
                text-primary
                rounded-2xl
                px-5
                py-3
                text-center
                self-start
                w-full
                sm:w-auto
                ">


                    <p className="
                    text-lg
                    sm:text-xl
                    font-bold
                    ">

                        {MATCH_TEXT[level].short}

                    </p>


                    <p className="text-sm">

                        Eligibility Check

                    </p>


                </div>


            </div>


            {/* Scholarship Information */}

            <div className="
            flex
            flex-wrap
            gap-2
            mt-6
            ">


                <Tag
                    icon={<Wallet size={15} />}
                    text={isSpecified(scholarship.funding) ? scholarship.funding : "Funding not specified"}
                />


                <Tag
                    icon={<Calendar size={15} />}
                    text={deadlineText(scholarship)}
                />


                <Tag
                    icon={<ShieldCheck size={15} />}
                    text={sourceText(scholarship)}
                />


            </div>


            {/* Eligibility */}

            <div className="
            mt-6
            bg-background
            rounded-2xl
            p-5
            ">


                <h3 className="
                font-semibold
                text-text
                flex
                items-center
                gap-2
                ">

                    <GraduationCap
                        size={20}
                        className="text-primary"
                    />

                    Eligibility

                </h3>


                <ul className="
                mt-4
                space-y-2
                text-muted
                text-sm
                ">


                    {scholarship.eligibility?.length > 0 ? (

                        scholarship.eligibility.map(
                            (requirement, index) => (

                                <li key={index}>

                                    ✓ {requirement}

                                </li>

                            )
                        )

                    ) : (

                        <li>

                            No requirements could be confirmed from the source page.

                        </li>

                    )}


                </ul>


            </div>


            {/* AI Explanation */}

            <div className="
            mt-6
            bg-background
            rounded-2xl
            p-5
            ">


                <div className="
                flex
                items-center
                gap-2
                font-semibold
                text-text
                ">


                    <Sparkles
                        size={20}
                        className="text-primary"
                    />


                    AI's preliminary view


                </div>


                <p className="
                mt-4
                text-muted
                text-sm
                leading-relaxed
                ">

                    {isSpecified(scholarship.explanation) ? scholarship.explanation : "No explanation available."}

                </p>


            </div>


            {/* Application Link */}

            {(official || reference) && (

                <a

                    href={official ? official.url : reference.url}

                    target="_blank"

                    rel="noopener noreferrer"

                    className="
                    mt-6
                    flex
                    items-center
                    justify-center
                    gap-2
                    w-full
                    border
                    border-primary
                    text-primary
                    py-3
                    rounded-2xl
                    font-semibold
                    hover:bg-secondary
                    transition
                    "

                >

                    {official
                        ? official.isApplication ? "Apply on Official Website" : "Official Information Page"
                        : `View Source (${reference.label})`}

                    <ExternalLink size={17} />

                </a>

            )}


            {/* Details Button */}

            <button

                onClick={() =>
                    navigate(
                        "/scholarship-details",
                        {
                            state: scholarship
                        }
                    )
                }

                className="
                mt-4
                w-full
                bg-primary
                hover:bg-primaryDark
                text-white
                py-4
                rounded-2xl
                font-semibold
                transition-all
                hover:scale-[1.02]
                "

            >

                View Full Details →

            </button>


        </motion.div>

    );

}


function Tag({ icon, text }) {

    return (

        <div className="
        flex
        items-center
        gap-2
        bg-secondary
        text-primary
        px-3
        py-2
        rounded-full
        text-xs
        sm:text-sm
        ">

            {icon}

            <span>
                {text}
            </span>

        </div>

    );

}


export default ScholarshipCard;