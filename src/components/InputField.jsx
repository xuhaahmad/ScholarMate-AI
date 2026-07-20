function InputField({
    label,
    name,
    placeholder,
    value,
    onChange
}) {


    return (

        <div>


            <label className="font-medium text-text">

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
                p-4
                rounded-2xl
                focus:outline-none
                focus:ring-2
                focus:ring-primary
                "

            />


        </div>

    );

}


export default InputField;