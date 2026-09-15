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




                    <span>
                        ScholarMate AI
                    </span>


                </div>





                {/* Button */}

                {/* Buttons */}

                <div className="flex items-center gap-3">

    <button
        onClick={() => navigate("/about")}
        className="
        text-white
        text-sm
        sm:text-base
        font-medium
        hover:opacity-80
        transition
        "
    >
        About
    </button>

</div>

            </div>


        </nav>

    );

}


export default Navbar;