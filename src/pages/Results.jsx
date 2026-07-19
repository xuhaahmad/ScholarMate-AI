import { useLocation } from "react-router-dom";
import scholarships from "../data/scholarships";
import calculateMatch from "../utils/matcher";
import generateExplanation from "../utils/explanation";
import { useNavigate } from "react-router-dom";

function Results() {

    const location = useLocation();
    const navigate = useNavigate();
    const profile = location.state || {};


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


    return (

        <div className="min-h-screen bg-background px-5 py-10">


            <h1 className="text-4xl font-bold text-center text-primary">
                Your AI Scholarship Matches 🎓
            </h1>


            <p className="text-center text-muted mt-3">
                Based on your academic profile, here are your best opportunities.
            </p>



            <div className="max-w-3xl mx-auto mt-10 space-y-6">


                {
                    matchedScholarships.map((scholarship) => (

                        <div
                            key={scholarship.id}
                            className="bg-white p-8 rounded-3xl shadow"
                        >


                            <div className="flex justify-between items-start">


                                <div>

                                    {
                                        scholarship.score >= 80 && (

                                            <span className="text-sm bg-secondary px-3 py-1 rounded-full">

                                                ⭐ Best Match

                                            </span>

                                        )
                                    }


                                    <h2 className="text-2xl font-bold mt-3">

                                        {scholarship.name}

                                    </h2>


                                </div>



                                <div className="text-right">

                                    <span className="bg-secondary text-primary px-4 py-2 rounded-full font-bold">
                                        {scholarship.score}% Match
                                    </span>


                                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-3">

                                        <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{
                                                width: `${scholarship.score}%`
                                            }}
                                        ></div>

                                    </div>

                                </div>


                            </div>



                            <p className="mt-4 text-muted">

                                {scholarship.description}

                            </p>



                            <div className="flex flex-wrap gap-3 mt-4">


                                <span className="bg-gray-100 px-4 py-2 rounded-full text-sm">

                                    🌍 {scholarship.country}

                                </span>


                                <span className="bg-gray-100 px-4 py-2 rounded-full text-sm">

                                    💰 {scholarship.funding}

                                </span>


                                <span className="bg-gray-100 px-4 py-2 rounded-full text-sm">

                                    📅 {scholarship.deadline}

                                </span>


                            </div>



                            <p className="mt-4 font-medium">

                                🏫 {scholarship.university}

                            </p>



                            <h3 className="font-bold mt-5">

                                Why AI recommends this:

                            </h3>



                            <ul className="mt-3 space-y-2 text-gray-600">


                                {
                                    scholarship.reasons.map(
                                        (reason, index) => (

                                            <li key={index}>
                                                ✅ {reason}
                                            </li>

                                        )
                                    )
                                }


                            </ul>
                            <button

                                onClick={() =>
                                    navigate("/scholarship-details", {
                                        state: scholarship
                                    })
                                }

                                className="mt-6 bg-primary text-white px-6 py-3 rounded-xl"

                            >

                                View Details →

                            </button>


                        </div>

                    ))
                }


            </div>


        </div>

    );

}


export default Results;