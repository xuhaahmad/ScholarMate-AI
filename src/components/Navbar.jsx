import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";


function Navbar() {


    const navigate = useNavigate();



    return (

        <nav className="
        absolute
        top-0
        w-full
        z-50
        ">


            <div className="
            max-w-6xl
            mx-auto
            px-4
            sm:px-6
            py-5
            flex
            justify-between
            items-center
            gap-4
            ">


                {/* Logo */}


                <div className="
                flex
                items-center
                gap-2
                text-white
                font-bold
                text-xl
                sm:text-2xl
                ">


                    <Sparkles 
                    size={22}
                    className="sm:w-6 sm:h-6"
                    />


                    <span>
                        ScholarMate AI
                    </span>


                </div>





                {/* Button */}


                <button

                    onClick={() => navigate("/profile")}


                    className="
                    bg-white
                    text-primary
                    px-4
                    sm:px-6
                    py-2
                    sm:py-3
                    rounded-2xl
                    text-sm
                    sm:text-base
                    font-semibold
                    hover:scale-105
                    transition
                    whitespace-nowrap
                    "

                >

                    Get Started 🚀


                </button>



            </div>


        </nav>

    );

}


export default Navbar;