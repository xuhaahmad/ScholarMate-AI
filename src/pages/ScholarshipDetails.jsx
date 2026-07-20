import { useLocation, useNavigate } from "react-router-dom";
import {
    MapPin,
    Wallet,
    Calendar,
    GraduationCap,
    Sparkles,
    ArrowLeft,
    ExternalLink
} from "lucide-react";

import { motion } from "framer-motion";


function ScholarshipDetails() {


    const location = useLocation();

    const navigate = useNavigate();

    const scholarship = location.state;



    if (!scholarship) {

        return (

            <div className="
            min-h-screen
            bg-background
            flex
            items-center
            justify-center
            px-6
            ">


                <div className="
                bg-white
                rounded-3xl
                p-10
                text-center
                shadow-xl
                ">


                    <h2 className="
                    text-2xl
                    font-bold
                    text-text
                    ">

                        Scholarship Not Found

                    </h2>


                    <button

                        onClick={() => navigate("/")}

                        className="
                        mt-6
                        bg-primary
                        text-white
                        px-6
                        py-3
                        rounded-xl
                        "

                    >

                        Go Home

                    </button>


                </div>


            </div>

        );

    }




    return (


        <div className="
        min-h-screen
        bg-background
        px-4
        sm:px-6
        py-10
        ">



            <button

                onClick={() => navigate(-1)}

                className="
                flex
                items-center
                gap-2
                text-muted
                hover:text-primary
                transition
                "

            >

                <ArrowLeft size={18}/>

                Back to Results

            </button>







            {/* Hero */}


            <motion.section

            initial={{
                opacity:0,
                y:-30
            }}

            animate={{
                opacity:1,
                y:0
            }}

            transition={{
                duration:0.6
            }}

            className="
            max-w-5xl
            mx-auto
            mt-8
            bg-primary
            text-white
            rounded-3xl
            p-6
            sm:p-10
            shadow-xl
            "

            >


                <div className="
                flex
                flex-col
                md:flex-row
                justify-between
                gap-8
                ">



                    <div>


                        <div className="
                        inline-flex
                        items-center
                        gap-2
                        bg-white/20
                        px-4
                        py-2
                        rounded-full
                        text-sm
                        ">


                            <Sparkles size={16}/>

                            AI Recommended


                        </div>





                        <h1 className="
                        text-3xl
                        sm:text-5xl
                        font-bold
                        mt-6
                        ">

                            {scholarship.name}

                        </h1>





                        <p className="
                        mt-4
                        text-white/80
                        flex
                        items-center
                        gap-2
                        ">


                            <GraduationCap size={18}/>

                            {scholarship.university}


                        </p>



                    </div>






                    <div className="
                    bg-white
                    text-primary
                    rounded-3xl
                    px-8
                    py-6
                    text-center
                    self-start
                    ">


                        <p className="
                        text-5xl
                        font-bold
                        ">

                            {scholarship.score}%

                        </p>


                        <p className="
                        text-sm
                        ">

                            Match Score

                        </p>


                    </div>




                </div>


            </motion.section>









            <div className="
            max-w-5xl
            mx-auto
            grid
            md:grid-cols-3
            gap-8
            mt-10
            ">





                <div className="
                md:col-span-2
                space-y-8
                ">




                    <Section title="About Scholarship">


                        <p className="
                        text-muted
                        leading-relaxed
                        ">

                            {scholarship.description}

                        </p>


                    </Section>








                    <Section title="Why ScholarMate AI recommends this">


                        <ul className="
                        space-y-3
                        text-muted
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


                    </Section>



                </div>









                <motion.div

                initial={{
                    opacity:0,
                    x:30
                }}

                animate={{
                    opacity:1,
                    x:0
                }}

                transition={{
                    duration:0.6
                }}

                >


                    <div className="
                    bg-white
                    rounded-3xl
                    border
                    border-border
                    p-6
                    space-y-6
                    shadow-sm
                    ">


                        <Info
                        icon={<MapPin/>}
                        label="Country"
                        value={scholarship.country}
                        />


                        <Info
                        icon={<Wallet/>}
                        label="Funding"
                        value={scholarship.funding}
                        />


                        <Info
                        icon={<Calendar/>}
                        label="Deadline"
                        value={scholarship.deadline}
                        />


                    </div>





                    <button

                    className="
                    w-full
                    mt-6
                    bg-primary
                    hover:bg-primaryDark
                    text-white
                    py-4
                    rounded-2xl
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition
                    hover:scale-[1.02]
                    "

                    >

                        Visit Official Website

                        <ExternalLink size={18}/>

                    </button>



                </motion.div>




            </div>


        </div>

    );

}








function Section({title,children}) {


    return (

        <div className="
        bg-white
        rounded-3xl
        border
        border-border
        p-6
        sm:p-8
        ">


            <h2 className="
            text-2xl
            font-bold
            text-text
            mb-4
            ">

                {title}

            </h2>


            {children}


        </div>

    );

}








function Info({icon,label,value}) {


    return (

        <div className="
        flex
        gap-4
        items-center
        ">


            <div className="
            text-primary
            ">

                {icon}

            </div>



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
                ">

                    {value}

                </p>


            </div>


        </div>

    );

}



export default ScholarshipDetails;