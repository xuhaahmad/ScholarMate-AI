function FeatureCard({ icon, title, description }) {


    return (

        <div className="
        bg-white
        p-6
        rounded-3xl
        shadow
        ">


            <div className="text-4xl">

                {icon}

            </div>



            <h3 className="
            text-xl
            font-bold
            mt-4
            text-text
            ">

                {title}

            </h3>



            <p className="
            mt-3
            text-muted
            ">

                {description}

            </p>


        </div>

    );

}


export default FeatureCard;