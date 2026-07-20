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

        <div className="min-h-screen bg-background px-6 py-12">


            {/* Header */}

            <div className="text-center">


                <h1 className="text-5xl font-bold text-primary">

                    Your AI Scholarship Matches 🎓

                </h1>



                <p className="text-muted mt-4 text-lg">

                    Based on your academic profile, here are your best opportunities.

                </p>


            </div>




            {/* Search */}

            <div className="max-w-3xl mx-auto mt-10">


                <input

                    type="text"

                    placeholder="🔍 Search scholarships..."

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                    className="
                    w-full
                    p-4
                    rounded-2xl
                    border
                    bg-white
                    shadow
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary
                    "

                />


            </div>





            {/* Scholarship Cards */}

<div className="max-w-3xl mx-auto mt-10 space-y-6">


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
            rounded-3xl
            shadow
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