import { useNavigate } from "react-router-dom";
import { Brain, Globe, Target, ArrowRight, GraduationCap } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";


function Home() {


    const navigate = useNavigate();



    return (

        <div className="
        min-h-screen
        bg-background
        ">


            <Navbar />





            {/* Hero Section */}


            <section className="
            bg-primary
            text-white
            ">


                <div className="
                max-w-6xl
                mx-auto
                px-4
                sm:px-6
                py-20
                md:py-24
                grid
                md:grid-cols-2
                gap-10
                md:gap-16
                items-center
                ">



                    {/* Left Content */}


                    <motion.div

                        initial={{
                            opacity:0,
                            x:-40
                        }}

                        animate={{
                            opacity:1,
                            x:0
                        }}

                        transition={{
                            duration:0.7,
                            ease:"easeOut"
                        }}

                    >



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


                            <Brain size={18}/>

                            AI Powered Scholarship Finder


                        </div>






                        <h1 className="
                        text-4xl
                        sm:text-5xl
                        md:text-6xl
                        font-bold
                        leading-tight
                        mt-8
                        ">


                            Find scholarships
                            <br />

                            made for your future.


                        </h1>







                        <p className="
                        mt-6
                        text-base
                        sm:text-lg
                        text-white/80
                        max-w-xl
                        leading-relaxed
                        ">


                            ScholarMate AI analyzes your academic profile
                            and finds scholarship opportunities that match
                            your goals, field, and preferences.


                        </p>







                        <button


                            onClick={() => navigate("/profile")}


                            className="
                            mt-8
                            bg-white
                            text-primary
                            px-6
                            sm:px-8
                            py-3
                            sm:py-4
                            rounded-2xl
                            font-semibold
                            flex
                            items-center
                            gap-2
                            hover:scale-105
                            transition
                            "


                        >


                            Start Matching

                            <ArrowRight size={20}/>


                        </button>



                    </motion.div>







                    {/* AI Preview Card */}



                    <motion.div


                        initial={{
                            opacity:0,
                            scale:0.9
                        }}


                        animate={{
                            opacity:1,
                            scale:1
                        }}


                        transition={{
                            duration:0.7,
                            delay:0.2,
                            ease:"easeOut"
                        }}


                        className="
                        flex
                        justify-center
                        "


                    >



                        <div className="
                        bg-white
                        text-text
                        rounded-3xl
                        p-6
                        sm:p-8
                        w-full
                        max-w-md
                        shadow-xl
                        ">



                            <div className="
                            flex
                            items-center
                            gap-3
                            ">


                                <div className="
                                bg-secondary
                                p-3
                                rounded-2xl
                                ">


                                    <GraduationCap
                                    className="text-primary"
                                    />


                                </div>




                                <div>


                                    <p className="
                                    text-sm
                                    text-muted
                                    ">

                                        Student Profile

                                    </p>



                                    <h3 className="
                                    font-semibold
                                    text-lg
                                    sm:text-xl
                                    ">

                                        Computer Science

                                    </h3>


                                </div>


                            </div>






                            <div className="
                            mt-8
                            space-y-4
                            ">



                                <div className="
                                flex
                                justify-between
                                ">


                                    <span className="text-muted">

                                        CGPA

                                    </span>


                                    <span className="font-semibold">

                                        3.7

                                    </span>


                                </div>





                                <div className="
                                flex
                                justify-between
                                ">


                                    <span className="text-muted">

                                        Country

                                    </span>


                                    <span className="font-semibold">

                                        Germany

                                    </span>


                                </div>



                            </div>






                            <div className="
                            mt-8
                            bg-secondary
                            rounded-2xl
                            p-5
                            ">



                                <p className="
                                text-primary
                                font-medium
                                ">

                                    AI Match Score

                                </p>



                                <h2 className="
                                text-4xl
                                sm:text-5xl
                                font-bold
                                text-primary
                                mt-2
                                ">

                                    94%

                                </h2>




                                <p className="
                                text-muted
                                mt-2
                                ">

                                    Erasmus Scholarship

                                </p>



                            </div>




                        </div>



                    </motion.div>



                </div>


            </section>









            {/* Features */}



            <section className="
            max-w-6xl
            mx-auto
            px-4
            sm:px-6
            py-16
            md:py-20
            ">




                <h2 className="
                text-2xl
                sm:text-3xl
                font-bold
                text-text
                text-center
                ">


                    Everything you need to find scholarships


                </h2>







                <div className="
                grid
                md:grid-cols-3
                gap-6
                mt-10
                md:mt-12
                ">



                    <Feature

                        icon={<Brain/>}

                        title="AI Matching"

                        text="Smart recommendations based on your academic profile."

                    />



                    <Feature

                        icon={<Target/>}

                        title="Personalized Results"

                        text="Scholarships matched according to your goals."

                    />



                    <Feature

                        icon={<Globe/>}

                        title="Global Opportunities"

                        text="Discover scholarships from universities worldwide."

                    />


                </div>



            </section>






            <Footer />


        </div>

    );

}







function Feature({icon,title,text}) {


    return (


        <motion.div


            initial={{
                opacity:0,
                y:30
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
                y:-8
            }}


            className="
            bg-white
            border
            border-border
            rounded-3xl
            p-6
            sm:p-8
            hover:bg-secondary/20
            transition
            "


        >



            <div className="
            text-primary
            ">

                {icon}

            </div>




            <h3 className="
            text-xl
            font-semibold
            mt-5
            text-text
            ">

                {title}

            </h3>




            <p className="
            mt-3
            text-muted
            ">

                {text}

            </p>



        </motion.div>


    );

}





export default Home;