import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Brain, RotateCcw, Sparkles, UserPen } from "lucide-react";


// Stop waiting if the backend never answers, so the spinner cannot run forever.
// The backend finishes a search in about 50 seconds at most (backend/config.js).
const REQUEST_TIMEOUT_MS = 75000;


function Loading() {


    const navigate = useNavigate();

    const location = useLocation();

    const profile = location.state;

    // Opening /loading directly leaves no profile at all; a profile without an
    // academic field cannot be searched either.
    const hasProfile = Boolean(profile) && typeof profile === "object";

    const hasField = typeof profile?.field === "string" && profile.field.trim() !== "";

    const [error, setError] = useState("");

    const [attempt, setAttempt] = useState(0);

    const lastAttempt = useRef(-1);

    const isMounted = useRef(true);

useEffect(() => {

    isMounted.current = true;

    return () => {
        isMounted.current = false;
    };

}, []);

useEffect(() => {

    // Run each attempt once, even though React StrictMode runs effects twice in development.
    if (!hasField || lastAttempt.current === attempt) {
        return;
    }

    lastAttempt.current = attempt;

    async function findScholarships() {

        try {

            const response = await fetch(
    "/api/search-scholarships",
    {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...profile,
                        // Profiles saved before the degree field existed default to Bachelor.
                        degree: profile.degree || "Bachelor",
                        destination: profile.country
                    }),
                    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok || !Array.isArray(data?.scholarships)) {
                throw new Error(
                    data?.error || "We couldn't find scholarships right now. Please try again."
                );
            }

            if (!isMounted.current) {
                return;
            }

            navigate("/results", {
                state: {
                    profile: profile,
                    scholarships: data.scholarships,
                    coverage: data.coverage ?? null
                }
            });

        } catch (error) {

            console.error("Scholarship search error:", error);

            if (!isMounted.current) {
                return;
            }

            // TypeError = network failure, TimeoutError = no answer within REQUEST_TIMEOUT_MS.
            setError(
                error.name === "TypeError" || error.name === "TimeoutError"
                    ? "We couldn't reach ScholarMate AI. Please check your connection and try again."
                    : error.message
            );

        }

    }

    findScholarships();

}, [attempt, hasField, navigate, profile]);



    function retry() {

        setError("");

        setAttempt((current) => current + 1);

    }



    // Send the entered values back so the profile form is prefilled.
    function editProfile() {

        navigate("/profile", {
            state: { profile }
        });

    }



    if (!hasProfile) {

        return (

            <StatusCard
                title="No Profile Found"
                message="Tell us about your studies first so ScholarMate AI knows what to search for."
                editLabel="Go to Profile"
                onEditProfile={() => navigate("/profile")}
            />

        );

    }



    if (!hasField) {

        return (

            <StatusCard
                title="Academic Field Required"
                message="Please add your academic field so ScholarMate AI knows which scholarships to search for."
                editLabel="Edit Profile"
                onEditProfile={editProfile}
            />

        );

    }



    if (error) {

        return (

            <StatusCard
                title="Search Didn't Finish"
                message={error}
                onRetry={retry}
                editLabel="Edit Profile"
                onEditProfile={editProfile}
            />

        );

    }



    return (


        <div className="
        min-h-screen
        bg-background
        flex
        items-center
        justify-center
        px-6
        ">




            <motion.div

            initial={{
                opacity:0,
                scale:0.9
            }}

            animate={{
                opacity:1,
                scale:1
            }}

            transition={{
                duration:0.6
            }}

            className="
            bg-white
            border
            border-border
            p-10
            rounded-3xl
            shadow-xl
            text-center
            max-w-md
            ">


                {/* AI Icon */}


                <motion.div

                animate={{
                    rotate:360
                }}

                transition={{
                    duration:3,
                    repeat:Infinity,
                    ease:"linear"
                }}

                className="
                flex
                justify-center
                ">

                    <div className="
                    bg-secondary
                    text-primary
                    p-5
                    rounded-3xl
                    ">

                        <Brain size={45}/>

                    </div>


                </motion.div>








                <h1 className="
                text-3xl
                font-bold
                text-primary
                mt-8
                ">


                    ScholarMate AI is analyzing...


                </h1>







                <p className="
                text-muted
                mt-4
                ">


                    Finding scholarships that match your academic profile.


                </p>








                {/* Progress */}


                <div className="
                mt-8
                w-full
                bg-gray-200
                rounded-full
                h-3
                overflow-hidden
                ">


                    <motion.div

                    initial={{
                        width:"0%"
                    }}

                    animate={{
                        width:"85%"
                    }}

                    transition={{
                        duration:2.5
                    }}

                    className="
                    bg-primary
                    h-3
                    rounded-full
                    "

                    >

                    </motion.div>


                </div>








                <div className="
                flex
                items-center
                justify-center
                gap-2
                text-muted
                text-sm
                mt-6
                ">


                    <Sparkles size={16}/>


                    AI matching your opportunities


                </div>



            </motion.div>




        </div>


    );

}



function StatusCard({ title, message, onRetry, editLabel, onEditProfile }) {


    return (


        <div className="
        min-h-screen
        bg-background
        flex
        items-center
        justify-center
        px-6
        ">


            <motion.div

            initial={{
                opacity:0,
                scale:0.9
            }}

            animate={{
                opacity:1,
                scale:1
            }}

            transition={{
                duration:0.4
            }}

            role="alert"

            className="
            bg-white
            border
            border-border
            p-10
            rounded-3xl
            shadow-xl
            text-center
            max-w-md
            ">


                <div className="
                flex
                justify-center
                ">

                    <div className="
                    bg-secondary
                    text-primary
                    p-5
                    rounded-3xl
                    ">

                        <AlertTriangle size={45}/>

                    </div>

                </div>


                <h1 className="
                text-3xl
                font-bold
                text-primary
                mt-8
                ">

                    {title}

                </h1>


                <p className="
                text-muted
                mt-4
                ">

                    {message}

                </p>


                <div className="
                mt-8
                flex
                flex-col
                sm:flex-row
                gap-3
                justify-center
                ">

                    {onRetry && (

                        <button

                            onClick={onRetry}

                            className="
                            flex
                            items-center
                            justify-center
                            gap-2
                            bg-primary
                            hover:bg-primaryDark
                            text-white
                            px-6
                            py-3
                            rounded-xl
                            font-semibold
                            transition
                            "

                        >

                            <RotateCcw size={18}/>

                            Try Again

                        </button>

                    )}


                    <button

                        onClick={onEditProfile}

                        className={`
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-6
                        py-3
                        rounded-xl
                        font-semibold
                        transition
                        ${onRetry
                            ? "bg-secondary text-primary hover:bg-border"
                            : "bg-primary hover:bg-primaryDark text-white"}
                        `}

                    >

                        <UserPen size={18}/>

                        {editLabel}

                    </button>

                </div>


            </motion.div>


        </div>


    );

}



export default Loading;