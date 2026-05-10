import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Daily Field Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account to continue</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
