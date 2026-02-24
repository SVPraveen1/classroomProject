import React from "react";

/**
 * Reusable form field component supporting text inputs and select dropdowns.
 * Eliminates repetitive form field markup across registration forms.
 *
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {string} props.type - Input type (text, email, password, tel, select)
 * @param {string} props.value - Current field value
 * @param {Function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {React.ElementType} [props.icon] - Lucide icon component
 * @param {boolean} [props.required] - Whether field is required
 * @param {Array} [props.options] - Options array for select type [{ value, label }]
 */
const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  required = false,
  options = [],
}) => {
  const baseInputClasses =
    "block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all duration-200";

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
        )}

        {type === "select" ? (
          <select
            value={value}
            onChange={onChange}
            required={required}
            className={`${baseInputClasses} appearance-none ${Icon ? "pl-10" : ""}`}
          >
            <option value="" disabled>
              {placeholder || "Select an option"}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            required={required}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${baseInputClasses} ${Icon ? "pl-10" : ""}`}
          />
        )}
      </div>
    </div>
  );
};

export default FormField;
