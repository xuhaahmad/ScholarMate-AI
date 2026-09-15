import {
    Sparkles,
    Search,
    GraduationCap,
    Heart,
    ArrowRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import colors from "../theme/colors";


function About() {

    const navigate = useNavigate();


    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: colors.background,
                color: colors.text
            }}
        >


            {/* Hero */}

            <section className="relative overflow-hidden">

                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`
                    }}
                />

                <div
                    className="
                        absolute
                        -top-32
                        -right-32
                        w-96
                        h-96
                        rounded-full
                        blur-3xl
                    "
                    style={{
                        backgroundColor: "rgba(216, 232, 210, 0.10)"
                    }}
                />

                <div
                    className="
                        absolute
                        -bottom-40
                        -left-32
                        w-96
                        h-96
                        rounded-full
                        blur-3xl
                    "
                    style={{
                        backgroundColor: "rgba(216, 232, 210, 0.08)"
                    }}
                />


                <div className="
                    relative
                    max-w-6xl
                    mx-auto
                    px-6
                    pt-32
                    pb-24
                    text-center
                    text-white
                ">


                    <div
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2
                            rounded-full
                            border
                            backdrop-blur-sm
                            text-sm
                            font-medium
                            mb-7
                        "
                        style={{
                            backgroundColor: "rgba(216, 232, 210, 0.12)",
                            borderColor: "rgba(216, 232, 210, 0.25)"
                        }}
                    >
                        <Sparkles size={16} />
                        About ScholarMate AI
                    </div>


                    <h1 className="
                        text-4xl
                        md:text-6xl
                        font-bold
                        tracking-tight
                        mb-6
                    ">
                        Making scholarship discovery
                        <br />

                        <span style={{ color: colors.secondary }}>
                            simpler for students.
                        </span>
                    </h1>


                    <p className="
                        max-w-2xl
                        mx-auto
                        text-lg
                        md:text-xl
                        text-white/80
                        leading-relaxed
                    ">
                        A platform created to bring relevant scholarship
                        opportunities and information together in one place.
                    </p>

                </div>

            </section>


            {/* Main Content */}

            <section className="
                max-w-6xl
                mx-auto
                px-6
                py-20
            ">


                <div className="
                    grid
                    md:grid-cols-2
                    gap-8
                    mb-20
                ">


                    {/* Why I built ScholarMate */}

                    <div
                        className="
                            p-8
                            md:p-10
                            rounded-3xl
                            border
                            hover:shadow-lg
                            transition
                        "
                        style={{
                            backgroundColor: colors.secondary,
                            borderColor: colors.secondary
                        }}
                    >

                        <div
                            className="
                                w-12
                                h-12
                                rounded-2xl
                                text-white
                                flex
                                items-center
                                justify-center
                                mb-6
                            "
                            style={{
                                backgroundColor: colors.primary
                            }}
                        >
                            <Search size={24} />
                        </div>


                        <h2 className="
                            text-2xl
                            font-bold
                            mb-4
                        ">
                            Why I built ScholarMate
                        </h2>


                        <p
                            className="leading-relaxed"
                            style={{ color: colors.muted }}
                        >
                            Scholarship information is often scattered across
                            university websites, government portals, scholarship
                            databases, embassy pages, and different application
                            platforms. Students can spend hours searching,
                            comparing requirements, and figuring out which
                            opportunities actually apply to them.
                        </p>

                    </div>



                    {/* The Idea */}

                    <div
                        className="
                            p-8
                            md:p-10
                            rounded-3xl
                            border
                            hover:shadow-lg
                            transition
                        "
                        style={{
                            backgroundColor: colors.background,
                            borderColor: colors.secondary
                        }}
                    >

                        <div
                            className="
                                w-12
                                h-12
                                rounded-2xl
                                text-white
                                flex
                                items-center
                                justify-center
                                mb-6
                            "
                            style={{
                                backgroundColor: colors.primaryDark
                            }}
                        >
                            <GraduationCap size={24} />
                        </div>


                        <h2 className="
                            text-2xl
                            font-bold
                            mb-4
                        ">
                            The idea
                        </h2>


                        <p
                            className="leading-relaxed"
                            style={{ color: colors.muted }}
                        >
                            I wanted to create a single platform where students
                            could enter their academic profile and discover
                            relevant scholarship opportunities without having
                            to manually search through countless websites.
                        </p>

                    </div>

                </div>



                {/* Motivation */}

                <div
                    className="
                        relative
                        overflow-hidden
                        rounded-3xl
                        p-8
                        md:p-12
                        text-white
                        mb-20
                    "
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                    }}
                >

                    <div
                        className="
                            absolute
                            -right-20
                            -top-20
                            w-64
                            h-64
                            rounded-full
                            blur-2xl
                        "
                        style={{
                            backgroundColor: "rgba(216, 232, 210, 0.10)"
                        }}
                    />


                    <div className="relative max-w-3xl">

                        <Heart
                            size={30}
                            className="mb-6"
                            style={{ color: colors.secondary }}
                        />


                        <h2 className="
                            text-2xl
                            md:text-3xl
                            font-bold
                            mb-5
                        ">
                            Built with a simple purpose
                        </h2>


                        <p
                            className="leading-relaxed text-lg"
                            style={{ color: colors.secondary }}
                        >
                            I created ScholarMate AI because I wanted
                            scholarship opportunities to be easier to discover
                            and understand. The goal is to help students spend
                            less time searching through scattered information
                            and more time focusing on opportunities that could
                            actually make a difference in their future.
                        </p>

                    </div>

                </div>



                {/* Closing */}

                <div className="text-center">


                    <div
                        className="
                            inline-flex
                            items-center
                            justify-center
                            w-12
                            h-12
                            rounded-2xl
                            mb-5
                        "
                        style={{
                            backgroundColor: colors.secondary,
                            color: colors.primaryDark
                        }}
                    >
                        <Sparkles size={22} />
                    </div>


                    <h2 className="
                        text-2xl
                        md:text-3xl
                        font-bold
                        mb-4
                    ">
                        From an idea to a growing project
                    </h2>


                    <p
                        className="
                            max-w-2xl
                            mx-auto
                            leading-relaxed
                            mb-8
                        "
                        style={{ color: colors.muted }}
                    >
                        ScholarMate AI is continuously evolving with new
                        features, improvements, and smarter ways to help
                        students discover opportunities.
                    </p>


                    <button
                        onClick={() => navigate("/profile")}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            text-white
                            px-6
                            py-3
                            rounded-2xl
                            font-semibold
                            hover:scale-105
                            transition
                        "
                        style={{
                            backgroundColor: colors.primary
                        }}
                    >
                        Find Scholarships
                        <ArrowRight size={18} />
                    </button>

                </div>


            </section>

        </div>
    );
}


export default About;