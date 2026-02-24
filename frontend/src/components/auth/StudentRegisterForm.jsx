import React from "react";
import { Hash, User, Mail, GitBranch, Phone, Lock } from "lucide-react";
import FormField from "./FormField";
import { BRANCH_OPTIONS } from "../../constants/branches";

/**
 * Student registration form with all required fields.
 * Fields: Roll No, Name, Email, Branch (dropdown), Guardian Email, Guardian Phone, Password
 *
 * @param {Object} props
 * @param {Object} props.formData - Form state object
 * @param {Function} props.onChange - Handler: (fieldName, value) => void
 */
const StudentRegisterForm = ({ formData, onChange }) => {
  const handleChange = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="space-y-4">
      <FormField
        label="Roll No"
        type="text"
        value={formData.rollNo}
        onChange={handleChange("rollNo")}
        placeholder="e.g. 22CS101"
        icon={Hash}
        required
      />

      <FormField
        label="Full Name"
        type="text"
        value={formData.name}
        onChange={handleChange("name")}
        placeholder="John Doe"
        icon={User}
        required
      />

      <FormField
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={handleChange("email")}
        placeholder="student@college.edu"
        icon={Mail}
        required
      />

      <FormField
        label="Branch"
        type="select"
        value={formData.branchName}
        onChange={handleChange("branchName")}
        placeholder="Select your branch"
        icon={GitBranch}
        required
        options={BRANCH_OPTIONS}
      />

      <FormField
        label="Guardian / Parent Email"
        type="email"
        value={formData.guardianEmail}
        onChange={handleChange("guardianEmail")}
        placeholder="parent@email.com"
        icon={Mail}
      />

      <FormField
        label="Guardian / Parent Phone"
        type="tel"
        value={formData.guardianPhone}
        onChange={handleChange("guardianPhone")}
        placeholder="10-digit number"
        icon={Phone}
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

export default StudentRegisterForm;
