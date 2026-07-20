import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Brain } from "lucide-react";
import { motion } from "framer-motion";


function Loading() {


    const navigate = useNavigate();

    const location = useLocation();

    const profile = location.state;



    useEffect(() => {


        const timer = setTimeout(() => {


            navigate("/results", {

                state: profile

            });


        }, 2500);



        return () => clearTimeout(timer);


    }, [navigate, profile]);





    return (


        <div className="
        min-h-screen
        bg-background
        flex
        items-center
        justify-center
        px-6
        ">




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
                duration:0.6
            }}

            className="
            bg-white
            border
            border-border
            p-10
            rounded-3xl
            shadow-xl
            text-center
            max-w-md
            ">


                {/* AI Icon */}


                <motion.div

                animate={{
                    rotate:360
                }}

                transition={{
                    duration:3,
                    repeat:Infinity,
                    ease:"linear"
                }}

                className="
                flex
                justify-center
                ">

                    <div className="
                    bg-secondary
                    text-primary
                    p-5
                    rounded-3xl
                    ">

                        <Brain size={45}/>

                    </div>


                </motion.div>








                <h1 className="
                text-3xl
                font-bold
                text-primary
                mt-8
                ">


                    ScholarMate AI is analyzing...


                </h1>







                <p className="
                text-muted
                mt-4
                ">


                    Finding scholarships that match your academic profile.


                </p>








                {/* Progress */}


                <div className="
                mt-8
                w-full
                bg-gray-200
                rounded-full
                h-3
                overflow-hidden
                ">


                    <motion.div

                    initial={{
                        width:"0%"
                    }}

                    animate={{
                        width:"85%"
                    }}

                    transition={{
                        duration:2.5
                    }}

                    className="
                    bg-primary
                    h-3
                    rounded-full
                    "

                    >

                    </motion.div>


                </div>








                <div className="
                flex
                items-center
                justify-center
                gap-2
                text-muted
                text-sm
                mt-6
                ">


                    <Sparkles size={16}/>


                    AI matching your opportunities


                </div>



            </motion.div>




        </div>


    );

}



export default Loading;