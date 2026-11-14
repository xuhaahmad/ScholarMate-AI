const FIELD_CLASSES = `
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
                `;


function InputField({
    icon,
    label,
    name,
    placeholder,
    value,
    onChange,
    required = false,
    options,
    inputMode,
    suggestions
}) {


    return (

        <div>


            <label
            htmlFor={name}
            className="
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




            {options ? (

                // Same look as the text input; used for fixed choices.
                <select

                    id={name}

                    name={name}

                    value={value}

                    onChange={onChange}

                    required={required}

                    // Grey like an input placeholder until a choice is made.
                    className={`${FIELD_CLASSES} ${value ? "text-text" : "text-gray-400"}`}

                >

                    <option value="">
                        {placeholder}
                    </option>

                    {options.map((option) => (

                        <option key={option.value} value={option.value} className="text-text">
                            {option.label}
                        </option>

                    ))}

                </select>

            ) : (

                <input

                    id={name}

                    name={name}

                    placeholder={placeholder}

                    value={value}

                    onChange={onChange}

                    required={required}

                    inputMode={inputMode}

                    list={suggestions ? `${name}-suggestions` : undefined}

                    className={FIELD_CLASSES}

                />

            )}


            {/* Optional typing suggestions; any other value can still be entered. */}

            {suggestions && !options && (

                <datalist id={`${name}-suggestions`}>

                    {suggestions.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                    ))}

                </datalist>

            )}


        </div>

    );

}


export default InputField;
