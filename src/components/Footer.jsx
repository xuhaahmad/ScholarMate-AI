function Footer() {


    return (

        <footer className="
        bg-white
        border-t
        mt-20
        py-10
        text-center
        ">


            <h2 className="
            text-xl
            font-bold
            text-primary
            ">

                ScholarMate AI 🎓

            </h2>




            <p className="
            text-muted
            mt-3
            max-w-md
            mx-auto
            ">

                Helping students discover global scholarship opportunities
                with AI-powered recommendations.

            </p>





            <div className="
            flex
            justify-center
            gap-6
            mt-6
            ">


                <a

                href="https://github.com/xuhaahmad"

                target="_blank"

                className="
                text-muted
                hover:text-primary
                transition
                "

                >

                    GitHub

                </a>





                <a

                href="https://www.linkedin.com/in/zuha-ahmad-793900331"

                target="_blank"

                className="
                text-muted
                hover:text-primary
                transition
                "

                >

                    LinkedIn

                </a>



            </div>






            <p className="
            text-sm
            text-gray-400
            mt-6
            ">

                Built with ❤️ by Zuha Ahmad

            </p>




            <p className="
            text-sm
            text-gray-400
            mt-2
            ">

                © 2026 ScholarMate AI. All rights reserved.

            </p>



        </footer>

    );

}


export default Footer;