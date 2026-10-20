import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import ScholarshipCard from "../components/ScholarshipCard";
import { countryOptions, filterScholarships, paginate } from "../utils/resultsView";
import { formatCgpa } from "../utils/scholarshipDisplay";

function Results() {

const location = useLocation();

const profile = location.state?.profile || {};

const aiScholarships = location.state?.scholarships || [];

const coverage = location.state?.coverage;

const [search, setSearch] = useState("");

const [country, setCountry] = useState("");

const [page, setPage] = useState(1);

// The backend returns scholarships already ranked, so their order is kept.
const matchedScholarships = aiScholarships.map(
    (scholarship, index) => ({

        ...scholarship,

        id: scholarship.id ?? `result-${index}`,

        reasons: scholarship.explanation
            ? [scholarship.explanation]
            : []

    })
);






    const countries = countryOptions(matchedScholarships);

    const filteredScholarships = filterScholarships(matchedScholarships, { search, country });

    const { items: pageItems, page: currentPage, pageCount } = paginate(filteredScholarships, page);



    function goToPage(nextPage) {

        setPage(nextPage);

        if (typeof window.scrollTo === "function") {
            try {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } catch {
                // Not supported in every environment.
            }
        }

    }






    return (


        <div className="
        min-h-screen
        bg-background
        px-4
        sm:px-6
        py-10
        sm:py-14
        ">





            {/* Header */}



            <section className="
            bg-primary
            text-white
            rounded-3xl
            max-w-5xl
            mx-auto
            p-6
            sm:p-10
            text-center
            shadow-lg
            ">



                <div className="
                flex
                justify-center
                ">


                    <div className="
                    bg-white/20
                    p-3
                    sm:p-4
                    rounded-2xl
                    ">


                        <Sparkles 
                        size={28}
                        className="sm:w-8 sm:h-8"
                        />


                    </div>


                </div>






                <h1 className="
                text-3xl
                sm:text-4xl
                md:text-5xl
                font-bold
                mt-6
                ">


                    Your AI Scholarship Matches 


                </h1>






                <p className="
                mt-4
                text-white/80
                max-w-xl
                mx-auto
                text-sm
                sm:text-base
                ">


                    ScholarMate AI analyzed your profile and found
                    scholarships that match your goals.


                </p>



            </section>









            {/* Profile Summary */}




            <div className="
            max-w-4xl
            mx-auto
            mt-8
            sm:mt-10
            bg-white
            rounded-3xl
            border
            border-border
            p-6
            sm:p-8
            shadow-sm
            ">



                <h2 className="
                text-lg
                sm:text-xl
                font-semibold
                text-text
                ">


                    Your Profile


                </h2>






                <div className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-5
                mt-6
                ">



                    <ProfileItem

                    label="Name"

                    value={profile.name || "Student"}

                    />



                    <ProfileItem

                    label="Field"

                    value={profile.field ? `${profile.field}${profile.degree ? ` (${profile.degree})` : ""}` : "Not specified"}

                    />



                    <ProfileItem

                    label="CGPA"

                    value={formatCgpa(profile)}

                    />



                    <ProfileItem

                    label="Country"

                    value={profile.country || "Any"}

                    />


                </div>



            </div>









            {/* Search */}



<div className="
max-w-2xl
mx-auto
mt-10
relative
">


    <Search

        className="
        absolute
        left-4
        top-1/2
        -translate-y-1/2
        text-muted
        "

        size={20}

    />


    <input

        type="text"

        placeholder="Search scholarships..."

        value={search}

        onChange={(e)=>{ setSearch(e.target.value); setPage(1); }}

        aria-label="Search scholarships"

        className="
        w-full
        bg-white
        border
        border-border
        p-4
        pl-14
        rounded-2xl
        focus:outline-none
        focus:ring-2
        focus:ring-primary
        transition
        "

    />


</div>




{/* Country filter (only when results come from several countries) */}

{countries.length > 1 && (

    <div className="
    max-w-2xl
    mx-auto
    mt-4
    ">

        <select

            value={country}

            onChange={(e)=>{ setCountry(e.target.value); setPage(1); }}

            aria-label="Filter by country"

            className="
            w-full
            bg-white
            border
            border-border
            p-4
            rounded-2xl
            focus:outline-none
            focus:ring-2
            focus:ring-primary
            transition
            "

        >

            <option value="">All countries</option>

            {countries.map((name) => (

                <option key={name} value={name}>
                    {name}
                </option>

            ))}

        </select>

    </div>

)}




{/* Search coverage: always honest about what was and was not searched */}

{coverage && (

    <div className="
    max-w-4xl
    mx-auto
    mt-6
    text-center
    text-muted
    text-sm
    space-y-1
    ">

        <p>
            Found {aiScholarships.length} scholarship{aiScholarships.length === 1 ? "" : "s"} from{" "}
            {coverage.sourcesAnalyzed} analyzed source{coverage.sourcesAnalyzed === 1 ? "" : "s"}
            {coverage.officialSourcesAnalyzed > 0 ? ` (${coverage.officialSourcesAnalyzed} official)` : ""}.
        </p>

        {(coverage.notes ?? []).map((note) => (

            <p key={note}>
                {note}
            </p>

        ))}

    </div>

)}








            {/* Scholarships */}





            <div className="
            max-w-4xl
            mx-auto
            mt-10
            sm:mt-12
            space-y-6
            sm:space-y-8
            ">



                {


                filteredScholarships.length > 0 ?


                pageItems.map(


                    (scholarship)=>(


                        <ScholarshipCard


                        key={scholarship.id}


                        scholarship={scholarship}


                        />


                    )


                )


                :



                (


                    <div className="
                    bg-white
                    rounded-3xl
                    border
                    border-border
                    p-8
                    sm:p-10
                    text-center
                    ">



                        <div className="text-5xl">

                            🔍

                        </div>





                        <h2 className="
                        text-xl
                        sm:text-2xl
                        font-bold
                        mt-4
                        text-text
                        ">


                            No Scholarships Found


                        </h2>






                        <p className="
                        text-muted
                        mt-3
                        ">


                            {aiScholarships.length > 0
                                ? "Try another search or country."
                                : "We could not find scholarships for this profile in the sources we searched. Try a broader field of study or a different destination."}


                        </p>




                    </div>


                )


                }



            </div>




            {/* Pagination */}

            {pageCount > 1 && (

                <div className="
                max-w-4xl
                mx-auto
                mt-10
                flex
                items-center
                justify-center
                gap-4
                ">

                    <button

                        type="button"

                        onClick={() => goToPage(currentPage - 1)}

                        disabled={currentPage === 1}

                        className="
                        bg-white
                        border
                        border-border
                        text-primary
                        px-5
                        py-3
                        rounded-2xl
                        font-semibold
                        hover:bg-secondary
                        transition
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        "

                    >

                        ← Previous

                    </button>


                    <p className="
                    text-muted
                    text-sm
                    ">

                        Page {currentPage} of {pageCount}

                    </p>


                    <button

                        type="button"

                        onClick={() => goToPage(currentPage + 1)}

                        disabled={currentPage === pageCount}

                        className="
                        bg-white
                        border
                        border-border
                        text-primary
                        px-5
                        py-3
                        rounded-2xl
                        font-semibold
                        hover:bg-secondary
                        transition
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        "

                    >

                        Next →

                    </button>

                </div>

            )}





        </div>


    );

}







function ProfileItem({label,value}) {


    return (


        <div>


            <p className="
            text-xs
            sm:text-sm
            text-muted
            ">

                {label}

            </p>




            <p className="
            font-semibold
            text-text
            mt-1
            text-sm
            sm:text-base
            ">


                {value}


            </p>



        </div>


    );


}





export default Results;