import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";


function Profile() {


    const navigate = useNavigate();



    const [profile, setProfile] = useState({

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
        px-6
        py-14
        ">


            <div className="
            max-w-3xl
            mx-auto
            text-center
            ">


                <div className="
                inline-flex
                bg-secondary
                text-primary
                px-5
                py-2
                rounded-full
                font-medium
                ">

                    🎓 Student Profile

                </div>




                <h1 className="
                text-5xl
                font-bold
                mt-6
                text-text
                ">

                    Tell Us About Yourself

                </h1>




                <p className="
                mt-4
                text-lg
                text-muted
                ">

                    We'll analyze your profile and find scholarships
                    that match your goals.

                </p>


            </div>







            <form

                onSubmit={handleSubmit}

                className="
                max-w-xl
                mx-auto
                mt-12
                bg-white
                p-10
                rounded-3xl
                shadow-xl
                border
                border-secondary
                space-y-6
                "


            >



                <InputField

                    icon="👤"

                    label="Full Name"

                    name="name"

                    placeholder="Enter your name"

                    value={profile.name}

                    onChange={handleChange}

                />




                <InputField

                    icon="💻"

                    label="Academic Field"

                    name="field"

                    placeholder="Example: Computer Science"

                    value={profile.field}

                    onChange={handleChange}

                />




                <InputField

                    icon="📊"

                    label="CGPA"

                    name="cgpa"

                    placeholder="Example: 3.5"

                    value={profile.cgpa}

                    onChange={handleChange}

                />





                <InputField

                    icon="🌍"

                    label="Preferred Country"

                    name="country"

                    placeholder="Example: South Korea"

                    value={profile.country}

                    onChange={handleChange}

                />





                <InputField

                    icon="💰"

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
                    hover:scale-[1.02]
                    text-white
                    py-4
                    rounded-2xl
                    font-semibold
                    text-lg
                    transition
                    shadow-lg
                    "

                >

                    Find My Scholarships 🚀

                </button>



            </form>


        </div>

    );

}


export default Profile;