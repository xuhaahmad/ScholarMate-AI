import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";

import scholarships from "../data/scholarships";
import calculateMatch from "../utils/matcher";
import generateExplanation from "../utils/explanation";
import ScholarshipCard from "../components/ScholarshipCard";


function Results() {


    const location = useLocation();

    const profile = location.state || {};

    const [search, setSearch] = useState("");



    const matchedScholarships = scholarships.map(
        (scholarship) => ({

            ...scholarship,

            score: calculateMatch(
                profile,
                scholarship
            ),

            reasons: generateExplanation(
                profile,
                scholarship
            )

        })
    );



    matchedScholarships.sort(
        (a,b) => b.score - a.score
    );



    const filteredScholarships = matchedScholarships.filter(
        (scholarship) =>

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




    return (

        <div className="
        min-h-screen
        bg-background
        px-6
        py-14
        ">



            {/* Header */}

            <section className="
            bg-primary
            text-white
            rounded-3xl
            max-w-5xl
            mx-auto
            p-10
            text-center
            shadow-lg
            ">


                <div className="
                flex
                justify-center
                ">

                    <div className="
                    bg-white/20
                    p-4
                    rounded-2xl
                    ">

                        <Sparkles size={32}/>

                    </div>

                </div>



                <h1 className="
                text-4xl
                md:text-5xl
                font-bold
                mt-6
                ">

                    Your AI Scholarship Matches 🎓

                </h1>



                <p className="
                mt-4
                text-white/80
                max-w-xl
                mx-auto
                ">

                    ScholarMate AI analyzed your profile and found
                    scholarships that match your goals.

                </p>


            </section>







            {/* Profile Summary */}


            <div className="
            max-w-4xl
            mx-auto
            mt-10
            bg-white
            rounded-3xl
            border
            border-border
            p-8
            shadow-sm
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


                    <ProfileItem
                    label="Name"
                    value={profile.name || "Student"}
                    />

                    <ProfileItem
                    label="Field"
                    value={profile.field || "Not specified"}
                    />

                    <ProfileItem
                    label="CGPA"
                    value={profile.cgpa || "N/A"}
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
                    top-4
                    text-muted
                    "

                    size={20}

                />


                <input

                    type="text"

                    placeholder="Search scholarships..."

                    value={search}

                    onChange={(e)=>setSearch(e.target.value)}

                    className="
                    w-full
                    bg-white
                    border
                    border-border
                    p-4
                    pl-12
                    rounded-2xl
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary
                    "

                />


            </div>








            {/* Scholarships */}


            <div className="
            max-w-4xl
            mx-auto
            mt-12
            space-y-8
            ">


                {
                    filteredScholarships.length > 0 ?


                    filteredScholarships.map(

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

                                Try another search.

                            </p>


                        </div>

                    )

                }


            </div>


        </div>

    );

}





function ProfileItem({label,value}) {


    return (

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
            mt-1
            ">
                {value}
            </p>


        </div>

    );

}




export default Results;