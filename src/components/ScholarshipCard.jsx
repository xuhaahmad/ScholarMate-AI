import { useNavigate } from "react-router-dom";
import {
    MapPin,
    GraduationCap,
    Wallet,
    Calendar,
    Sparkles
} from "lucide-react";
import { motion } from "framer-motion";


function ScholarshipCard({ scholarship }) {


    const navigate = useNavigate();


    return (


        <motion.div


            initial={{
                opacity:0,
                y:40
            }}


            whileInView={{
                opacity:1,
                y:0
            }}


            viewport={{
                once:true
            }}


            transition={{
                duration:0.5
            }}


            whileHover={{
                y:-6
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
                            text-xs
                            sm:text-sm
                            font-medium
                            ">

                                ⭐ Best Match

                            </span>

                        )
                    }



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

                        <GraduationCap size={18}/>

                        {scholarship.university}

                    </p>


                </div>





                {/* Match Score */}


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
                    text-2xl
                    sm:text-3xl
                    font-bold
                    ">

                        {scholarship.score}%

                    </p>


                    <p className="text-sm">

                        Match

                    </p>


                </div>


            </div>







            {/* Description */}


            <p className="
            mt-5
            text-muted
            leading-relaxed
            text-sm
            sm:text-base
            ">

                {scholarship.description}

            </p>








            {/* Tags */}


            <div className="
            flex
            flex-wrap
            gap-2
            mt-6
            ">


                <Tag
                    icon={<MapPin size={15}/>}
                    text={scholarship.country}
                />


                <Tag
                    icon={<Wallet size={15}/>}
                    text={scholarship.funding}
                />


                <Tag
                    icon={<Calendar size={15}/>}
                    text={scholarship.deadline}
                />


            </div>









            {/* AI Explanation */}


            <div className="
            mt-7
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


                    Why AI recommends this


                </div>



                <ul className="
                mt-4
                space-y-3
                text-muted
                text-sm
                ">


                    {
                        scholarship.reasons.map(
                            (reason,index)=>(

                                <li key={index}>

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
                mt-7
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






function Tag({icon,text}) {


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