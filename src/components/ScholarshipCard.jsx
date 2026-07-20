import { useNavigate } from "react-router-dom";
import {
    MapPin,
    GraduationCap,
    Wallet,
    Calendar,
    Sparkles
} from "lucide-react";


function ScholarshipCard({ scholarship }) {


    const navigate = useNavigate();



    return (

        <div className="
        bg-white
        rounded-3xl
        border
        border-border
        p-8
        shadow-sm
        hover:shadow-xl
        transition
        duration-300
        ">





            {/* Top Section */}

            <div className="
            flex
            justify-between
            items-start
            gap-6
            ">



                <div>


                    {
                        scholarship.score >= 80 && (

                            <span className="
                            inline-flex
                            items-center
                            gap-2
                            bg-secondary
                            text-primary
                            px-3
                            py-1
                            rounded-full
                            text-sm
                            font-medium
                            ">

                                ⭐ Best Match

                            </span>

                        )
                    }




                    <h2 className="
                    text-3xl
                    font-bold
                    text-text
                    mt-4
                    ">

                        {scholarship.name}

                    </h2>



                    <p className="
                    text-muted
                    mt-2
                    flex
                    items-center
                    gap-2
                    ">

                        <GraduationCap size={18}/>

                        {scholarship.university}

                    </p>



                </div>







                {/* Score */}


                <div className="
                bg-secondary
                text-primary
                rounded-2xl
                px-5
                py-4
                text-center
                ">


                    <p className="
                    text-3xl
                    font-bold
                    ">

                        {scholarship.score}%

                    </p>


                    <p className="
                    text-sm
                    ">

                        Match

                    </p>


                </div>



            </div>









            {/* Description */}


            <p className="
            mt-6
            text-muted
            leading-relaxed
            ">

                {scholarship.description}

            </p>








            {/* Info Tags */}


            <div className="
            flex
            flex-wrap
            gap-3
            mt-6
            ">



                <Tag
                icon={<MapPin size={16}/>}
                text={scholarship.country}
                />


                <Tag
                icon={<Wallet size={16}/>}
                text={scholarship.funding}
                />


                <Tag
                icon={<Calendar size={16}/>}
                text={scholarship.deadline}
                />


            </div>









            {/* AI Explanation */}


            <div className="
            mt-8
            bg-background
            rounded-2xl
            p-6
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


                    Why AI recommends this


                </div>






                <ul className="
                mt-4
                space-y-3
                text-muted
                ">


                    {
                        scholarship.reasons.map(

                            (reason,index)=>(

                                <li
                                key={index}
                                >

                                    ✓ {reason}

                                </li>

                            )

                        )
                    }


                </ul>


            </div>









            {/* Button */}


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
                mt-8
                w-full
                bg-primary
                hover:bg-primaryDark
                text-white
                py-4
                rounded-2xl
                font-semibold
                transition
                hover:scale-[1.02]
                "

            >

                View Full Details →

            </button>



        </div>

    );

}







function Tag({icon,text}) {


    return (

        <div className="
        flex
        items-center
        gap-2
        bg-secondary
        text-primary
        px-4
        py-2
        rounded-full
        text-sm
        ">

            {icon}

            {text}

        </div>

    );

}




export default ScholarshipCard;