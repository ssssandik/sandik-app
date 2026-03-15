import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">

        <h1 className="text-4xl font-bold mb-4">
          Sandik
        </h1>

        <p className="text-slate-500 mb-6">
          Building contribution management
        </p>

        <div className="flex gap-4 justify-center">

          <Link
            to="/login"
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="px-6 py-3 border rounded-xl"
          >
            Create Account
          </Link>

        </div>

      </div>
    </div>
  );
}
