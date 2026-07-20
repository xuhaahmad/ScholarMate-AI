function Button({ children, onClick }) {

    return (

        <button

            onClick={onClick}

            className="
            w-full
            bg-primary
            hover:bg-primaryDark
            text-white
            py-4
            rounded-2xl
            font-semibold
            transition
            "

        >

            {children}

        </button>

    );

}


export default Button;