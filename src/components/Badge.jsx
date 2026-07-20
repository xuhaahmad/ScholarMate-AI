function Badge({ children }) {

    return (

        <span

            className="
            bg-secondary
            text-primary
            px-4
            py-2
            rounded-full
            text-sm
            font-medium
            "

        >

            {children}

        </span>

    );

}


export default Badge;