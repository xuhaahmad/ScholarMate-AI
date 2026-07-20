import { useState } from "react";
import { useLocation } from "react-router-dom";

import scholarships from "../data/scholarships";
import calculateMatch from "../utils/matcher";
import generateExplanation from "../utils/explanation";
import ScholarshipCard from "../components/ScholarshipCard";


function Results() {

    const location = useLocation();

    const profile = location.state || {};

    const [search, setSearch] = useState("");



    const matchedScholarships = scholarships.map(
        (scholarship) => {

            return {

                ...scholarship,

                score: calculateMatch(
                    profile,
                    scholarship
                ),

                reasons: generateExplanation(
                    profile,
                    scholarship
                )

            };

        }
    );



    matchedScholarships.sort(
        (a, b) => b.score - a.score
    );



    const filteredScholarships = matchedScholarships.filter(
        (scholarship) => {

            return (

                scholarship.name
                    .toLowerCase()
                    .includes(search.toLowerCase())

                ||

                scholarship.country
                    .toLowerCase()
                    .includes(search.toLowerCase())

                ||

                scholarship.university
                    .toLowerCase()
                    .includes(search.toLowerCase())

            );

        }
    );



    return (

        <div className="
min-h-screen
bg-background
px-6
py-14
">


            {/* Header */}

            <div className="text-center">

                <h1 className="
text-4xl
md:text-5xl
font-bold
text-center
text-text
">
                    Your Scholarship Matches 🎓
                </h1>



                <p className="
text-center
text-muted
mt-4
max-w-xl
mx-auto
">
                    ScholarMate AI analyzed your profile and found opportunities
                    that match your academic goals.
                </p>


            </div>


            {/* Profile Summary */}

            <div className="
            max-w-4xl
            mx-auto
            mt-10
            bg-white
            border
            border-secondary
            rounded-3xl
            p-8
            ">


                <h2 className="
                text-xl
                font-semibold
                text-text
                ">

                    Your Profile

                </h2>



                <div className="
                grid
                md:grid-cols-4
                gap-6
                mt-6
                ">


                    <div>

                        <p className="text-sm text-muted">
                            Name
                        </p>

                        <p className="font-medium text-text mt-1">
                            {profile.name || "Student"}
                        </p>

                    </div>




                    <div>

                        <p className="text-sm text-muted">
                            Field
                        </p>

                        <p className="font-medium text-text mt-1">
                            {profile.field || "Not specified"}
                        </p>

                    </div>




                    <div>

                        <p className="text-sm text-muted">
                            CGPA
                        </p>

                        <p className="font-medium text-text mt-1">
                            {profile.cgpa || "N/A"}
                        </p>

                    </div>




                    <div>

                        <p className="text-sm text-muted">
                            Preferred Country
                        </p>

                        <p className="font-medium text-text mt-1">
                            {profile.country || "Any"}
                        </p>

                    </div>



                </div>


            </div>

            {/* Search */}

            <div className="
max-w-2xl
mx-auto
mt-10
">


                <input

                    type="text"

                    placeholder="🔍 Search scholarships..."

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                    className="
                    w-full
                    bg-white
                    border
                    border-secondary
                    p-4
                    rounded-2xl
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary
                    transition
                    "

                />


            </div>





            {/* Scholarship Cards */}
            <div className="
max-w-4xl
mx-auto
mt-12
space-y-8
">


                {
                    filteredScholarships.length > 0 ? (

                        filteredScholarships.map(
                            (scholarship) => (

                                <ScholarshipCard

                                    key={scholarship.id}

                                    scholarship={scholarship}

                                />

                            )
                        )

                    ) : (

                        <div className="
            bg-white
            border
            border-secondary
            rounded-3xl
            p-10
            text-center
            ">


                            <div className="text-5xl">

                                🔍

                            </div>


                            <h2 className="
                text-2xl
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

                                Try searching with another country,
                                university, or scholarship name.

                            </p>


                        </div>

                    )
                }


            </div>



        </div>

    );

}


export default Results;