import { useLocation, useNavigate } from "react-router-dom";


function ScholarshipDetails() {

    const location = useLocation();
    const navigate = useNavigate();

    const scholarship = location.state;


    if (!scholarship) {

        return (

            <div className="min-h-screen bg-background flex items-center justify-center">

                <h1 className="text-3xl font-bold text-text">
                    Scholarship not found
                </h1>

            </div>

        );

    }



    return (

        <div className="min-h-screen bg-background px-6 py-12">


            <div className="max-w-4xl mx-auto">


                {/* Back Button */}

                <button

                    onClick={() => navigate(-1)}

                    className="
                    text-primary
                    font-medium
                    mb-8
                    "

                >

                    ← Back to Results

                </button>




                {/* Main Card */}

                <div className="
                bg-white
                rounded-3xl
                shadow-xl
                p-10
                ">


                    <div className="flex justify-between items-start">


                        <div>


                            <span className="
                            bg-secondary
                            text-primary
                            px-4
                            py-2
                            rounded-full
                            text-sm
                            ">

                                🎓 Scholarship Opportunity

                            </span>



                            <h1 className="
                            text-5xl
                            font-bold
                            text-text
                            mt-6
                            ">

                                {scholarship.name}

                            </h1>


                        </div>




                        <div className="
                        bg-primary
                        text-white
                        px-6
                        py-4
                        rounded-2xl
                        text-center
                        ">


                            <p className="text-3xl font-bold">

                                {scholarship.score}%

                            </p>


                            <p>
                                Match
                            </p>


                        </div>


                    </div>





                    <p className="
                    mt-8
                    text-lg
                    text-muted
                    ">

                        {scholarship.description}

                    </p>





                    {/* Details */}

                    <div className="
                    grid
                    md:grid-cols-2
                    gap-5
                    mt-8
                    ">


                        <div className="bg-secondary p-5 rounded-2xl">

                            🌍

                            <p className="font-bold mt-2">
                                Country
                            </p>

                            <p>
                                {scholarship.country}
                            </p>

                        </div>




                        <div className="bg-secondary p-5 rounded-2xl">

                            🏫

                            <p className="font-bold mt-2">
                                University
                            </p>

                            <p>
                                {scholarship.university}
                            </p>

                        </div>




                        <div className="bg-secondary p-5 rounded-2xl">

                            💰

                            <p className="font-bold mt-2">
                                Funding
                            </p>

                            <p>
                                {scholarship.funding}
                            </p>

                        </div>




                        <div className="bg-secondary p-5 rounded-2xl">

                            📅

                            <p className="font-bold mt-2">
                                Deadline
                            </p>

                            <p>
                                {scholarship.deadline}
                            </p>

                        </div>


                    </div>





                    {/* AI Section */}

                    <div className="mt-10">


                        <h2 className="
                        text-2xl
                        font-bold
                        text-text
                        ">

                            🤖 Why ScholarMate AI recommends this

                        </h2>



                        <ul className="mt-5 space-y-3 text-muted">


                            {
                                scholarship.reasons.map(

                                    (reason,index)=>(

                                        <li key={index}>

                                            ✅ {reason}

                                        </li>

                                    )

                                )
                            }


                        </ul>


                    </div>





                    <button

                        className="
                        mt-10
                        w-full
                        bg-primary
                        hover:bg-primaryDark
                        text-white
                        py-4
                        rounded-2xl
                        font-semibold
                        text-lg
                        transition
                        "

                    >

                        Visit Official Scholarship Website 🌐

                    </button>



                </div>


            </div>


        </div>

    );

}


export default ScholarshipDetails;