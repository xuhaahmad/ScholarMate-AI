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
            px-6
            py-6
            flex
            justify-between
            items-center
            ">


                {/* Logo */}

                <div className="
                flex
                items-center
                gap-2
                text-white
                font-bold
                text-2xl
                ">


                    <Sparkles size={26}/>

                    ScholarMate AI


                </div>





                {/* Button */}


                <button

                    onClick={() => navigate("/profile")}


                    className="
                    bg-white
                    text-primary
                    px-6
                    py-3
                    rounded-2xl
                    font-semibold
                    hover:scale-105
                    transition
                    "

                >

                    Get Started 🚀


                </button>



            </div>


        </nav>

    );

}


export default Navbar;