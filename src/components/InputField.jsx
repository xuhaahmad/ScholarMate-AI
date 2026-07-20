function InputField({
    icon,
    label,
    name,
    placeholder,
    value,
    onChange
}) {


    return (

        <div>


            <label className="
            font-medium
            text-text
            flex
            items-center
            gap-2
            ">

                <span>
                    {icon}
                </span>

                {label}

            </label>




            <input

                name={name}

                placeholder={placeholder}

                value={value}

                onChange={onChange}

                className="
                w-full
                mt-2
                border
                border-gray-200
                p-4
                rounded-2xl
                bg-background
                focus:outline-none
                focus:ring-2
                focus:ring-primary
                transition
                "

            />


        </div>

    );

}


export default InputField;