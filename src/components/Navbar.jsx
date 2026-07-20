import { useNavigate } from "react-router-dom";


function Navbar() {

    const navigate = useNavigate();


    return (

        <nav className="
        flex
        justify-between
        items-center
        px-8
        py-5
        bg-white
        shadow-sm
        ">


            <h1 className="
            text-2xl
            font-bold
            text-primary
            ">

                ScholarMate AI 🎓

            </h1>



            <button

                onClick={() => navigate("/profile")}

                className="
                bg-primary
                hover:bg-primaryDark
                text-white
                px-6
                py-3
                rounded-xl
                transition
                "

            >

                Find Scholarships

            </button>


        </nav>

    );

}


export default Navbar;