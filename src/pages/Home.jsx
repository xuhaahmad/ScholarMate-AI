import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import FeatureCard from "../components/FeatureCard";
import Footer from "../components/Footer";

function Home() {

    const navigate = useNavigate();


    return (

        <div className="min-h-screen bg-background">


            <Navbar />



            {/* Hero Section */}

            <section className="
            max-w-6xl
            mx-auto
            px-6
            py-20
            text-center
            ">


                <div className="
                inline-block
                bg-secondary
                text-primary
                px-5
                py-2
                rounded-full
                font-medium
                ">

                    🤖 AI Powered Scholarship Finder

                </div>




                <h1 className="
                text-6xl
                font-bold
                mt-8
                text-text
                leading-tight
                ">

                    Find Scholarships
                    <br />

                    Made For You 🎓

                </h1>




                <p className="
                max-w-2xl
                mx-auto
                mt-6
                text-xl
                text-muted
                ">

                    ScholarMate AI analyzes your academic profile
                    and recommends scholarships that match your goals.

                </p>




                <button

                    onClick={() => navigate("/profile")}

                    className="
                    mt-10
                    bg-primary
                    hover:bg-primaryDark
                    text-white
                    px-10
                    py-4
                    rounded-2xl
                    text-lg
                    font-semibold
                    transition
                    "

                >

                    Start Your Journey 🚀

                </button>



            </section>





            {/* Features */}

            <section className="
            max-w-5xl
            mx-auto
            px-6
            pb-20
            grid
            md:grid-cols-3
            gap-6
            ">



                <FeatureCard

                    icon="🤖"

                    title="AI Matching"

                    description="Get scholarship recommendations based on your academic profile."

                />




                <FeatureCard

                    icon="🎯"

                    title="Personalized Results"

                    description="Find opportunities that match your field, CGPA and preferences."

                />




                <FeatureCard

                    icon="🌍"

                    title="Global Opportunities"

                    description="Discover scholarships from universities around the world."

                />


            </section>

             <Footer />


        </div>

    );

}


export default Home;