import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full border-3 text-xs sm:text-sm md:text-base lg:text-lg gap-10 text-center">
        <Link
          to="/privacy"
          className="mx-4 px-1 py-0.9 text-blue-600 font-bold hover:bg-sky-200"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="mx-4 px-1 py-0.9 text-blue-600 font-bold hover:bg-sky-200"
        >
          Terms of Service
        </Link>
    </footer>
  );
}
