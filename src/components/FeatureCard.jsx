function FeatureCard({ icon, title, description }) {


    return (

        <div className="
        group
        bg-white
        border
        border-secondary
        rounded-3xl
        p-8
        transition
        duration-300
        hover:bg-secondary/20
        ">



            <div className="
            w-12
            h-12
            rounded-2xl
            bg-secondary
            flex
            items-center
            justify-center
            text-2xl
            group-hover:scale-110
            transition
            ">

                {icon}

            </div>





            <h3 className="
            mt-6
            text-xl
            font-semibold
            text-text
            ">

                {title}

            </h3>





            <p className="
            mt-3
            text-muted
            leading-relaxed
            ">

                {description}

            </p>


        </div>

    );

}


export default FeatureCard;