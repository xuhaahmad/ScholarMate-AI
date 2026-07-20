import { useNavigate } from "react-router-dom";
import Badge from "./Badge";


function ScholarshipCard({ scholarship }) {


    const navigate = useNavigate();



    return (

        <div className="
        bg-white
        border
        border-secondary
        p-7
        rounded-3xl
        shadow-sm
        hover:shadow-xl
        transition-all
        duration-300
        ">



            {/* Header */}

            <div className="
            flex
            justify-between
            items-start
            gap-4
            ">


                <div>


                    {
                        scholarship.score >= 80 && (

                            <Badge>

                                ⭐ Best Match

                            </Badge>

                        )
                    }



                    <h2 className="
                    text-2xl
                    font-bold
                    text-text
                    mt-4
                    ">

                        {scholarship.name}

                    </h2>


                </div>





                <div className="
                bg-secondary
                text-primary
                px-4
                py-2
                rounded-2xl
                font-bold
                whitespace-nowrap
                ">

                    {scholarship.score}% Match

                </div>


            </div>





            {/* Description */}

            <p className="
            mt-5
            text-muted
            leading-relaxed
            ">

                {scholarship.description}

            </p>





            {/* Main Details */}

            <div className="
            flex
            flex-wrap
            gap-3
            mt-5
            ">


                <Badge>

                    🌍 {scholarship.country}

                </Badge>



                <Badge>

                    💰 {scholarship.funding}

                </Badge>


            </div>





            {/* Extra Info */}

            <div className="
            mt-5
            text-sm
            text-muted
            space-y-1
            ">


                <p>

                    🏫 {scholarship.university}

                </p>


                <p>

                    📅 Deadline: {scholarship.deadline}

                </p>


            </div>






            {/* AI Insight */}

            <div className="
            mt-6
            bg-background
            p-4
            rounded-2xl
            ">


                <h3 className="
                font-semibold
                text-text
                ">

                    ✨ AI Insight

                </h3>



                <p className="
                mt-2
                text-sm
                text-muted
                ">

                    {scholarship.reasons[0]}

                </p>


            </div>





            {/* Compatibility Bar */}

            <div className="mt-6">


                <div className="
                flex
                justify-between
                text-sm
                mb-2
                ">


                    <span className="text-muted">

                        Compatibility

                    </span>


                    <span className="font-medium text-primary">

                        {scholarship.score}%

                    </span>


                </div>



                <div className="
                w-full
                bg-gray-200
                rounded-full
                h-2
                ">


                    <div

                        className="
                        bg-primary
                        h-2
                        rounded-full
                        "

                        style={{
                            width:`${scholarship.score}%`
                        }}

                    ></div>


                </div>


            </div>






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
                mt-7
                w-full
                bg-primary
                hover:bg-primaryDark
                hover:scale-[1.02]
                text-white
                py-3
                rounded-2xl
                font-semibold
                transition
                shadow-md
                "

            >

                View Full Details →

            </button>



        </div>

    );

}


export default ScholarshipCard;