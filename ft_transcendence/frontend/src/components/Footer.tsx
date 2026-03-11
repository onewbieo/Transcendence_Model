import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full border-3 text-xs sm:text-sm md:text-base lg:text-lg gap-10 text-center">
        <Link
          to="/privacy"
          className="mx-4 text-blue-600 font-bold hover:bg-sky-300"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="mx-4 text-blue-600 font-bold hover:bg-sky-300"
        >
          Terms of Service
        </Link>
    </footer>
  );
}
