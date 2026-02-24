import React from "react";
import { User, Mail, Briefcase, Lock } from "lucide-react";
import FormField from "./FormField";

/**
 * Teacher registration form with required fields.
 * Fields: Name, Email, Department, Password
 *
 * @param {Object} props
 * @param {Object} props.formData - Form state object
 * @param {Function} props.onChange - Handler: (fieldName, value) => void
 */
const TeacherRegisterForm = ({ formData, onChange }) => {
  const handleChange = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="space-y-4">
      <FormField
        label="Full Name"
        type="text"
        value={formData.name}
        onChange={handleChange("name")}
        placeholder="Dr. Jane Smith"
        icon={User}
        required
      />

      <FormField
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={handleChange("email")}
        placeholder="teacher@college.edu"
        icon={Mail}
        required
      />

      <FormField
        label="Department"
        type="text"
        value={formData.department}
        onChange={handleChange("department")}
        placeholder="e.g. Computer Science"
        icon={Briefcase}
        required
      />

      <FormField
        label="Password"
        type="password"
        value={formData.password}
        onChange={handleChange("password")}
        placeholder="••••••••"
        icon={Lock}
        required
      />
    </div>
  );
};

export default TeacherRegisterForm;
