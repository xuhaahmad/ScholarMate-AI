import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";


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


            <div className="
            bg-white
            p-10
            rounded-3xl
            shadow-xl
            text-center
            max-w-md
            ">



                <div className="
                text-6xl
                animate-bounce
                ">

                    🤖

                </div>




                <h1 className="
                text-3xl
                font-bold
                text-primary
                mt-6
                ">

                    ScholarMate AI is analyzing...

                </h1>




                <p className="
                text-muted
                mt-4
                ">

                    Finding scholarships that match your academic profile.

                </p>




                <div className="
                mt-8
                w-full
                bg-gray-200
                rounded-full
                h-3
                ">


                    <div className="
                    bg-primary
                    h-3
                    rounded-full
                    animate-pulse
                    w-3/4
                    ">

                    </div>


                </div>



            </div>


        </div>

    );

}


export default Loading;