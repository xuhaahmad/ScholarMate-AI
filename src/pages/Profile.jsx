import { useNavigate } from "react-router-dom";
import { User, BookOpen, BarChart3, Globe, Wallet } from "lucide-react";
import InputField from "../components/InputField";
import React from "react";


function Profile() {


    const navigate = useNavigate();



    const [profile, setProfile] = React.useState({

        name: "",
        field: "",
        cgpa: "",
        country: "",
        funding: ""

    });




    function handleChange(e) {

        setProfile({

            ...profile,

            [e.target.name]: e.target.value

        });

    }





    function handleSubmit(e) {

        e.preventDefault();


        navigate("/loading", {

            state: profile

        });


    }






    return (


        <div className="
        min-h-screen
        bg-background
        ">




            {/* Header */}



            <section className="
            bg-primary
            text-white
            px-4
            sm:px-6
            py-16
            sm:py-20
            text-center
            ">



                <div className="
                max-w-3xl
                mx-auto
                ">




                    <div className="
                    flex
                    justify-center
                    ">


                        <div className="
                        bg-white/20
                        p-3
                        sm:p-4
                        rounded-2xl
                        ">


                            <User 
                            size={30}
                            className="sm:w-9 sm:h-9"
                            />


                        </div>


                    </div>






                    <h1 className="
                    text-3xl
                    sm:text-4xl
                    md:text-5xl
                    font-bold
                    mt-6
                    ">


                        Tell Us About Yourself


                    </h1>






                    <p className="
                    mt-4
                    text-white/80
                    text-base
                    sm:text-lg
                    max-w-xl
                    mx-auto
                    ">


                        Build your profile and let ScholarMate AI
                        find opportunities made for you.


                    </p>



                </div>


            </section>









            {/* Form */}



            <form


                onSubmit={handleSubmit}


                className="
                w-[calc(100%-2rem)]
                sm:w-full
                max-w-xl
                mx-auto
                -mt-8
                sm:-mt-10
                bg-white
                rounded-3xl
                p-6
                sm:p-8
                md:p-10
                shadow-xl
                space-y-5
                sm:space-y-6
                "



            >






                <InputField

                    icon={<User size={18}/>}

                    label="Full Name"

                    name="name"

                    placeholder="Enter your name"

                    value={profile.name}

                    onChange={handleChange}

                />







                <InputField

                    icon={<BookOpen size={18}/>}

                    label="Academic Field"

                    name="field"

                    placeholder="Example: Computer Science"

                    value={profile.field}

                    onChange={handleChange}

                />








                <InputField

                    icon={<BarChart3 size={18}/>}

                    label="CGPA"

                    name="cgpa"

                    placeholder="Example: 3.7"

                    value={profile.cgpa}

                    onChange={handleChange}

                />









                <InputField

                    icon={<Globe size={18}/>}

                    label="Preferred Country"

                    name="country"

                    placeholder="Example: Germany"

                    value={profile.country}

                    onChange={handleChange}

                />









                <InputField

                    icon={<Wallet size={18}/>}

                    label="Funding Preference"

                    name="funding"

                    placeholder="Example: Fully Funded"

                    value={profile.funding}

                    onChange={handleChange}

                />










                <button


                    className="
                    w-full
                    bg-primary
                    hover:bg-primaryDark
                    text-white
                    py-3
                    sm:py-4
                    rounded-2xl
                    font-semibold
                    text-base
                    sm:text-lg
                    transition
                    hover:scale-[1.02]
                    "


                >


                    Find My Scholarships →


                </button>





            </form>





        </div>


    );

}



export default Profile;