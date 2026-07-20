import { useNavigate } from "react-router-dom";
import Badge from "./Badge";


function ScholarshipCard({ scholarship }) {


    const navigate = useNavigate();



    return (

        <div className="
        bg-white
        p-8
        rounded-3xl
        shadow-lg
        hover:shadow-xl
        transition
        ">


            {
                scholarship.score >= 80 && (

                    <Badge>
                        ⭐ Best Match
                    </Badge>

                )
            }



            <h2 className="
            text-3xl
            font-bold
            mt-5
            ">

                {scholarship.name}

            </h2>




            <p className="mt-4 text-muted">

                {scholarship.description}

            </p>




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


                <Badge>
                    📅 {scholarship.deadline}
                </Badge>


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
                mt-6
                bg-primary
                text-white
                px-6
                py-3
                rounded-xl
                "

            >

                View Details →

            </button>



        </div>

    );

}


export default ScholarshipCard;