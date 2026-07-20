import { useLocation, useNavigate } from "react-router-dom";
import {
    MapPin,
    Wallet,
    Calendar,
    GraduationCap,
    Sparkles,
    ArrowLeft
} from "lucide-react";


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
            ">

                <div className="
                bg-white
                p-10
                rounded-3xl
                shadow
                text-center
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
        px-6
        py-12
        ">



            {/* Back Button */}


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


            <section className="
            max-w-5xl
            mx-auto
            mt-8
            bg-primary
            text-white
            rounded-3xl
            p-10
            ">



                <div className="
                flex
                justify-between
                items-start
                gap-5
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
                        text-4xl
                        md:text-5xl
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
                    rounded-2xl
                    px-6
                    py-5
                    text-center
                    ">


                        <p className="
                        text-4xl
                        font-bold
                        ">

                            {scholarship.score}%

                        </p>


                        <p className="text-sm">

                            Match

                        </p>


                    </div>




                </div>



            </section>









            {/* Content */}


            <div className="
            max-w-5xl
            mx-auto
            grid
            md:grid-cols-3
            gap-8
            mt-10
            ">





                {/* Main */}


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







                    <Section title="Why AI recommends this">


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








                {/* Sidebar */}


                <div>


                    <div className="
                    bg-white
                    rounded-3xl
                    border
                    border-border
                    p-6
                    space-y-5
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
                        transition
                        "

                    >

                        Visit Official Website →

                    </button>



                </div>




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
        p-8
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
        gap-3
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